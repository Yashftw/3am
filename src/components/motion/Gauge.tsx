import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion";

interface GaugeProps {
  /** 0 to 1. */
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  className?: string;
  children?: ReactNode;
  /** Adds a soft outer glow in the stroke colour. */
  glow?: boolean;
  delay?: number;
}

/**
 * Circular progress arc driven by framer-motion rather than a CSS transition.
 *
 * The old version animated `stroke-dashoffset` with a `transition-all` class
 * plus a competing `animate-sweep` keyframe, so the arc jumped on first paint
 * and again on every update. Here the draw is a single interpolation of
 * `pathLength`, which the browser can run on the compositor.
 */
export const Gauge = ({
  value,
  size = 128,
  strokeWidth = 8,
  color = "#ffffff",
  trackColor = "rgba(255,255,255,0.08)",
  className,
  children,
  glow = false,
  delay = 0,
}: GaugeProps) => {
  const reduceMotion = useReducedMotion();
  const clamped = Math.min(Math.max(value, 0), 1);
  const radius = 50 - strokeWidth / 2;

  return (
    <div className={cn("relative flex-shrink-0", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90 overflow-visible">
        <circle cx="50" cy="50" r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ pathLength: reduceMotion ? clamped : 0 }}
          animate={{ pathLength: clamped }}
          transition={{ duration: reduceMotion ? 0 : 1.1, ease: EASE_OUT, delay }}
          style={glow ? { filter: `drop-shadow(0 0 6px ${color}55)` } : undefined}
        />
      </svg>
      {children && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
};

interface MeterProps {
  /** 0 to 1. */
  value: number;
  className?: string;
  color?: string;
  height?: number;
  delay?: number;
  /** Sweeps a highlight along the filled portion once on mount. */
  shimmer?: boolean;
}

/** Horizontal progress bar with the same timing as {@link Gauge}. */
export const Meter = ({
  value,
  className,
  color = "#ffffff",
  height = 4,
  delay = 0,
  shimmer = false,
}: MeterProps) => {
  const reduceMotion = useReducedMotion();
  const clamped = Math.min(Math.max(value, 0), 1);

  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-full bg-white/[0.06]", className)}
      style={{ height }}
    >
      <motion.div
        className="relative h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: reduceMotion ? `${clamped * 100}%` : 0 }}
        animate={{ width: `${clamped * 100}%` }}
        transition={{ duration: reduceMotion ? 0 : 0.9, ease: EASE_OUT, delay }}
      >
        {shimmer && !reduceMotion && (
          <motion.div
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent"
            initial={{ x: "-120%" }}
            animate={{ x: "320%" }}
            transition={{ duration: 1.4, ease: "easeInOut", delay: delay + 0.5 }}
          />
        )}
      </motion.div>
    </div>
  );
};

interface SegmentedMeterProps {
  /** 0 to 100. */
  progress: number;
  segments?: number;
  color?: string;
  onSegmentClick?: (threshold: number) => void;
  className?: string;
}

/** The ten-block goal progress bar, with each block popping in on its own beat. */
export const SegmentedMeter = ({
  progress,
  segments = 10,
  color = "#ffffff",
  onSegmentClick,
  className,
}: SegmentedMeterProps) => {
  const reduceMotion = useReducedMotion();

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: segments }).map((_, i) => {
        const threshold = ((i + 1) / segments) * 100;
        const filled = progress >= threshold;
        return (
          <motion.button
            key={i}
            type="button"
            disabled={!onSegmentClick}
            onClick={() => onSegmentClick?.(threshold)}
            aria-label={`Set progress to ${Math.round(threshold)}%`}
            className={cn(
              "h-1.5 flex-1 rounded-[1px] transition-colors",
              onSegmentClick ? "cursor-pointer" : "cursor-default",
              !filled && "bg-white/10",
              !filled && onSegmentClick && "hover:bg-white/25",
            )}
            style={filled ? { backgroundColor: color, boxShadow: `0 0 8px ${color}55` } : undefined}
            initial={false}
            animate={{ scaleY: filled ? 1 : 0.7, opacity: filled ? 1 : 0.85 }}
            whileHover={onSegmentClick ? { scaleY: 1.5 } : undefined}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 28,
              delay: reduceMotion ? 0 : i * 0.02,
            }}
          />
        );
      })}
    </div>
  );
};
