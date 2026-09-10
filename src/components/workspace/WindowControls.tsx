import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";
import { motion } from "motion/react";
import { microMotion } from "@/lib/motion";

export function WindowControls() {
  const appWindow = getCurrentWindow();

  return (
    <div className="window-controls" onMouseDown={(e) => e.stopPropagation()}>
      <motion.button
        {...microMotion}
        type="button"
        aria-label="Minimize"
        onClick={() => void appWindow.minimize()}
      >
        <Minus aria-hidden="true" />
      </motion.button>
      <motion.button
        {...microMotion}
        type="button"
        aria-label="Maximize"
        onClick={() => void appWindow.toggleMaximize()}
      >
        <Square aria-hidden="true" />
      </motion.button>
      <motion.button
        {...microMotion}
        type="button"
        aria-label="Close"
        onClick={() => void appWindow.close()}
      >
        <X aria-hidden="true" />
      </motion.button>
    </div>
  );
}
