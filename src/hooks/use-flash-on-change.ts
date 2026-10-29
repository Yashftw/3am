import { useEffect, useRef, useState } from "react";

/**
 * Returns true briefly whenever `value` changes.
 *
 * Used to tick a figure when live data lands, so a number that moved on its
 * own (a sync from another device, a just-logged expense) is noticeable
 * without the user having to diff the screen in their head.
 */
export function useFlashOnChange(value: unknown, duration = 900): boolean {
  const [flashing, setFlashing] = useState(false);
  const previous = useRef(value);
  const first = useRef(true);

  useEffect(() => {
    // Don't flash on mount - nothing changed, the page just appeared.
    if (first.current) {
      first.current = false;
      previous.current = value;
      return;
    }
    if (Object.is(previous.current, value)) return;

    previous.current = value;
    setFlashing(true);
    const timer = setTimeout(() => setFlashing(false), duration);
    return () => clearTimeout(timer);
  }, [value, duration]);

  return flashing;
}
