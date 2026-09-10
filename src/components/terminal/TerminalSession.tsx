import { useTerminal } from "@wterm/react";
import { useCallback, useRef, useState } from "react";
import { useAutoFocus } from "@/hooks/useAutoFocus";
import { useGhosttyCore } from "@/hooks/useGhosttyCore";
import { usePtyTerminal } from "@/hooks/usePtyTerminal";
import { useTerminalResize } from "@/hooks/useTerminalResize";
import type { TerminalSessionProps } from "@/types/terminal";
import { TerminalView } from "./TerminalView";

export function TerminalSession({
  active,
  onExit,
  onStarted,
  onTitle,
  sessionId,
}: TerminalSessionProps) {
  const { ref, write, focus } = useTerminal();
  const core = useGhosttyCore();
  const [ready, setReady] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  const { resize, start, writeInput } = usePtyTerminal(
    sessionId,
    write,
    focus,
    onStarted,
    onExit,
  );

  useTerminalResize(active, ready, ref, viewportRef, resize, sessionId);
  useAutoFocus(active, ready, focus);

  const handleReady = useCallback(() => {
    void start();
    setReady(true);
  }, [start]);

  return (
    <div
      aria-hidden={!active}
      className={active ? "terminal-session active" : "terminal-session"}
    >
      <div ref={viewportRef} className="terminal-viewport">
        <TerminalView
          core={core}
          terminalRef={ref}
          onReady={handleReady}
          onTitle={onTitle}
          onData={writeInput}
        />
      </div>
    </div>
  );
}
