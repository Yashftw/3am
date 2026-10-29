import { useRef, type ReactNode } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, type MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE_OUT, revealViewport } from "@/lib/motion";

interface SpotlightCardProps extends Omit<MotionProps, "children"> {
  children: ReactNode;
  className?: string;
  /** Anchor target, so a card can be linked to from a section nav. */
  id?: string;
  /** Radius of the cursor glow in pixels. */
  spotlightSize?: number;
  /** Peak opacity of the glow. Kept low so the card never looks lit up. */
  spotlightOpacity?: number;
  /** Lift and brighten the border on hover. */
  interactive?: boolean;
  /** Rise into place when scrolled into view. */
  reveal?: boolean;
  /** Stagger index for the reveal. */
  delay?: number;
  /** Instrument-style bracket corners that open up on hover. */
  hud?: boolean;
  /** Slow scanline drifting down the surface. */
  scan?: boolean;
}

/**
 * The app's primary surface.
 *
 * A pointer-tracked white radial highlight follows the cursor across the card
 * and a hairline gradient rides the top edge. With `hud`, bracket corners are
 * added; with `scan`, a slow scanline drifts down it. Every effect is pure
 * white at low alpha, so the card gains depth and a technical character
 * without introducing any hue the palette does not already have.
 *
 * Pointer tracking writes to motion values, never to state, so moving the
 * mouse costs nothing in React.
 */
export const SpotlightCard = ({
  children,
  className,
  spotlightSize = 420,
  spotlightOpacity = 0.06,
  interactive = true,
  reveal = false,
  delay = 0,
  hud = true,
  scan = false,
  id,
  ...motionProps
}: SpotlightCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const mouseX = useMotionValue(-9999);
  const mouseY = useMotionValue(-9999);

  const spotlight = useMotionTemplate`radial-gradient(${spotlightSize}px circle at ${mouseX}px ${mouseY}px, rgba(255,255,255,${spotlightOpacity}), transparent 72%)`;

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || reduceMotion) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handleLeave = () => {
    mouseX.set(-9999);
    mouseY.set(-9999);
  };

  const revealProps = reveal
    ? {
        initial: { opacity: 0, y: 24, filter: "blur(6px)" },
        whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
        viewport: revealViewport,
        transition: { duration: 0.7, ease: EASE_OUT, delay },
      }
    : {};

  return (
    <motion.div
      ref={ref}
      id={id}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={cn(
        "surface-card group/card",
        interactive && "surface-card--interactive",
        hud && "hud-frame",
        scan && "hud-scan",
        className,
      )}
      {...revealProps}
      {...motionProps}
    >
      {/* Cursor spotlight */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
        style={{ background: spotlight }}
      />
      {/* Top hairline that brightens toward the middle */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-40 transition-opacity duration-500 group-hover/card:opacity-100"
      />
      <div className="relative z-[1] flex h-full flex-col">{children}</div>
    </motion.div>
  );
};
