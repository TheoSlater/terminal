import "./index.css";

import { HotkeysProvider } from "@tanstack/react-hotkeys";
import App from "./App";
import ReactDOM from "react-dom/client";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <HotkeysProvider
    defaultOptions={{
      hotkey: { conflictBehavior: "warn" },
      hotkeySequence: { timeout: 1000, conflictBehavior: "warn" },
    }}
  >
    <App />
  </HotkeysProvider>,
);
