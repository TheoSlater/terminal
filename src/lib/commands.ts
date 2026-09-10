import {
  detectPlatform,
  formatForDisplay,
  normalizeRegisterableHotkey,
  type HotkeySequence,
  type RegisterableHotkey,
} from "@tanstack/react-hotkeys";

export const COMMAND_IDS = [
  "newTab",
  "closeTab",
  "nextTab",
  "previousTab",
  "jumpToTab1",
  "jumpToTab2",
  "jumpToTab3",
  "jumpToTab4",
  "jumpToTab5",
  "jumpToTab6",
  "jumpToTab7",
  "jumpToTab8",
  "jumpToTab9",
  "openCommandPalette",
  "openSettings",
  "find",
  "copy",
  "paste",
  "clearTerminal",
  "increaseFontSize",
  "decreaseFontSize",
  "resetFontSize",
  "duplicateTab",
  "renameTab",
  "closeOverlay",
] as const;

export type CommandId = (typeof COMMAND_IDS)[number];
export type CommandScope = "global" | "workspace" | "terminal" | "modal";

export type CommandBinding =
  | { kind: "hotkey"; hotkey: RegisterableHotkey }
  | { kind: "sequence"; sequence: HotkeySequence };

export type CommandDefinition = {
  id: CommandId;
  label: string;
  description: string;
  scope: CommandScope;
};

const hotkey = (value: RegisterableHotkey): CommandBinding => ({
  kind: "hotkey",
  hotkey: value,
});

export const COMMANDS: Record<CommandId, CommandDefinition> = {
  newTab: { id: "newTab", label: "New tab", description: "Open terminal tab", scope: "workspace" },
  closeTab: { id: "closeTab", label: "Close tab", description: "Close active terminal tab", scope: "workspace" },
  nextTab: { id: "nextTab", label: "Next tab", description: "Select next tab", scope: "workspace" },
  previousTab: { id: "previousTab", label: "Previous tab", description: "Select previous tab", scope: "workspace" },
  jumpToTab1: { id: "jumpToTab1", label: "Jump to tab 1", description: "Select tab 1", scope: "workspace" },
  jumpToTab2: { id: "jumpToTab2", label: "Jump to tab 2", description: "Select tab 2", scope: "workspace" },
  jumpToTab3: { id: "jumpToTab3", label: "Jump to tab 3", description: "Select tab 3", scope: "workspace" },
  jumpToTab4: { id: "jumpToTab4", label: "Jump to tab 4", description: "Select tab 4", scope: "workspace" },
  jumpToTab5: { id: "jumpToTab5", label: "Jump to tab 5", description: "Select tab 5", scope: "workspace" },
  jumpToTab6: { id: "jumpToTab6", label: "Jump to tab 6", description: "Select tab 6", scope: "workspace" },
  jumpToTab7: { id: "jumpToTab7", label: "Jump to tab 7", description: "Select tab 7", scope: "workspace" },
  jumpToTab8: { id: "jumpToTab8", label: "Jump to tab 8", description: "Select tab 8", scope: "workspace" },
  jumpToTab9: { id: "jumpToTab9", label: "Jump to tab 9", description: "Select tab 9", scope: "workspace" },
  openCommandPalette: { id: "openCommandPalette", label: "Command palette", description: "Search and run commands", scope: "global" },
  openSettings: { id: "openSettings", label: "Settings", description: "Customize keyboard shortcuts", scope: "global" },
  find: { id: "find", label: "Find", description: "Find text in terminal", scope: "terminal" },
  copy: { id: "copy", label: "Copy", description: "Copy terminal selection", scope: "terminal" },
  paste: { id: "paste", label: "Paste", description: "Paste clipboard into terminal", scope: "terminal" },
  clearTerminal: { id: "clearTerminal", label: "Clear terminal", description: "Clear visible terminal", scope: "terminal" },
  increaseFontSize: { id: "increaseFontSize", label: "Increase font size", description: "Make terminal text larger", scope: "terminal" },
  decreaseFontSize: { id: "decreaseFontSize", label: "Decrease font size", description: "Make terminal text smaller", scope: "terminal" },
  resetFontSize: { id: "resetFontSize", label: "Reset font size", description: "Restore default terminal text size", scope: "terminal" },
  duplicateTab: { id: "duplicateTab", label: "Duplicate tab", description: "Open another terminal tab", scope: "workspace" },
  renameTab: { id: "renameTab", label: "Rename tab", description: "Change active tab name", scope: "workspace" },
  closeOverlay: { id: "closeOverlay", label: "Close overlay", description: "Close command palette or settings", scope: "modal" },
};

