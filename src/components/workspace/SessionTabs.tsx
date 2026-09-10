import { AnimatePresence, LayoutGroup } from "motion/react";
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
    <LayoutGroup id="terminal-tabs">
      <div
        className="session-tabs"
        role="tablist"
        aria-label="Terminal sessions"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {sessions.map((session) => (
            <SessionTab
              key={session.id}
              active={session.id === activeId}
              label={sessionLabel(session)}
              onClose={() => onClose(session.id)}
              onSelect={() => onSelect(session.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}
