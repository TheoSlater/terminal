import { useEffect } from "react";

/** Focus the terminal on activation, deferred to next frame to avoid layout thrash. */
export function useAutoFocus(
  active: boolean,
  ready: boolean,
  focus: () => void,
) {
  useEffect(() => {
    if (!active || !ready) return;
    const frame = requestAnimationFrame(focus);
    return () => cancelAnimationFrame(frame);
  }, [active, focus, ready]);
}
