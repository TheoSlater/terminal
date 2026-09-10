import { getCurrentWindow } from "@tauri-apps/api/window";
import { Plus } from "lucide-react";
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
    <header
      data-tauri-drag-region
      className="titlebar"
      onMouseDown={handleDrag}
    >
      <span className="titlebar-brand">terminal</span>

      <SessionTabs
        activeId={activeId}
        sessions={sessions}
        onClose={onClose}
        onSelect={onSelect}
      />

      <button
        type="button"
        className="titlebar-action"
        aria-label="New terminal"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={onNew}
      >
        <Plus aria-hidden="true" />
      </button>

      <WindowControls />
    </header>
  );
}
