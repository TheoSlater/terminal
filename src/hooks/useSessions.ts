import { useCallback, useState } from "react";
import { createSession } from "../lib/session";
import type { Session } from "../types/terminal";

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>(() => [createSession()]);
  const [activeId, setActiveId] = useState<string | null>(
    () => sessions[0]?.id ?? null,
  );

  const newSession = useCallback(() => {
    const session = createSession();
    setSessions((current) => [...current, session]);
    setActiveId(session.id);
    return session.id;
  }, []);

  const closeSession = useCallback((sessionId: string) => {
    setSessions((current) => {
      const index = current.findIndex((session) => session.id === sessionId);
      const next = current.filter((session) => session.id !== sessionId);
      setActiveId((currentActiveId) =>
        currentActiveId === sessionId
          ? (next[index]?.id ?? next[index - 1]?.id ?? null)
          : currentActiveId,
      );
      return next;
    });
  }, []);

  const updateSession = useCallback(
    (sessionId: string, changes: Partial<Session>) => {
      setSessions((c) =>
        c.map((s) => (s.id === sessionId ? { ...s, ...changes } : s)),
      );
    },
    [],
  );

  return {
    activeId,
    closeSession,
    newSession,
    sessions,
    setActiveId,
    updateSession,
  };
}
