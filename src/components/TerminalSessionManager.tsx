import { useCallback, useState } from "react";
import { useCommandBindings } from "@/hooks/useCommandBindings";
import { useCommandSystem } from "@/hooks/useCommandSystem";
import { COMMAND_IDS, type CommandId } from "@/lib/commands";
import type { TerminalCommand } from "@/types/terminal";
import { useSessions } from "@/hooks/useSessions";
import { ResizeHandles } from "./terminal/ResizeHandles";
import { TerminalSession } from "./terminal/TerminalSession";
import { TitleBar } from "./workspace/TitleBar";
import { CommandPalette } from "./workspace/CommandPalette";

export function TerminalSessionManager() {
  const {
    activeId,
    closeSession,
    newSession,
    sessions,
    setActiveId,
    updateSession,
  } = useSessions();
  const { bindings, conflicts, resetBinding, setBinding } = useCommandBindings();
  const [overlay, setOverlay] = useState<"palette" | "settings" | null>(null);
  const [fontSize, setFontSize] = useState(14);
  const [terminalCommand, setTerminalCommand] = useState<TerminalCommand | null>(null);

  const runTerminalCommand = useCallback(
    (type: TerminalCommand["type"]) => {
      if (!activeId) return;
      setTerminalCommand({ id: Date.now(), type });
    },
    [activeId],
  );

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

  const handleCommand = useCallback(
    (id: CommandId) => {
      if (overlay && id !== "openCommandPalette" && id !== "openSettings") {
        setOverlay(null);
      }

      switch (id) {
        case "newTab":
        case "duplicateTab":
          newSession();
          break;
        case "closeTab":
          if (activeId) closeSession(activeId);
          break;
        case "nextTab": {
          if (sessions.length < 2) break;
          const index = sessions.findIndex((session) => session.id === activeId);
          setActiveId(sessions[(index + 1) % sessions.length]?.id ?? null);
          break;
        }
        case "previousTab": {
          if (sessions.length < 2) break;
          const index = sessions.findIndex((session) => session.id === activeId);
          setActiveId(sessions[(index - 1 + sessions.length) % sessions.length]?.id ?? null);
          break;
        }
        case "openCommandPalette":
          setOverlay("palette");
          break;
        case "openSettings":
          setOverlay("settings");
          break;
        case "closeOverlay":
          setOverlay(null);
          break;
        case "find": {
          const query = window.prompt("Find in terminal");
          if (query) {
            (window as Window & { find?: (text: string) => boolean }).find?.(query);
          }
          break;
        }
        case "copy":
        case "paste":
        case "clearTerminal":
          runTerminalCommand(id === "clearTerminal" ? "clear" : id);
          break;
        case "increaseFontSize":
          setFontSize((size) => Math.min(30, size + 1));
          break;
        case "decreaseFontSize":
          setFontSize((size) => Math.max(10, size - 1));
          break;
        case "resetFontSize":
          setFontSize(14);
          break;
        case "renameTab": {
          const session = sessions.find((candidate) => candidate.id === activeId);
          if (!session) break;
          const title = window.prompt("Rename tab", session.title);
          if (title !== null) handleTitle(session.id, title);
          break;
        }
        default: {
          const tabNumber = COMMAND_IDS.indexOf(id) - COMMAND_IDS.indexOf("jumpToTab1") + 1;
          if (tabNumber >= 1 && tabNumber <= 9) {
            setActiveId(sessions[tabNumber - 1]?.id ?? activeId);
          }
        }
      }
    },
    [activeId, closeSession, handleTitle, newSession, overlay, runTerminalCommand, sessions, setActiveId],
  );

  const { heldKeys, shiftHeld } = useCommandSystem({
    activeScopes: overlay ? ["global", "modal"] : ["global", "workspace", "terminal"],
    bindings,
    onCommand: handleCommand,
  });

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
            command={session.id === activeId ? terminalCommand : null}
            fontSize={fontSize}
          />
        ))}
      </div>

      <ResizeHandles active={sessions.length > 0} />

      {overlay ? (
        <CommandPalette
          mode={overlay}
          bindings={bindings}
          conflicts={conflicts}
          onBindingChange={setBinding}
          onClose={() => setOverlay(null)}
          onReset={resetBinding}
          onRun={handleCommand}
          heldKeys={heldKeys}
          shiftHeld={shiftHeld}
        />
      ) : null}
    </main>
  );
}
