import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useCallback, useLayoutEffect, useRef } from "react";
import {
  PTY_EVENTS,
  TERMINAL_SAFE_SIZE,
  TERMINAL_SESSION_ID,
} from "../constants/terminal";

type TerminalSize = { cols: number; rows: number };
type PtyLifecycle = {
  cancelled: boolean;
  cleanups: UnlistenFn[];
  startPromise: Promise<void> | null;
  started: boolean;
};

export function usePtyTerminal(
  write: (data: string | Uint8Array) => void,
  focus: () => void,
  onOutput?: () => void,
) {
  const sizeRef = useRef<TerminalSize>(TERMINAL_SAFE_SIZE);
  const connectedRef = useRef(false);
  const writeRef = useRef(write);
  const focusRef = useRef(focus);
  const onOutputRef = useRef(onOutput);
  const lifecycleRef = useRef<PtyLifecycle | null>(null);
  const listenersReadyRef = useRef<Promise<void>>(Promise.resolve());

  useLayoutEffect(() => {
    writeRef.current = write;
    focusRef.current = focus;
    onOutputRef.current = onOutput;
  }, [focus, onOutput, write]);

  useLayoutEffect(() => {
    const lifecycle: PtyLifecycle = {
      cancelled: false,
      cleanups: [],
      startPromise: null,
      started: false,
    };
    lifecycleRef.current = lifecycle;

    const listenersReady = Promise.all([
      listen<number[]>(PTY_EVENTS.output, (event) => {
        writeRef.current(Uint8Array.from(event.payload));
        onOutputRef.current?.();
      }),
      listen(PTY_EVENTS.exit, () => {
        connectedRef.current = false;
      }),
    ])
      .then((listeners) => {
        if (lifecycle.cancelled) {
          listeners.forEach((cleanup) => cleanup());
          return;
        }
        lifecycle.cleanups = listeners;
      })
      .catch((error) => {
        console.error("[terminal][frontend] unable to install PTY listeners", error);
        throw error;
      });
    listenersReadyRef.current = listenersReady;

    return () => {
      lifecycle.cancelled = true;
      connectedRef.current = false;
      lifecycle.cleanups.forEach((cleanup) => cleanup());
      lifecycle.cleanups = [];
      if (lifecycle.started) {
        lifecycle.started = false;
        void invoke("stop_pty", { sessionId: TERMINAL_SESSION_ID }).catch(
          (error) => console.error("[terminal][frontend] unable to stop PTY", error),
        );
      }
      if (lifecycleRef.current === lifecycle) lifecycleRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    const lifecycle = lifecycleRef.current;
    if (!lifecycle || lifecycle.cancelled) return Promise.resolve();
    if (lifecycle.startPromise) return lifecycle.startPromise;
    const listenersReady = listenersReadyRef.current;

    const startPromise = (async () => {
      await listenersReady;
      if (lifecycle.cancelled || lifecycleRef.current !== lifecycle) return;
      await invoke("start_pty", {
        sessionId: TERMINAL_SESSION_ID,
        ...TERMINAL_SAFE_SIZE,
      });
      if (lifecycle.cancelled || lifecycleRef.current !== lifecycle) {
        await invoke("stop_pty", { sessionId: TERMINAL_SESSION_ID });
        return;
      }
      lifecycle.started = true;
      connectedRef.current = true;
      focusRef.current();
    })().catch((error) => {
      console.error("[terminal][frontend] unable to start the native PTY", error);
    });
    lifecycle.startPromise = startPromise;
    return startPromise;
  }, []);

  const writeInput = useCallback((data: string) => {
    void invoke("write_pty", { sessionId: TERMINAL_SESSION_ID, data }).catch(
      (error) => console.error("[terminal][frontend] unable to write PTY input", error),
    );
  }, []);

  const resize = useCallback((cols: number, rows: number) => {
    const nextSize = {
      cols: Math.max(1, Math.floor(cols)),
      rows: Math.max(1, Math.floor(rows)),
    };
    if (
      sizeRef.current?.cols === nextSize.cols &&
      sizeRef.current.rows === nextSize.rows
    )
      return;
    sizeRef.current = nextSize;
    if (connectedRef.current) {
      void invoke("terminal_resize", {
        sessionId: TERMINAL_SESSION_ID,
        ...nextSize,
      }).catch((error) =>
        console.error("[terminal][frontend] unable to resize PTY", error),
      );
    }
  }, []);
  return { resize, start, writeInput };
}
