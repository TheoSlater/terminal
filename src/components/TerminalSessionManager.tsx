import { useCallback } from "react";
import { useSessions } from "@/hooks/useSessions";
import { ResizeHandles } from "./terminal/ResizeHandles";
import { TerminalSession } from "./terminal/TerminalSession";
import { TitleBar } from "./workspace/TitleBar";

export function TerminalSessionManager() {
  const {
    activeId,
    closeSession,
    newSession,
    sessions,
    setActiveId,
    updateSession,
  } = useSessions();

  const handleStarted = useCallback(
    (id: string, cwd: string) => updateSession(id, { cwd, status: "running" }),
    [updateSession],
  );
  const handleTitle = useCallback(
    (id: string, title: string) =>
      updateSession(id, { title: title.trim() || "terminal" }),
    [updateSession],
  );
  const handleExit = useCallback(
    (id: string) => updateSession(id, { status: "exited" }),
    [updateSession],
  );

  return (
    <main className="terminal-shell">
      <TitleBar
        activeId={activeId}
        sessions={sessions}
        onNew={newSession}
        onClose={closeSession}
        onSelect={setActiveId}
      />

      <div className="terminal-sessions">
        {sessions.map((session) => (
          <TerminalSession
            key={session.id}
            active={session.id === activeId}
            sessionId={session.id}
            onStarted={(cwd) => handleStarted(session.id, cwd)}
            onTitle={(title) => handleTitle(session.id, title)}
            onExit={() => handleExit(session.id)}
          />
        ))}
      </div>

      <ResizeHandles active={sessions.length > 0} />
    </main>
  );
}
