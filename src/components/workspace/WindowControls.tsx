import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";

export function WindowControls() {
  const appWindow = getCurrentWindow();

  return (
    <div className="window-controls" onMouseDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label="Minimize"
        onClick={() => void appWindow.minimize()}
      >
        <Minus aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Maximize"
        onClick={() => void appWindow.toggleMaximize()}
      >
        <Square aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Close"
        onClick={() => void appWindow.close()}
      >
        <X aria-hidden="true" />
      </button>
    </div>
  );
}
