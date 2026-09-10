export type CellMetrics = {
  cellWidth: number;
  cellHeight: number;
  paddingX: number;
  paddingY: number;
};

export type ViewportSize = { width: number; height: number };

/** Probe the rendered terminal to discover cell dimensions + padding. */
export function measureCellMetrics(
  terminalEl: HTMLElement,
): CellMetrics | null {
  const style = getComputedStyle(terminalEl);
  const paddingX =
    (Number.parseFloat(style.paddingLeft) || 0) +
    (Number.parseFloat(style.paddingRight) || 0);
  const paddingY =
    (Number.parseFloat(style.paddingTop) || 0) +
    (Number.parseFloat(style.paddingBottom) || 0);

  const rowProbe = document.createElement("div");
  rowProbe.className = "term-row";
  rowProbe.style.cssText =
    "position:absolute;visibility:hidden;pointer-events:none;";
  const cellProbe = document.createElement("span");
  cellProbe.textContent = "W";
  rowProbe.appendChild(cellProbe);
  terminalEl.appendChild(rowProbe);
  const cellWidth = cellProbe.getBoundingClientRect().width;
  const cellHeight = rowProbe.getBoundingClientRect().height;
  rowProbe.remove();

  if (cellWidth <= 0 || cellHeight <= 0) return null;
  return { cellWidth, cellHeight, paddingX, paddingY };
}

/** Convert viewport pixels → grid cols/rows given metrics. Returns null if too small. */
export function viewportToGrid(
  viewport: ViewportSize,
  metrics: CellMetrics,
): { cols: number; rows: number } | null {
  const contentWidth = viewport.width - metrics.paddingX;
  const contentHeight = viewport.height - metrics.paddingY;
  const cols = Math.floor(contentWidth / metrics.cellWidth);
  const rows = Math.floor(contentHeight / metrics.cellHeight);

  if (!Number.isFinite(cols) || !Number.isFinite(rows) || cols < 2 || rows < 2)
    return null;
  return { cols, rows };
}
