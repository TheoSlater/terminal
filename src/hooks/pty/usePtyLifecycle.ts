import type { UnlistenFn } from "@tauri-apps/api/event";
import { useLayoutEffect, useRef } from "react";
import { ptyClient } from "@/lib/pty/client";
import { logPtyError } from "@/lib/pty/errors";
import { listenPtyExit, listenPtyOutput } from "@/lib/pty/events";

type Lifecycle = {
  cancelled: boolean;
  cleanups: UnlistenFn[];
  startPromise: Promise<void> | null;
  started: boolean;
};

type Handlers = {
  onWrite: (data: Uint8Array) => void;
  onExit: (code: number | null) => void;
  onConnectedChange: (connected: boolean) => void;
};

/**
 * Installs PTY event listeners for a single session and handles cleanup
 * (stop PTY + remove listeners) on unmount or sessionId change.
 */
export function usePtyLifecycle(sessionId: string, handlers: Handlers) {
  const lifecycleRef = useRef<Lifecycle | null>(null);
  const listenersReadyRef = useRef<Promise<void>>(Promise.resolve());
  const handlersRef = useRef(handlers);

  useLayoutEffect(() => {
    handlersRef.current = handlers;
  });

  useLayoutEffect(() => {
    const lifecycle: Lifecycle = {
      cancelled: false,
      cleanups: [],
      startPromise: null,
      started: false,
    };
    lifecycleRef.current = lifecycle;

    const ready = Promise.all([
      listenPtyOutput((payload) => {
        if (payload.sessionId !== sessionId) return;
        handlersRef.current.onWrite(Uint8Array.from(payload.data));
      }),
      listenPtyExit((payload) => {
        if (payload.sessionId !== sessionId) return;
        handlersRef.current.onConnectedChange(false);
        if (lifecycleRef.current === lifecycle) lifecycle.started = false;
        handlersRef.current.onExit(payload.code);
      }),
    ])
      .then((listeners) => {
        if (lifecycle.cancelled) listeners.forEach((c) => c());
        else lifecycle.cleanups = listeners;
      })
      .catch((error) => {
        logPtyError("unable to install PTY listeners", error);
        throw error;
      });

    listenersReadyRef.current = ready;

    return () => {
      lifecycle.cancelled = true;
      handlersRef.current.onConnectedChange(false);
      lifecycle.cleanups.forEach((c) => c());
      lifecycle.cleanups = [];
      if (lifecycle.started) {
        lifecycle.started = false;
        void ptyClient
          .stop(sessionId)
          .catch((e) => logPtyError("unable to stop PTY", e));
      }
      if (lifecycleRef.current === lifecycle) lifecycleRef.current = null;
    };
  }, [sessionId]);

  return { lifecycleRef, listenersReadyRef };
}
