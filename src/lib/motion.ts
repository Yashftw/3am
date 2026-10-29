import type { Transition, Variants } from "framer-motion";

/**
 * Shared motion language for 3am.
 *
 * Everything in the app pulls its timing from here so movement feels like it
 * comes from one system rather than a pile of one-off transitions. Springs are
 * used for anything the user directly causes (taps, toggles, drags); eased
 * curves are used for anything that simply arrives (entrances, reveals).
 */

/** Editorial ease — long tail, no overshoot. Good for entrances. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
/** Symmetric ease for state cross-fades. */
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;
/** Snappy ease for things that should feel mechanical (bars, meters). */
export const EASE_SNAP = [0.25, 1, 0.5, 1] as const;

export const spring = {
  /** Default for interactive elements. Settles fast, barely overshoots. */
  gentle: { type: "spring", stiffness: 260, damping: 30, mass: 0.9 },
  /** Buttons, checkboxes, chips — visible but tight bounce. */
  snappy: { type: "spring", stiffness: 420, damping: 26, mass: 0.7 },
  /** Layout shifts, shared-element moves, panels growing. */
  layout: { type: "spring", stiffness: 320, damping: 34, mass: 0.9 },
  /** Numbers, gauges, progress — smooth with no wobble. */
  glide: { type: "spring", stiffness: 140, damping: 24, mass: 1 },
} satisfies Record<string, Transition>;

export const duration = {
  instant: 0.12,
  fast: 0.22,
  base: 0.4,
  slow: 0.7,
  reveal: 0.9,
} as const;

/** Container that releases its children one after another. */
export const staggerContainer = (stagger = 0.06, delay = 0): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
  exit: {
    transition: { staggerChildren: stagger / 2, staggerDirection: -1 },
  },
});

/** Standard child: rises into place with a soft blur burn-off. */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: duration.slow, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    y: -10,
    filter: "blur(4px)",
    transition: { duration: duration.fast, ease: EASE_IN_OUT },
  },
};

/** Lighter variant for dense lists where a big rise would feel sloppy. */
export const fadeIn: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.base, ease: EASE_OUT } },
  exit: { opacity: 0, y: -6, transition: { duration: duration.fast, ease: EASE_IN_OUT } },
};

/** Rows that slide in from the leading edge. */
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -14 },
  visible: { opacity: 1, x: 0, transition: { duration: duration.base, ease: EASE_OUT } },
  exit: { opacity: 0, x: 14, transition: { duration: duration.fast, ease: EASE_IN_OUT } },
};

/** Modals, sheets, popovers. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: spring.layout },
  exit: { opacity: 0, scale: 0.97, y: 8, transition: { duration: duration.fast, ease: EASE_IN_OUT } },
};

/** Route-level transition. Deliberately subtle — navigation shouldn't shout. */
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: EASE_OUT } },
  exit: { opacity: 0, y: -8, filter: "blur(4px)", transition: { duration: 0.24, ease: EASE_IN_OUT } },
};

/** Press feedback shared by every clickable surface. */
export const tap = { scale: 0.97 } as const;
export const tapSoft = { scale: 0.985 } as const;

/** Viewport config for scroll-reveals — fires once, slightly before in view. */
export const revealViewport = { once: true, margin: "-60px" } as const;
