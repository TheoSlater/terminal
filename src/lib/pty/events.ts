import { listen } from "@tauri-apps/api/event";
import { PTY_EVENTS } from "@/constants/terminal";
import type { PtyExit, PtyOutput } from "@/types/terminal";

export function listenPtyOutput(handler: (payload: PtyOutput) => void) {
  return listen<PtyOutput>(PTY_EVENTS.output, (event) =>
    handler(event.payload),
  );
}

export function listenPtyExit(handler: (payload: PtyExit) => void) {
  return listen<PtyExit>(PTY_EVENTS.exit, (event) => handler(event.payload));
}
