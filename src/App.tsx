import { GhosttyCore } from "@wterm/ghostty";
import { useEffect, useState } from "react";
import { TerminalSession } from "./components/TerminalSession";
import { GHOSTTY_OPTIONS } from "./constants/terminal";

const corePromise = GhosttyCore.load(GHOSTTY_OPTIONS);

export default function App() {
  const [core, setCore] = useState<Awaited<typeof corePromise> | null>(null);
  useEffect(() => {
    void corePromise
      .then(setCore)
      .catch((error) => console.error("Unable to load GhosttyCore", error));
  }, []);
  if (!core) return <main className="loading">Starting ghosttylib…</main>;
  return <TerminalSession core={core} />;
}
