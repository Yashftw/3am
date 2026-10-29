import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useExpenses } from "@/lib/expenses-context";
import { useCurrency } from "@/lib/currency-context";
import { useSync } from "@/lib/sync-status";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { useFlashOnChange } from "@/hooks/use-flash-on-change";
import { daysElapsedInMonth, daysInMonthKey, relativeTime, toLocalMonthKey } from "@/lib/date-utils";
import { EASE_OUT } from "@/lib/motion";

interface Cell {
  label: string;
  value: number;
  format: (n: number) => string;
  hint?: string;
  tone?: "default" | "warn" | "over";
}

const TONE: Record<NonNullable<Cell["tone"]>, string> = {
  default: "text-white",
  warn: "text-[#FF9500]",
  over: "text-[#FF4060]",
};

/**
 * Always-visible readout of where the month stands.
 *
 * Sticks below the nav so the four numbers that actually matter are on screen
 * no matter how far down the page you are. Each figure ticks when it changes,
 * which is what makes the live Firestore sync legible: an expense logged on
 * your phone visibly lands here.
 */
export const LiveStatusBar = () => {
  const { expenses, monthTotal, todayTotal, spendingPool } = useExpenses();
  const { formatAmount } = useCurrency();
  const { state, lastSyncedAt } = useSync();

  const monthKey = toLocalMonthKey();
  const pool = spendingPool;

  const elapsed = Math.max(daysElapsedInMonth(monthKey), 1);
  const totalDays = daysInMonthKey(monthKey);
  const remaining = pool > 0 ? pool - monthTotal : null;
  const daysLeft = Math.max(totalDays - elapsed, 0);

  /** What you can spend per remaining day and still land on budget. */
  const safePerDay = remaining !== null && daysLeft > 0 ? remaining / daysLeft : null;

  const lastEntry = useMemo(() => {
    if (expenses.length === 0) return null;
    return expenses.reduce((latest, e) =>
      (e.createdAt ?? e.date) > (latest.createdAt ?? latest.date) ? e : latest,
    );
  }, [expenses]);

  // Keeps the "logged 3m ago" line honest without re-rendering the world.
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const overPool = remaining !== null && remaining < 0;
  const tightPool = remaining !== null && pool > 0 && remaining / pool < 0.15;

  const cells: Cell[] = [
    { label: "Today", value: todayTotal, format: (n) => formatAmount(n, 0) },
    { label: "This month", value: monthTotal, format: (n) => formatAmount(n, 0) },
    ...(remaining !== null
      ? [{
          label: overPool ? "Over by" : "Remaining",
          value: Math.abs(remaining),
          format: (n: number) => formatAmount(n, 0),
          hint: `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`,
          tone: (overPool ? "over" : tightPool ? "warn" : "default") as Cell["tone"],
        }]
      : []),
    ...(safePerDay !== null && safePerDay > 0
      ? [{
          label: "Safe per day",
          value: safePerDay,
          format: (n: number) => formatAmount(n, 0),
          hint: "to stay on budget",
        }]
      : []),
  ];

  const monthFlash = useFlashOnChange(monthTotal);

  return (
    <div className="sticky top-[57px] z-20 border-b border-white/[0.07] bg-[#0a0a0a]/85 backdrop-blur-xl">
      <div className="mx-auto max-w-[1600px] px-4 md:px-12">
        <div className="no-scrollbar flex items-stretch gap-6 overflow-x-auto py-3 md:gap-10">
          {cells.map((cell, i) => (
            <motion.div
              key={cell.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: EASE_OUT }}
              className="flex min-w-max shrink-0 flex-col justify-center"
            >
              <span className="hud-label">{cell.label}</span>
              <span
                className={`mono-font text-base font-medium tabular-nums ${TONE[cell.tone ?? "default"]} ${
                  monthFlash ? "animate-hud-tick" : ""
                }`}
              >
                <AnimatedNumber value={cell.value} format={cell.format} duration={0.6} />
              </span>
              {cell.hint && <span className="text-[10px] text-muted-foreground/70">{cell.hint}</span>}
            </motion.div>
          ))}

          {/* Live tail */}
          <div className="ml-auto hidden shrink-0 flex-col justify-center pl-6 text-right lg:flex">
            <span className="hud-label">
              {state === "offline" ? "Offline" : state === "saving" ? "Syncing" : "Live"}
            </span>
            <span className={`text-[11px] text-muted-foreground ${state === "synced" ? "hud-live" : ""}`}>
              {lastEntry
                ? `last entry ${relativeTime(lastEntry.createdAt ?? `${lastEntry.date}T12:00:00`)}`
                : lastSyncedAt
                  ? `synced ${relativeTime(new Date(lastSyncedAt).toISOString())}`
                  : "nothing logged yet"}
            </span>
          </div>
        </div>
      </div>
      <div className="tick-rail opacity-40" />
    </div>
  );
};
