import { motion } from "framer-motion";
import { Pencil, PiggyBank } from "lucide-react";
import { useExpenses } from "@/lib/expenses-context";
import { useCurrency } from "@/lib/currency-context";
import { Meter } from "@/components/motion/Gauge";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { EASE_OUT, spring, tap } from "@/lib/motion";

/**
 * The confirmed plan, as a single strip above the entry form.
 *
 * Once the month is set this replaces the setup card: it keeps salary,
 * budget and projected savings visible without taking the space the full
 * form needed, and puts editing one click away.
 */
export const PlanSummary = ({ onEdit }: { onEdit: () => void }) => {
  const { salary, monthlyBudget, monthTotal, spendingPool } = useExpenses();
  const { formatAmount } = useCurrency();

  const plannedSavings = Math.max(salary - monthlyBudget, 0);
  const used = spendingPool > 0 ? monthTotal / spendingPool : 0;
  const over = monthTotal > spendingPool && spendingPool > 0;

  // Money still unspent counts toward what you actually keep.
  const projectedSavings = Math.max(salary - monthTotal, 0);

  const cells = [
    { label: "Salary", value: salary },
    { label: "Budget", value: monthlyBudget },
    { label: "Spent", value: monthTotal, tone: over ? "text-[#FF4060]" : "text-white" },
    { label: "On track to keep", value: projectedSavings, tone: "text-emerald-400" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="surface-card hud-frame rounded-sm px-6 py-4 md:px-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6 md:gap-10">
          {cells.map((c) => (
            <div key={c.label}>
              <p className="hud-label">{c.label}</p>
              <p className={`mono-font text-base font-medium tabular-nums ${c.tone ?? "text-white"}`}>
                <AnimatedNumber value={c.value} format={(n) => formatAmount(n, 0)} duration={0.5} />
              </p>
            </div>
          ))}
        </div>

        <motion.button
          type="button"
          whileTap={tap}
          whileHover={{ x: 1 }}
          transition={spring.snappy}
          onClick={onEdit}
          className="ghost-button flex items-center gap-2 px-3 py-2 text-xs"
        >
          <Pencil className="h-3 w-3" />
          Edit plan
        </motion.button>
      </div>

      <div className="mt-4 space-y-1.5">
        <Meter value={Math.min(used, 1)} color={over ? "#FF4060" : "#ffffff"} height={3} />
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <PiggyBank className="h-3 w-3" />
          {over
            ? `${formatAmount(monthTotal - spendingPool, 0)} past your budget.`
            : plannedSavings > 0
              ? `${Math.round(used * 100)}% of budget used · aiming to save ${formatAmount(plannedSavings, 0)}.`
              : `${Math.round(used * 100)}% of budget used.`}
        </p>
      </div>
    </motion.div>
  );
};
