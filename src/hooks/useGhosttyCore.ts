import { GhosttyCore } from "@wterm/ghostty";
import { useEffect, useRef, useState } from "react";
import { GHOSTTY_OPTIONS } from "@/constants/terminal";

/** Loads the Ghostty WASM core once and shares it via state. Disposes on unmount. */
export function useGhosttyCore() {
  const [core, setCore] = useState<GhosttyCore | null>(null);
  const coreRef = useRef<GhosttyCore | null>(null);

  useEffect(() => {
    let cancelled = false;

    void GhosttyCore.load(GHOSTTY_OPTIONS)
      .then((loaded) => {
        if (cancelled) {
          loaded.dispose();
          return;
        }
        coreRef.current = loaded;
        setCore(loaded);
      })
      .catch((error) => {
        if (!cancelled && import.meta.env.DEV) {
          console.error(
            "[terminal][renderer] unable to load GhosttyCore",
            error,
          );
        }
      });

    return () => {
      cancelled = true;
      coreRef.current?.dispose();
      coreRef.current = null;
    };
  }, []);

  return core;
}
