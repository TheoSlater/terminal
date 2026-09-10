/** Fallback grid size used before the viewport is measured. */
export const TERMINAL_SAFE_SIZE = { cols: 80, rows: 24 } as const;

/** Options passed to GhosttyCore on load — controls colors and scrollback. */
export const GHOSTTY_OPTIONS = {
  foregroundColor: "#d7dee8",
  backgroundColor: "#202124",
  scrollbackLimit: 2 * 1024 * 1024,
} as const;

/** Tauri event names emitted by the Rust PTY backend. */
export const PTY_EVENTS = {
  output: "pty-output",
  exit: "pty-exit",
} as const;
