export type ResizeStats = {
  callbacks: number;
  coreResizes: number;
  gridChanges: number;
  gridCalculations: number;
  handlerCalls: number;
  lastReport: number;
  lastRendererFrames: number;
  lastRendererMs: number;
  longestHandlerMs: number;
  rendererMs: number;
  rendererUpdates: number;
  totalHandlerMs: number;
};

type RendererPerf = {
  avgRenderMs: number;
  frameCount: number;
  totalRenderMs: number;
};

export type ResizeExperiment =
  "normal" | "disable-pty" | "disable-core" | "freeze-dom" | "hide";

export const resizeExperiment: ResizeExperiment =
  import.meta.env.DEV && typeof window !== "undefined"
    ? (new URLSearchParams(window.location.search).get(
        "resizeTest",
      ) as ResizeExperiment) || "normal"
    : "normal";

export function createResizeStats(): ResizeStats {
  return {
    callbacks: 0,
    coreResizes: 0,
    gridChanges: 0,
    gridCalculations: 0,
    handlerCalls: 0,
    lastReport: performance.now(),
    lastRendererFrames: 0,
    lastRendererMs: 0,
    longestHandlerMs: 0,
    rendererMs: 0,
    rendererUpdates: 0,
    totalHandlerMs: 0,
  };
}

export function sampleRendererStats(
  stats: ResizeStats,
  perf: RendererPerf | null | undefined,
) {
  if (!perf) return;
  stats.rendererUpdates += Math.max(
    0,
    perf.frameCount - stats.lastRendererFrames,
  );
  stats.rendererMs += Math.max(0, perf.totalRenderMs - stats.lastRendererMs);
  stats.lastRendererFrames = perf.frameCount;
  stats.lastRendererMs = perf.totalRenderMs;
}

/** Dev-only periodic log. No-op in production. */
export function reportResizeStats(
  stats: ResizeStats,
  now: number,
  label?: string,
) {
  if (!import.meta.env.DEV || now - stats.lastReport < 1000) return;

  const seconds = (now - stats.lastReport) / 1000;
  console.info("[terminal][resize][metrics]", {
    averageHandlerMs: stats.totalHandlerMs / Math.max(1, stats.handlerCalls),
    averageRendererMs: stats.rendererMs / Math.max(1, stats.rendererUpdates),
    callbacksPerSec: stats.callbacks / seconds,
    coreResizesPerSec: stats.coreResizes / seconds,
    gridChangesPerSec: stats.gridChanges / seconds,
    gridCalculationsPerSec: stats.gridCalculations / seconds,
    label,
    longestHandlerMs: stats.longestHandlerMs,
    rendererUpdatesPerSec: stats.rendererUpdates / seconds,
  });

  stats.callbacks = 0;
  stats.coreResizes = 0;
  stats.gridChanges = 0;
  stats.gridCalculations = 0;
  stats.handlerCalls = 0;
  stats.lastReport = now;
  stats.longestHandlerMs = 0;
  stats.rendererMs = 0;
  stats.rendererUpdates = 0;
  stats.totalHandlerMs = 0;
}
