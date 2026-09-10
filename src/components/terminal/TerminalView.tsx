import { Terminal, type useTerminal } from "@wterm/react";
import type { WTerm } from "@wterm/dom";
import type { GhosttyCore } from "@wterm/ghostty";
import { TERMINAL_SAFE_SIZE } from "@/constants/terminal";

type TerminalRef = ReturnType<typeof useTerminal>["ref"];

type Props = {
  core: GhosttyCore | null;
  terminalRef: TerminalRef;
  onReady: (wterm: WTerm) => void;
  onTitle: (title: string) => void;
  onData: (data: string) => void;
};

export function TerminalView({
  core,
  terminalRef,
  onReady,
  onTitle,
  onData,
}: Props) {
  if (!core) {
    return <div className="session-loading" aria-hidden="true" />;
  }

  return (
    <Terminal
      ref={terminalRef}
      core={core}
      cols={TERMINAL_SAFE_SIZE.cols}
      rows={TERMINAL_SAFE_SIZE.rows}
      autoResize={false}
      cursorBlink
      debug={import.meta.env.DEV}
      maxImageWidth={1600}
      maxImageHeight={1000}
      style={{ height: "100%" }}
      className="terminal"
      onReady={(wterm) => {
        if (wterm !== terminalRef.current?.instance) return;
        wterm.element.style.height = "100%";
        onReady(wterm);
      }}
      onTitle={onTitle}
      onData={onData}
      onError={(error) => {
        if (import.meta.env.DEV) {
          console.error(
            "[terminal][renderer] wterm initialization failed",
            error,
          );
        }
      }}
    />
  );
}
