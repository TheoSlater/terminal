import type { useTerminal } from "@wterm/react";
import { useEffect, useRef, type RefObject } from "react";
import { TERMINAL_SAFE_SIZE } from "@/constants/terminal";
import {
  measureCellMetrics,
  viewportToGrid,
  type CellMetrics,
  type ViewportSize,
} from "@/lib/terminal/geometry";
import {
  createResizeStats,
  reportResizeStats,
  resizeExperiment,
  sampleRendererStats,
} from "@/lib/terminal/resizeDebug";

type TerminalRef = ReturnType<typeof useTerminal>["ref"];

/**
 * Observes the viewport size and keeps the wterm core + native PTY in sync.
 * Handles cell probing, DPR changes, and font loading.
 */
export function useTerminalResize(
  active: boolean,
  ready: boolean,
  terminalRef: TerminalRef,
  viewportRef: RefObject<HTMLDivElement | null>,
  onResize: (cols: number, rows: number) => void,
  debugLabel?: string,
) {
  const sizeRef = useRef<{ cols: number; rows: number }>({
    ...TERMINAL_SAFE_SIZE,
  });

  useEffect(() => {
    if (!active || !ready) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    let disposed = false;
    let frame: number | null = null;
    let metrics: CellMetrics | null = null;
    let latestSize: ViewportSize | null = null;
    let idleTimer: number | null = null;
    const stats = createResizeStats();
    const terminal = terminalRef.current?.instance;
    const internals = terminal as unknown as {
      _doRender?: () => void;
      _resizeTestFrozen?: boolean;
    } | null;
    const originalRender = internals?._doRender;

    if (resizeExperiment === "freeze-dom" && terminal && originalRender) {
      const render = originalRender.bind(terminal);
      Reflect.set(internals, "_doRender", () => {
        if (!internals._resizeTestFrozen) render();
      });
    }

    const setResizePhase = (resizing: boolean) => {
      if (resizeExperiment === "hide") {
        if (resizing) viewport.dataset.resizeTest = "hide";
        else delete viewport.dataset.resizeTest;
      }
      if (resizeExperiment === "freeze-dom" && internals) {
        Reflect.set(internals, "_resizeTestFrozen", resizing);
        if (!resizing) internals._doRender?.();
      }
    };

    const scheduleResizeEnd = () => {
      setResizePhase(true);
      if (idleTimer !== null) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        idleTimer = null;
        setResizePhase(false);
      }, 100);
    };

    const report = () => {
      sampleRendererStats(stats, terminalRef.current?.instance?.debug?.perf);
      reportResizeStats(stats, performance.now(), debugLabel);
    };

    const scheduleMeasure = () => {
      if (disposed || frame !== null) return;
      frame = requestAnimationFrame(measure);
    };

    const invalidateMetrics = () => {
      metrics = null;
      scheduleMeasure();
    };

    const measure = () => {
      frame = null;
      if (disposed) return;
      const startedAt = performance.now();

      const terminalEl = terminalRef.current?.instance?.element;
      const size = latestSize ?? {
        height: viewport.clientHeight,
        width: viewport.clientWidth,
      };
      if (!terminalEl || size.width <= 0 || size.height <= 0) {
        track(startedAt);
        return;
      }

      metrics ??= measureCellMetrics(terminalEl);
      if (!metrics) {
        track(startedAt);
        return;
      }

      const grid = viewportToGrid(size, metrics);
      stats.gridCalculations += 1;
      if (!grid) {
        track(startedAt);
        return;
      }

      if (
        sizeRef.current.cols === grid.cols &&
        sizeRef.current.rows === grid.rows
      ) {
        track(startedAt);
        return;
      }

      stats.gridChanges += 1;
      if (resizeExperiment !== "disable-core") {
        terminalRef.current?.resize(grid.cols, grid.rows);
        stats.coreResizes += 1;
      }
      sizeRef.current = grid;
      if (resizeExperiment !== "disable-pty") onResize(grid.cols, grid.rows);
      track(startedAt);
    };

    const track = (startedAt: number) => {
      const duration = performance.now() - startedAt;
      stats.handlerCalls += 1;
      stats.totalHandlerMs += duration;
      stats.longestHandlerMs = Math.max(stats.longestHandlerMs, duration);
      report();
    };

    // Observe viewport size
    const resizeObserver = new ResizeObserver((entries) => {
      stats.callbacks += 1;
      scheduleResizeEnd();
      const entry = entries[entries.length - 1];
      if (entry)
        latestSize = {
          height: entry.contentRect.height,
          width: entry.contentRect.width,
        };
      scheduleMeasure();
    });
    resizeObserver.observe(viewport);
    scheduleMeasure();

    // Fonts & DPR changes affect cell size
    const onFontLoad = () => invalidateMetrics();
    document.fonts.addEventListener("loadingdone", onFontLoad);
    void document.fonts.ready.then(onFontLoad);

    let dpr = window.devicePixelRatio;
    const onWindowResize = () => {
      if (window.devicePixelRatio !== dpr) {
        dpr = window.devicePixelRatio;
        invalidateMetrics();
      }
    };
    window.addEventListener("resize", onWindowResize);

    const reportTimer = window.setInterval(report, 1000);

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      document.fonts.removeEventListener("loadingdone", onFontLoad);
      window.removeEventListener("resize", onWindowResize);
      window.clearInterval(reportTimer);
      if (idleTimer !== null) window.clearTimeout(idleTimer);
      setResizePhase(false);
      if (resizeExperiment === "freeze-dom" && internals && originalRender) {
        // Restore library method before next activation.
        Reflect.set(internals, "_doRender", originalRender);
      }
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [active, debugLabel, onResize, ready, terminalRef, viewportRef]);
}
