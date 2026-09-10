import { useCallback, useLayoutEffect, useRef } from "react";
import { ptyClient } from "@/lib/pty/client";
import { logPtyError } from "@/lib/pty/errors";
import type { TerminalSize } from "@/types/terminal";

const RESIZE_DEBOUNCE_MS = 80;

type QueueState = {
  inFlight: boolean;
  pending: TerminalSize | null;
  timer: number | null;
};

/**
 * Trailing PTY resize queue.
 * Coalesces rapid viewport changes and sends latest size after quiet period.
 */
export function usePtyResizeQueue(
  sessionId: string,
  isConnected: () => boolean,
) {
  const queueRef = useRef<QueueState>({
    inFlight: false,
    pending: null,
    timer: null,
  });
  const statsRef = useRef({ count: 0, lastReport: 0 });
  const flushRef = useRef<() => void>(() => undefined);

  useLayoutEffect(() => {
    if (statsRef.current.lastReport === 0)
      statsRef.current.lastReport = performance.now();
  }, []);

  const schedule = useCallback(() => {
    const q = queueRef.current;
    if (!isConnected() || q.inFlight || !q.pending) return;

    if (q.timer !== null) window.clearTimeout(q.timer);

    q.timer = window.setTimeout(() => {
      q.timer = null;
      flushRef.current();
    }, RESIZE_DEBOUNCE_MS);
  }, [isConnected]);

  const flush = useCallback(() => {
    const q = queueRef.current;
    if (!isConnected() || q.inFlight || !q.pending) return;

    const requested = q.pending;
    q.pending = null;
    q.inFlight = true;

    // Dev-only throughput logging
    const stats = statsRef.current;
    stats.count += 1;
    if (import.meta.env.DEV) {
      const now = performance.now();
      if (now - stats.lastReport >= 1000) {
        console.info("[terminal][resize][pty-metrics]", {
          ipcPerSec: stats.count / ((now - stats.lastReport) / 1000),
          sessionId,
        });
        stats.count = 0;
        stats.lastReport = now;
      }
    }

    void ptyClient
      .resize(sessionId, requested.cols, requested.rows)
      .catch((e) => logPtyError("unable to resize PTY", e))
      .finally(() => {
        q.inFlight = false;
        // ponytail: trailing-only PTY resize cuts SIGWINCH redraw storms; final
        // size still flushes after the last viewport change.
        schedule();
      });
  }, [isConnected, schedule, sessionId]);

  useLayoutEffect(() => {
    flushRef.current = flush;
    return () => {
      flushRef.current = () => undefined;
    };
  }, [flush]);

  const enqueue = useCallback(
    (size: TerminalSize) => {
      queueRef.current.pending = size;
      schedule();
    },
    [schedule],
  );

  const reset = useCallback(() => {
    const q = queueRef.current;
    if (q.timer !== null) window.clearTimeout(q.timer);
    q.timer = null;
    q.pending = null;
  }, []);

  return { enqueue, reset, schedule };
}
