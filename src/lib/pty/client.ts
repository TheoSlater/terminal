import { invoke } from "@tauri-apps/api/core";

export const ptyClient = {
  start: (sessionId: string, cols: number, rows: number) =>
    invoke<string>("start_pty", { sessionId, cols, rows }),

  stop: (sessionId: string) => invoke<void>("stop_pty", { sessionId }),

  write: (sessionId: string, data: string) =>
    invoke<void>("write_pty", { sessionId, data }),

  resize: (sessionId: string, cols: number, rows: number) =>
    invoke<{ cols: number; rows: number }>("terminal_resize", {
      sessionId,
      cols,
      rows,
    }),
} as const;
