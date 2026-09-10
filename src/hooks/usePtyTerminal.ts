import { useCallback, useLayoutEffect, useRef } from "react";
import { TERMINAL_SAFE_SIZE } from "@/constants/terminal";
import { ptyClient } from "@/lib/pty/client";
import { logPtyError } from "@/lib/pty/errors";
import type { TerminalSize } from "@/types/terminal";
import { usePtyLifecycle } from "./pty/usePtyLifecycle";
import { usePtyResizeQueue } from "./pty/usePtyResizeQueue";

/**
 * Manages the PTY for one terminal session:
 * - connects event listeners (output / exit)
 * - starts / stops the native PTY
 * - throttles resize IPC
 * - forwards user input
 */
export function usePtyTerminal(
  sessionId: string,
  write: (data: string | Uint8Array) => void,
  focus: () => void,
  onStarted?: (cwd: string) => void,
  onExit?: (code: number | null) => void,
) {
  const sizeRef = useRef<TerminalSize>(TERMINAL_SAFE_SIZE);
  const connectedRef = useRef(false);

  // Keep latest callbacks without re-creating listeners
  const writeRef = useRef(write);
  const focusRef = useRef(focus);
  const onStartedRef = useRef(onStarted);
  const onExitRef = useRef(onExit);

  useLayoutEffect(() => {
    writeRef.current = write;
    focusRef.current = focus;
    onStartedRef.current = onStarted;
    onExitRef.current = onExit;
  }, [write, focus, onStarted, onExit]);

  const isConnected = useCallback(() => connectedRef.current, []);
  const { enqueue: enqueueResize, reset: resetResize } = usePtyResizeQueue(
    sessionId,
    isConnected,
  );

  const { lifecycleRef, listenersReadyRef } = usePtyLifecycle(sessionId, {
    onConnectedChange: (connected) => {
      connectedRef.current = connected;
    },
    onExit: (code) => onExitRef.current?.(code),
    onWrite: (data) => writeRef.current(data),
  });

  // Reset resize queue when session tears down (lifecycle handles connected=false)
  useLayoutEffect(() => {
    return () => {
      resetResize();
    };
  }, [resetResize, sessionId]);

  const start = useCallback(() => {
    const lc = lifecycleRef.current;
    if (!lc || lc.cancelled) return Promise.resolve();
    if (lc.startPromise) return lc.startPromise;

    const promise = (async () => {
      await listenersReadyRef.current;
      if (lc.cancelled || lifecycleRef.current !== lc) return;

      const startSize = sizeRef.current;
      const cwd = await ptyClient.start(
        sessionId,
        startSize.cols,
        startSize.rows,
      );

      if (lc.cancelled || lifecycleRef.current !== lc) {
        await ptyClient.stop(sessionId);
        return;
      }

      lc.started = true;
      connectedRef.current = true;
      onStartedRef.current?.(cwd);
      focusRef.current();

      // If size changed while PTY was starting, enqueue the latest size
      if (
        sizeRef.current.cols !== startSize.cols ||
        sizeRef.current.rows !== startSize.rows
      ) {
        enqueueResize(sizeRef.current);
      }
    })().catch((e) => logPtyError("unable to start the native PTY", e));

    lc.startPromise = promise;
    return promise;
  }, [enqueueResize, lifecycleRef, listenersReadyRef, sessionId]);

  const writeInput = useCallback(
    (data: string) => {
      void ptyClient
        .write(sessionId, data)
        .catch((e) => logPtyError("unable to write PTY input", e));
    },
    [sessionId],
  );

  const resize = useCallback(
    (cols: number, rows: number) => {
      const next: TerminalSize = {
        cols: Math.max(1, Math.floor(cols)),
        rows: Math.max(1, Math.floor(rows)),
      };
      if (
        sizeRef.current.cols === next.cols &&
        sizeRef.current.rows === next.rows
      )
        return;
      sizeRef.current = next;
      if (connectedRef.current) enqueueResize(next);
    },
    [enqueueResize],
  );

  return { resize, start, writeInput };
}
