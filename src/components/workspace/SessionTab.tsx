import { X } from "lucide-react";

type Props = {
  active: boolean;
  label: string;
  onClose: () => void;
  onSelect: () => void;
};

export function SessionTab({ active, label, onClose, onSelect }: Props) {
  return (
    <div
      className={active ? "session-tab active" : "session-tab"}
      role="tab"
      aria-selected={active}
      title={label}
      tabIndex={0}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <span className="session-tab-label">{label}</span>
      {active ? (
        <span aria-hidden="true" className="session-tab-active-indicator" />
      ) : null}
      <button
        type="button"
        className="session-tab-close"
        aria-label={`Close ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <X aria-hidden="true" />
      </button>
    </div>
  );
}
