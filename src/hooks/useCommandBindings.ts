import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_BINDINGS,
  findBindingConflicts,
  loadCommandBindings,
  saveCommandBindings,
  type CommandBinding,
  type CommandBindings,
  type CommandId,
} from "@/lib/commands";

export function useCommandBindings() {
  const [bindings, setBindings] = useState<CommandBindings>(loadCommandBindings);

  useEffect(() => saveCommandBindings(bindings), [bindings]);

  const setBinding = useCallback((id: CommandId, binding: CommandBinding) => {
    setBindings((current) => ({ ...current, [id]: binding }));
  }, []);

  const resetBinding = useCallback((id: CommandId) => {
    setBindings((current) => ({ ...current, [id]: DEFAULT_BINDINGS[id] }));
  }, []);

  const conflicts = useMemo(() => findBindingConflicts(bindings), [bindings]);

  return { bindings, conflicts, resetBinding, setBinding };
}
