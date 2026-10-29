import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LiveStatusBar } from "@/components/expenses/LiveStatusBar";
import { BudgetSetup } from "@/components/expenses/BudgetSetup";
import { PlanSummary } from "@/components/expenses/PlanSummary";
import { QuickAdd } from "@/components/expenses/QuickAdd";
import { WeeklyChart } from "@/components/expenses/WeeklyChart";
import { CategoryChart } from "@/components/expenses/CategoryChart";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { BudgetPanel } from "@/components/expenses/BudgetPanel";
import { BudgetInsights } from "@/components/expenses/BudgetInsights";
import { MonthlyReportCard } from "@/components/reports/MonthlyReportCard";
import { useExpenses } from "@/lib/expenses-context";
import { useCurrency, type Currency } from "@/lib/currency-context";
import { formatMonthKey, toLocalMonthKey } from "@/lib/date-utils";
import { EASE_OUT, spring, tap } from "@/lib/motion";

const CURRENCIES: Array<{ code: Currency; label: string }> = [
  { code: "INR", label: "₹ INR" },
  { code: "USD", label: "$ USD" },
];

/**
 * Expenses.
 *
 * Ordered the way the month actually runs: decide the plan, log against it,
 * then analyse. Until salary and budget are set the entry form is held back,
 * because an expense with nothing to measure it against is just a number.
 */
const Expenses = () => {
  const { currency, setCurrency } = useCurrency();
  const { isPlanSetForMonth, isLoading } = useExpenses();
  const [editingPlan, setEditingPlan] = useState(false);

  const showSetup = !isLoading && (!isPlanSetForMonth || editingPlan);

  return (
    <div className="relative z-10 flex flex-1 flex-col bg-transparent">
      {/* Title row */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col items-start justify-between gap-4 px-4 pb-5 pt-8 sm:flex-row sm:items-end md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 16, filter: "blur(5px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.75, ease: EASE_OUT }}
        >
          <p className="hud-label mb-3">Finance</p>
          <h1 className="hud-glow-soft font-display text-4xl font-light tracking-tight text-gradient md:text-5xl">
            Expenses
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatMonthKey(toLocalMonthKey())} · tracked live across your devices
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: EASE_OUT }}
          className="hud-frame relative flex border border-white/10 bg-white/[0.02] p-1"
        >
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setCurrency(c.code)}
              className="relative px-4 py-1.5 text-xs"
              aria-pressed={currency === c.code}
            >
              {currency === c.code && (
                <motion.span
                  layoutId="currency-pill"
                  className="absolute inset-0 bg-white"
                  transition={spring.layout}
                />
              )}
              <motion.span
                whileTap={tap}
                className={`mono-font relative z-[1] block transition-colors duration-200 ${
                  currency === c.code ? "text-black" : "text-muted-foreground hover:text-white"
                }`}
              >
                {c.label}
              </motion.span>
            </button>
          ))}
        </motion.div>
      </div>

      {isPlanSetForMonth && <LiveStatusBar />}

      <main className="relative z-10 mx-auto w-full max-w-[1600px] space-y-6 px-4 py-8 md:space-y-8 md:px-12">
        {/* The plan comes first */}
        <AnimatePresence mode="wait" initial={false}>
          {showSetup ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
            >
              <BudgetSetup
                editing={isPlanSetForMonth}
                onDone={() => setEditingPlan(false)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="planned"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="space-y-6 md:space-y-8"
            >
              <PlanSummary onEdit={() => setEditingPlan(true)} />
              <QuickAdd />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Everything below only means something once the plan exists */}
        {isPlanSetForMonth && (
          <>
            <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <WeeklyChart />
              </div>
              <CategoryChart />
            </div>

            <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ExpenseList />
              </div>
              <BudgetPanel />
            </div>

            <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
              <MonthlyReportCard />
              <div className="lg:col-span-2">
                <BudgetInsights />
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="mt-12 border-t border-white/5 bg-transparent px-4 py-8 md:px-12">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-3 text-xs text-muted-foreground md:flex-row">
          <span>© {new Date().getFullYear()} 3am — saved on this device and synced to your account.</span>
          <span className="mono-font tracking-wider">SPEND CONSCIOUSLY · INVEST PATIENTLY</span>
        </div>
      </footer>
    </div>
  );
};

export default Expenses;
