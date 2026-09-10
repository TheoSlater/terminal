import { sessionLabel } from "@/lib/session";
import type { Session } from "@/types/terminal";
import { SessionTab } from "./SessionTab";

type Props = {
  activeId: string | null;
  sessions: Session[];
  onClose: (id: string) => void;
  onSelect: (id: string) => void;
};

export function SessionTabs({ activeId, sessions, onClose, onSelect }: Props) {
  return (
    <div className="session-tabs" role="tablist" aria-label="Terminal sessions">
      {sessions.map((session) => (
        <SessionTab
          key={session.id}
          active={session.id === activeId}
          label={sessionLabel(session)}
          onClose={() => onClose(session.id)}
          onSelect={() => onSelect(session.id)}
        />
      ))}
    </div>
  );
}
