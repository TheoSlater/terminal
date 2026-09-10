import { motion } from "motion/react";
import { X } from "lucide-react";
import { motionTransitions, tabVariants } from "@/lib/motion";

type Props = {
  active: boolean;
  label: string;
  onClose: () => void;
  onSelect: () => void;
};

export function SessionTab({ active, label, onClose, onSelect }: Props) {
  return (
    <motion.div
      layout="position"
      transition={{ layout: motionTransitions.tab }}
      variants={tabVariants}
      initial="initial"
      animate="animate"
      exit="exit"
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
        <motion.span
          aria-hidden="true"
          className="session-tab-active-indicator"
          layoutId="active-tab-indicator"
          transition={motionTransitions.indicator}
        />
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
    </motion.div>
  );
}
