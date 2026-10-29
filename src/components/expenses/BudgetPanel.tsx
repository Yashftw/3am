import { motion } from "framer-motion";
import { AlertTriangle, Wallet } from "lucide-react";
import { useExpenses } from "@/lib/expenses-context";
import { useCurrency } from "@/lib/currency-context";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { Meter } from "@/components/motion/Gauge";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { EASE_OUT } from "@/lib/motion";

/**
 * Budget configuration.
 *
 * The monthly pool used to live in a stats card at the top of the page, next
 * to figures you only read. It is an input, not a readout, so it belongs here
 * with the per-category limits it governs.
 */
export const BudgetPanel = () => {
  const { byCategory, setBudget, monthTotal, spendingPool } = useExpenses();
  const { formatAmount } = useCurrency();

  const totalBudget = byCategory.reduce((s, c) => s + c.budget, 0);
  const pool = spendingPool;
  const overCount = byCategory.filter((c) => c.budget > 0 && c.total > c.budget).length;
  // How much of the month's budget has not been handed to a category yet.
  const unallocated = pool > 0 ? pool - totalBudget : null;

  return (
    <SpotlightCard className="h-full rounded-sm" reveal delay={0.2}>
      <div className="flex items-start justify-between border-b border-white/5 px-6 py-5 md:px-8">
        <div>
          <h2 className="font-display text-xl">Budgets</h2>
          <p className="mt-1 text-xs text-muted-foreground">Your monthly limits</p>
        </div>
        {overCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hud-cut-sm flex items-center gap-1.5 border border-[#FF4060]/40 bg-[#FF4060]/10 px-2 py-1"
          >
            <AlertTriangle className="h-3 w-3 text-[#FF4060]" />
            <span className="mono-font text-[9px] uppercase tracking-wider text-[#FF4060]">
              {overCount} over
            </span>
          </motion.div>
        )}
      </div>

      {/* Read-only roll-up; the month's budget is set in the plan above. */}
      {pool > 0 && (
        <div className="border-b border-white/5 px-6 py-5 md:px-8">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="hud-label flex items-center gap-2">
              <Wallet className="h-3 w-3" />
              Month budget
            </span>
            <span className="mono-font text-sm text-white">{formatAmount(pool, 0)}</span>
          </div>
          <Meter
            value={Math.min(monthTotal / pool, 1)}
            color={monthTotal > pool ? "#FF4060" : "#ffffff"}
            height={3}
          />
          <p className="mt-2 text-[11px] text-muted-foreground">
            <AnimatedNumber value={monthTotal} format={(n) => formatAmount(n, 0)} /> used
            {unallocated !== null && unallocated !== 0 && (
              <span className="text-muted-foreground/60">
                {" · "}
                {formatAmount(Math.abs(unallocated), 0)}{" "}
                {unallocated > 0 ? "not yet split by category" : "over-allocated"}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Per-category limits */}
      <div className="space-y-5 p-6 md:p-8">
        {byCategory.map((cat, i) => {
          const ratio = cat.budget > 0 ? cat.total / cat.budget : 0;
          const overBudget = cat.budget > 0 && cat.total > cat.budget;

          return (
            <motion.div
              key={cat.category}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, ease: EASE_OUT, delay: i * 0.04 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="truncate text-sm font-medium">{cat.category}</span>
                </div>

                <div className="mono-font flex shrink-0 items-center gap-1.5 text-sm">
                  <span className={overBudget ? "text-[#FF4060]" : "text-muted-foreground"}>
                    {formatAmount(cat.total, 0)}
                  </span>
                  <span className="text-muted-foreground/40">/</span>
                  <input
                    type="number"
                    min="0"
                    value={cat.budget || ""}
                    placeholder="—"
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setBudget(cat.category, Number.isNaN(val) || val < 0 ? 0 : val);
                    }}
                    className="hud-input h-7 w-20 px-2 text-right text-xs"
                    aria-label={`${cat.category} budget`}
                  />
                </div>
              </div>

              {cat.budget > 0 && (
                <div className="space-y-1">
                  <Meter
                    value={Math.min(ratio, 1)}
                    color={overBudget ? "#FF4060" : cat.color}
                    height={3}
                    delay={i * 0.05}
                  />
                  <p className="text-[10px] text-muted-foreground/70">
                    {overBudget
                      ? `Over by ${formatAmount(cat.total - cat.budget, 0)}`
                      : `${formatAmount(cat.budget - cat.total, 0)} left · ${Math.round(ratio * 100)}% used`}
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </SpotlightCard>
  );
};
