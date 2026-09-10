import { getCurrentWindow } from "@tauri-apps/api/window";
import { Plus } from "lucide-react";
import { motion } from "motion/react";
import { fadeVariants, microMotion } from "@/lib/motion";
import type { Session } from "@/types/terminal";
import { SessionTabs } from "./SessionTabs";
import { WindowControls } from "./WindowControls";

type Props = {
  activeId: string | null;
  sessions: Session[];
  onNew: () => void;
  onClose: (id: string) => void;
  onSelect: (id: string) => void;
};

export function TitleBar({
  activeId,
  sessions,
  onNew,
  onClose,
  onSelect,
}: Props) {
  const appWindow = getCurrentWindow();

  const handleDrag = (event: React.MouseEvent) => {
    if (event.button === 0) void appWindow.startDragging();
  };

  return (
    <motion.header
      data-tauri-drag-region
      className="titlebar"
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      onMouseDown={handleDrag}
    >
      <span className="titlebar-brand">terminal</span>

      <SessionTabs
        activeId={activeId}
        sessions={sessions}
        onClose={onClose}
        onSelect={onSelect}
      />

      <motion.button
        {...microMotion}
        type="button"
        className="titlebar-action"
        aria-label="New terminal"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={onNew}
      >
        <Plus aria-hidden="true" />
      </motion.button>

      <WindowControls />
    </motion.header>
  );
}
