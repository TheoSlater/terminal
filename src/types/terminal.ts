/** Grid dimensions in character cells. */
export type TerminalSize = { cols: number; rows: number };

export type SessionStatus = "starting" | "running" | "exited";

/** One terminal tab/session. */
export type Session = {
  id: string;
  title: string;
  cwd: string | null;
  status: SessionStatus;
};

export type TerminalCommand = {
  id: number;
  type: "clear" | "copy" | "paste";
};

/** Payload for `pty-output` events — raw bytes from the PTY. */
export type PtyOutput = { sessionId: string; data: number[] };

/** Payload for `pty-exit` events. */
export type PtyExit = { sessionId: string; code: number | null };

/** Props for the per-session terminal component. */
export type TerminalSessionProps = {
  sessionId: string;
  active: boolean;
  onStarted: (cwd: string) => void;
  onTitle: (title: string) => void;
  onExit: (code: number | null) => void;
  command: TerminalCommand | null;
  fontSize: number;
};
