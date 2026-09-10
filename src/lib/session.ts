import type { Session } from "@/types/terminal";

/** Human-readable label for a session. Uses the shell title when set, falls back to cwd. */
export function sessionLabel(session: Session): string {
  return session.title !== "terminal"
    ? session.title
    : (session.cwd ?? session.title);
}

export function createSession(): Session {
  return {
    cwd: null,
    id: crypto.randomUUID(),
    status: "starting",
    title: "terminal",
  };
}
