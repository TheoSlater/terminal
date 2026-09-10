import {
  useHeldKeys,
  useHotkeySequences,
  useHotkeys,
  useKeyHold,
  type UseHotkeyOptions,
  type UseHotkeySequenceOptions,
} from "@tanstack/react-hotkeys";
import { COMMANDS, COMMAND_IDS, type CommandBindings, type CommandId, type CommandScope } from "@/lib/commands";

type Props = {
  bindings: CommandBindings;
  onCommand: (id: CommandId) => void;
  activeScopes?: readonly CommandScope[];
  target?: UseHotkeyOptions["target"];
};

function isInputElement(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLInputElement) {
    return !["button", "reset", "submit"].includes(target.type.toLowerCase());
  }
  return target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable;
}

function canHandleInput(event: KeyboardEvent, id: CommandId) {
  if (!isInputElement(event.target)) return true;
  if (event.target.closest(".terminal")) return true;
  return COMMANDS[id].scope === "modal" && event.key === "Escape";
}

export function useCommandSystem({
  activeScopes = ["global", "workspace", "terminal"],
  bindings,
  onCommand,
  target,
}: Props) {
  const heldKeys = useHeldKeys();
  const shiftHeld = useKeyHold("Shift");
  const scopeSet = new Set(activeScopes);
  const enabled = (id: CommandId) => scopeSet.has(COMMANDS[id].scope);

  useHotkeys(
    COMMAND_IDS.flatMap((id) => {
      const binding = bindings[id];
      if (binding.kind !== "hotkey") return [];
      return [{
        hotkey: binding.hotkey,
        callback: (event) => {
          if (!canHandleInput(event, id)) return;
          event.preventDefault();
          event.stopPropagation();
          onCommand(id);
        },
        options: {
          enabled: enabled(id),
          ignoreInputs: false,
          target,
          meta: { name: COMMANDS[id].label, description: COMMANDS[id].description },
        },
      }];
    }),
    {
      conflictBehavior: "warn",
      preventDefault: false,
      stopPropagation: false,
    },
  );

  useHotkeySequences(
    COMMAND_IDS.flatMap((id) => {
      const binding = bindings[id];
      if (binding.kind !== "sequence") return [];
      return [{
        sequence: binding.sequence,
        callback: (event) => {
          if (!canHandleInput(event, id)) return;
          event.preventDefault();
          event.stopPropagation();
          onCommand(id);
        },
        options: {
          enabled: enabled(id),
          ignoreInputs: false,
          target,
          meta: { name: COMMANDS[id].label, description: COMMANDS[id].description },
        },
      }];
    }),
    {
      conflictBehavior: "warn",
      preventDefault: false,
      stopPropagation: false,
    } satisfies UseHotkeySequenceOptions,
  );

  return { heldKeys, shiftHeld };
}
