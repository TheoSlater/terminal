export const TERMINAL_SESSION_ID = "main";
export const TERMINAL_SAFE_SIZE = { cols: 80, rows: 24 } as const;
export const GHOSTTY_OPTIONS = {
  foregroundColor: "#d7dee8",
  backgroundColor: "#202124",
  scrollbackLimit: 2 * 1024 * 1024,
} as const;
export const PTY_EVENTS = { output: "pty-output", exit: "pty-exit" } as const;
