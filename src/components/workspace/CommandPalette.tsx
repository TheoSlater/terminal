import { useMemo, useState } from "react";
import {
  formatForDisplay,
  useHotkeyRecorder,
  useHotkeySequenceRecorder,
} from "@tanstack/react-hotkeys";
import {
  COMMANDS,
  COMMAND_IDS,
  bindingLabel,
  type CommandBinding,
  type CommandBindings,
  type CommandId,
} from "@/lib/commands";

type Props = {
  mode: "palette" | "settings";
  bindings: CommandBindings;
  conflicts: Array<{ commandIds: CommandId[] }>;
  onBindingChange: (id: CommandId, binding: CommandBinding) => void;
  onClose: () => void;
  onReset: (id: CommandId) => void;
  onRun: (id: CommandId) => void;
  heldKeys: string[];
  shiftHeld: boolean;
};

export function CommandPalette({
  bindings,
  conflicts,
  mode,
  onBindingChange,
  onClose,
  onReset,
  onRun,
  heldKeys,
  shiftHeld,
}: Props) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<CommandId | null>(null);
  const recorder = useHotkeyRecorder({
    onRecord: (hotkey) => {
      if (!editingId) return;
      onBindingChange(editingId, { kind: "hotkey", hotkey });
      setEditingId(null);
    },
    onCancel: () => setEditingId(null),
  });
  const sequenceRecorder = useHotkeySequenceRecorder({
    onRecord: (sequence) => {
      if (!editingId || sequence.length === 0) return;
      onBindingChange(editingId, { kind: "sequence", sequence });
      setEditingId(null);
    },
    onCancel: () => setEditingId(null),
  });

  const commands = useMemo(
    () =>
      COMMAND_IDS.filter((id) => {
        const command = COMMANDS[id];
        const value = `${command.label} ${command.description}`.toLowerCase();
        return value.includes(query.toLowerCase());
      }),
    [query],
  );

  return (
    <div className="command-overlay" role="dialog" aria-modal="true" aria-label={mode === "palette" ? "Command palette" : "Settings"}>
      <div className="command-panel">
        <div className="command-panel-header">
          <div>
            <span className="command-panel-eyebrow">{mode === "palette" ? "commands" : "settings"}</span>
            <h2>{mode === "palette" ? "Command palette" : "Keyboard shortcuts"}</h2>
          </div>
          <button type="button" className="command-close" onClick={onClose} aria-label="Close">
            Escape
          </button>
        </div>

        <input
          autoFocus
          className="command-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={mode === "palette" ? "Search commands" : "Filter shortcuts"}
          aria-label="Search commands"
        />

        <div className="command-list">
          {commands.map((id) => {
            const command = COMMANDS[id];
            const conflict = conflicts.find(({ commandIds }) => commandIds.includes(id));
            const recording = editingId === id && (recorder.isRecording || sequenceRecorder.isRecording);
            const sequencePreview = sequenceRecorder.steps.map((key) => formatForDisplay(key)).join(" then ");
            return (
              <div key={id} className="command-row">
                <button type="button" className="command-run" onClick={() => onRun(id)}>
                  <span>
                    <strong>{command.label}</strong>
                    <small>{command.description}</small>
                  </span>
                  <kbd>{sequenceRecorder.isRecording && editingId === id ? sequencePreview || "Press sequence…" : recording ? "Press keys…" : bindingLabel(bindings[id])}</kbd>
                </button>
                {mode === "settings" ? (
                  <>
                    <button
                      type="button"
                      className="command-edit"
                      onClick={() => {
                        sequenceRecorder.cancelRecording();
                        setEditingId(id);
                        recorder.startRecording();
                      }}
                    >
                      {recording ? "Listening" : "Record"}
                    </button>
                    <button
                      type="button"
                      className="command-edit"
                      onClick={() => {
                        recorder.cancelRecording();
                        setEditingId(id);
                        sequenceRecorder.startRecording();
                      }}
                    >
                      Sequence
                    </button>
                    <button type="button" className="command-reset" onClick={() => onReset(id)}>
                      Reset
                    </button>
                  </>
                ) : null}
                {conflict ? <span className="command-conflict">Conflict</span> : null}
              </div>
            );
          })}
        </div>

        <footer className="command-panel-footer">
          <span>
            {sequenceRecorder.recordedSequence
              ? `Recorded ${sequenceRecorder.recordedSequence.map((key) => formatForDisplay(key)).join(" then ")}`
              : recorder.recordedHotkey
                ? `Recorded ${formatForDisplay(recorder.recordedHotkey)}`
              : heldKeys.length > 0
                ? `Held ${heldKeys.join(" + ")}`
                : shiftHeld
                  ? "Shift held"
                  : "Bindings save on change"}
          </span>
          {conflicts.length > 0 ? <span className="command-conflict">{conflicts.length} conflict{conflicts.length === 1 ? "" : "s"}</span> : <span>Ready</span>}
        </footer>
      </div>
    </div>
  );
}
