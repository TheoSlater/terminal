import type { Transition, Variants } from "motion/react";

const easeEnter = [0.22, 1, 0.36, 1] as const;
const easeExit = [0.4, 0, 1, 1] as const;

export const motionTransitions = {
  enter: { duration: 0.16, ease: easeEnter },
  exit: { duration: 0.12, ease: easeExit },
  indicator: { type: "spring", stiffness: 700, damping: 46, mass: 0.55 },
  micro: { type: "spring", stiffness: 700, damping: 44, mass: 0.45 },
  tab: { type: "spring", stiffness: 600, damping: 42, mass: 0.65 },
} satisfies Record<string, Transition>;

export const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: motionTransitions.enter },
  exit: { opacity: 0, transition: motionTransitions.exit },
} satisfies Variants;

export const fadeScaleVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: motionTransitions.enter },
  exit: { opacity: 0, scale: 0.99, transition: motionTransitions.exit },
} satisfies Variants;

export const slideFadeVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: motionTransitions.enter },
  exit: { opacity: 0, y: -4, transition: motionTransitions.exit },
} satisfies Variants;

export const tabVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: motionTransitions.enter },
  exit: { opacity: 0, scale: 0.98, transition: motionTransitions.exit },
} satisfies Variants;

export const dropdownVariants = {
  initial: { opacity: 0, scale: 0.98, y: -4 },
  animate: { opacity: 1, scale: 1, y: 0, transition: motionTransitions.enter },
  exit: { opacity: 0, scale: 0.99, y: -2, transition: motionTransitions.exit },
} satisfies Variants;

export const popoverVariants = dropdownVariants;

export const modalVariants = {
  initial: { opacity: 0, scale: 0.98, y: 4 },
  animate: { opacity: 1, scale: 1, y: 0, transition: motionTransitions.enter },
  exit: { opacity: 0, scale: 0.98, y: 2, transition: motionTransitions.exit },
} satisfies Variants;

export const commandPaletteVariants = modalVariants;
export const settingsVariants = modalVariants;

export const microMotion = {
  transition: motionTransitions.micro,
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.96 },
};
