import { GhosttyCore } from "@wterm/ghostty";
import { Terminal, useTerminal } from "@wterm/react";
import { usePtyTerminal } from "../hooks/usePtyTerminal";
import { useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { TERMINAL_SAFE_SIZE } from "../constants/terminal";

export function TerminalSession({ core }: { core: GhosttyCore }) {
  const { ref, write, focus } = useTerminal();
  const [outputReceived, setOutputReceived] = useState(false);
  const { resize, start, writeInput } = usePtyTerminal(
    write,
    focus,
    () => setOutputReceived(true),
  );
  const viewportRef = useRef<HTMLDivElement>(null);
  const readyRef = useRef(false);
  const [ready, setReady] = useState(false);
  const terminalSizeRef = useRef<{ cols: number; rows: number }>(
    TERMINAL_SAFE_SIZE,
  );
  useEffect(() => {
    if (!ready || !outputReceived) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    const measure = () => {
      const terminal = ref.current?.instance?.element;
      if (!terminal || !readyRef.current) return;
      const style = getComputedStyle(terminal);
      const viewportWidth = viewport.clientWidth;
      const viewportHeight = viewport.clientHeight;
      if (viewportWidth <= 0 || viewportHeight <= 0) return;
      const probe = document.createElement("span");
      probe.textContent = "W";
      probe.style.cssText = `position:absolute;visibility:hidden;font:${style.font};line-height:${style.lineHeight};`;
      terminal.appendChild(probe);
      const cellWidth = probe.getBoundingClientRect().width;
      const cellHeight = probe.getBoundingClientRect().height;
      probe.remove();
      const width =
        viewportWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight);
      const height =
        viewportHeight -
        parseFloat(style.paddingTop) -
        parseFloat(style.paddingBottom);
      const cols = Math.floor(width / cellWidth);
      const rows = Math.floor(height / cellHeight);
      if (
        !Number.isFinite(cellWidth) ||
        !Number.isFinite(cellHeight) ||
        cellWidth <= 0 ||
        cellHeight <= 0 ||
        !Number.isFinite(cols) ||
        !Number.isFinite(rows) ||
        cols < 2 ||
        rows < 2
      )
        return;
      if (
        terminalSizeRef.current.cols === cols &&
        terminalSizeRef.current.rows === rows
      )
        return;
      terminalSizeRef.current = { cols, rows };
      ref.current?.resize(cols, rows);
      resize(cols, rows);
    };
    const observer = new ResizeObserver(() => {
      void document.fonts.ready.then(() => requestAnimationFrame(measure));
    });
    observer.observe(viewport);
    void document.fonts.ready.then(measure);
    return () => observer.disconnect();
  }, [core, outputReceived, ready, ref, resize]);
  const appWindow = getCurrentWindow();
  return (
    <main className="terminal-shell">
      <header
        data-tauri-drag-region
        className="titlebar"
        onMouseDown={(event) => {
          if (event.button === 0) void appWindow.startDragging();
        }}
      >
        <span className="titlebar-brand">terminal</span>
        <div className="window-controls">
          <button
            aria-label="Minimize"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={() => void appWindow.minimize()}
          >
            −
          </button>
          <button
            aria-label="Maximize"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={() => void appWindow.toggleMaximize()}
          >
            □
          </button>
          <button
            aria-label="Close"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={() => void appWindow.close()}
          >
            ×
          </button>
        </div>
      </header>
      <div ref={viewportRef} className="terminal-viewport">
        <Terminal
          ref={ref}
          core={core}
          cols={TERMINAL_SAFE_SIZE.cols}
          rows={TERMINAL_SAFE_SIZE.rows}
          autoResize={false}
          cursorBlink
          maxImageWidth={1600}
          maxImageHeight={1000}
          style={{ height: "100%" }}
          onReady={(wterm) => {
            if (wterm !== ref.current?.instance) return;
            // WTerm locks height when autoResize is disabled. The session owns
            // sizing, so keep the mounted terminal at the full viewport height.
            wterm.element.style.height = "100%";
            readyRef.current = true;
            void start();
            setReady(true);
          }}
          onError={(error) =>
            console.error("[terminal][renderer] wterm initialization failed", error)
          }
          onData={writeInput}
          className="terminal"
        />
      </div>
      <div className="resize-handles" aria-hidden="true">
        {(
          [
            ["North", "resize-handle north"],
            ["South", "resize-handle south"],
            ["East", "resize-handle east"],
            ["West", "resize-handle west"],
            ["NorthWest", "resize-handle north-west"],
            ["NorthEast", "resize-handle north-east"],
            ["SouthWest", "resize-handle south-west"],
            ["SouthEast", "resize-handle south-east"],
          ] as const
        ).map(([direction, className]) => (
          <div
            key={direction}
            className={className}
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void appWindow.startResizeDragging(direction);
            }}
          />
        ))}
      </div>
    </main>
  );
}