export const DEFAULT_BINDINGS: Record<CommandId, CommandBinding> = {
  newTab: hotkey("Mod+Shift+T"),
  closeTab: hotkey("Mod+Shift+W"),
  nextTab: hotkey("Mod+Tab"),
  previousTab: hotkey("Mod+Shift+Tab"),
  jumpToTab1: hotkey("Alt+1"),
  jumpToTab2: hotkey("Alt+2"),
  jumpToTab3: hotkey("Alt+3"),
  jumpToTab4: hotkey("Alt+4"),
  jumpToTab5: hotkey("Alt+5"),
  jumpToTab6: hotkey("Alt+6"),
  jumpToTab7: hotkey("Alt+7"),
  jumpToTab8: hotkey("Alt+8"),
  jumpToTab9: hotkey("Alt+9"),
  openCommandPalette: hotkey("Mod+Shift+P"),
  openSettings: hotkey("Mod+,"),
  find: hotkey("Mod+Shift+F"),
  copy: hotkey("Mod+Shift+C"),
  paste: hotkey("Mod+Shift+V"),
  clearTerminal: hotkey("Mod+Shift+K"),
  increaseFontSize: hotkey({ key: "=", mod: true, shift: true }),
  decreaseFontSize: hotkey("Mod+-"),
  resetFontSize: hotkey("Mod+0"),
  duplicateTab: hotkey("Mod+Shift+D"),
  renameTab: hotkey("F2"),
  closeOverlay: hotkey("Escape"),
};

export type CommandBindings = Record<CommandId, CommandBinding>;

const STORAGE_KEY = "terminal.command-bindings";

export function loadCommandBindings(): CommandBindings {
  if (typeof localStorage === "undefined") return DEFAULT_BINDINGS;

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<CommandBindings> | null;
    const bindings = { ...DEFAULT_BINDINGS };
    if (!stored) return bindings;
    for (const id of COMMAND_IDS) {
      const value = stored[id];
      if (!value || typeof value !== "object") continue;
      if (value.kind === "hotkey" && value.hotkey) bindings[id] = value;
      if (value.kind === "sequence" && Array.isArray(value.sequence) && value.sequence.length > 0) bindings[id] = value;
    }
    return bindings;
  } catch {
    return DEFAULT_BINDINGS;
  }
}

export function saveCommandBindings(bindings: CommandBindings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
  } catch {
    // Preferences are optional; private browsing can reject storage writes.
  }
}

export function bindingLabel(binding: CommandBinding): string {
  if (binding.kind === "hotkey") return formatForDisplay(binding.hotkey);
  return binding.sequence.map((key) => formatForDisplay(key)).join(" then ");
}

function bindingKey(binding: CommandBinding): string {
  if (binding.kind === "hotkey") {
    return normalizeRegisterableHotkey(binding.hotkey, detectPlatform());
  }
  return binding.sequence
    .map((key) => normalizeRegisterableHotkey(key, detectPlatform()))
    .join(" ");
}

export function findBindingConflicts(bindings: CommandBindings) {
  const byBinding = new Map<string, CommandId[]>();

  for (const id of COMMAND_IDS) {
    const key = bindingKey(bindings[id]);
    byBinding.set(key, [...(byBinding.get(key) ?? []), id]);
  }

  return [...byBinding.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([binding, commandIds]) => ({ binding, commandIds }));
}
