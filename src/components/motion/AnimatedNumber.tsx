import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  /** Decimal places to render. */
  decimals?: number;
  /** Rendered before/after the number, inside the same element. */
  prefix?: string;
  suffix?: string;
  /** Full control over the printed string, e.g. currency formatting. */
  format?: (value: number) => string;
  duration?: number;
  className?: string;
  /** Hold at the start value until scrolled into view. */
  animateOnView?: boolean;
}

/**
 * Counts from the previous value to the next one instead of snapping.
 *
 * Writes straight to textContent via an rAF-driven `animate`, so a ticking
 * number never triggers a React re-render of the surrounding card. Respects
 * prefers-reduced-motion by rendering the final value immediately.
 */
export const AnimatedNumber = ({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  format,
  duration = 0.9,
  className,
  animateOnView = false,
}: AnimatedNumberProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(0);
  const reduceMotion = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const shouldRun = !animateOnView || inView;

  const print = (n: number) =>
    format ? format(n) : `${prefix}${n.toFixed(decimals)}${suffix}`;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (!shouldRun) {
      node.textContent = print(previous.current);
      return;
    }

    const from = previous.current;
    previous.current = value;

    if (reduceMotion || from === value) {
      node.textContent = print(value);
      return;
    }

    const controls = animate(from, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        node.textContent = print(latest);
      },
    });

    return () => controls.stop();
    // `print` is derived from the formatting props below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, decimals, prefix, suffix, format, duration, reduceMotion, shouldRun]);

  // Seed with the final text so SSR/no-JS and the first paint are never blank.
  return <span ref={ref} className={className}>{print(value)}</span>;
};
