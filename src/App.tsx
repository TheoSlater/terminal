import { MotionConfig } from "motion/react";
import { TerminalSessionManager } from "./components/TerminalSessionManager";

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <TerminalSessionManager />
    </MotionConfig>
  );
}
