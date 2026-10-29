import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, PiggyBank, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useExpenses, CATEGORIES, type Budgets, type ExpenseCategory } from "@/lib/expenses-context";
import { useCurrency } from "@/lib/currency-context";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { Meter } from "@/components/motion/Gauge";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { formatMonthKey, toLocalMonthKey } from "@/lib/date-utils";
import { EASE_OUT, spring, tap } from "@/lib/motion";

/** Rounded suggestions so the common case is one tap, not typing. */
const SAVE_RATES = [0.1, 0.2, 0.3];

interface Props {
  /** Editing an existing plan rather than setting one for the first time. */
  editing?: boolean;
  onDone?: () => void;
}


/**
 * Rough shape of a typical month, used only to seed the auto-split so the
 * eight boxes start somewhere sensible instead of at zero.
 */
const DEFAULT_WEIGHTS: Record<ExpenseCategory, number> = {
  Housing: 0.34,
  Food: 0.22,
  Transport: 0.1,
  Bills: 0.1,
  Health: 0.07,
  Shopping: 0.07,
  Entertainment: 0.06,
  Other: 0.04,
};

/**
 * Set the month's salary and spending budget before logging anything.
 *
 * These two numbers used to be a single "Total funds" box at the bottom of
 * the page, below the charts that depend on it — you had to scroll past
 * every derived figure to reach the input that produces them. The month now
 * starts here: state the salary, decide what you will spend, and the rest of
 * the page measures against it.
 */
export const BudgetSetup = ({ editing = false, onDone }: Props) => {
  const { plan, savePlan, byCategory, budgets, setBudgets, monthTotal } = useExpenses();
  const { formatAmount } = useCurrency();

  const [salary, setSalary] = useState(() => (plan?.salary ? String(plan.salary) : ""));
  const [budget, setBudget] = useState(() => (plan?.monthlyBudget ? String(plan.monthlyBudget) : ""));
  const [limits, setLimits] = useState<Record<string, string>>(() =>
    Object.fromEntries(CATEGORIES.map((c) => [c.name, budgets[c.name] ? String(budgets[c.name]) : ""])),
  );
  const [showLimits, setShowLimits] = useState(() =>
    CATEGORIES.some((c) => (budgets[c.name] ?? 0) > 0),
  );
  const salaryRef = useRef<HTMLInputElement>(null);

  const salaryNum = Math.max(parseFloat(salary) || 0, 0);
  const budgetNum = Math.max(parseFloat(budget) || 0, 0);

  const savings = salaryNum - budgetNum;
  const savingsRate = salaryNum > 0 ? savings / salaryNum : 0;
  const overCommitted = budgetNum > salaryNum && salaryNum > 0;

  const allocated = useMemo(
    () => CATEGORIES.reduce((sum, c) => sum + (parseFloat(limits[c.name]) || 0), 0),
    [limits],
  );
  const unallocated = budgetNum - allocated;
  const overAllocated = allocated > budgetNum && budgetNum > 0;

  const symbol = formatAmount(0, 0).replace(/[\d.,\s]/g, "");

  /** Spread the month's budget across categories by typical weighting. */
  const autoSplit = () => {
    if (budgetNum <= 0) return;
    setLimits(
      Object.fromEntries(
        CATEGORIES.map((c) => [
          c.name,
          String(Math.round((budgetNum * DEFAULT_WEIGHTS[c.name]) / 50) * 50),
        ]),
      ),
    );
    setShowLimits(true);
  };

  const clearLimits = () =>
    setLimits(Object.fromEntries(CATEGORIES.map((c) => [c.name, ""])));
  const canSave = salaryNum > 0 && budgetNum > 0;

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) {
      toast.error("Enter both a salary and a spending budget");
      salaryRef.current?.focus();
      return;
    }

    savePlan(salaryNum, budgetNum);

    // Written together so eight limits are one document write, not eight.
    const nextLimits: Budgets = {};
    for (const cat of CATEGORIES) {
      const v = parseFloat(limits[cat.name]);
      if (!Number.isNaN(v) && v > 0) nextLimits[cat.name] = v;
    }
    setBudgets(nextLimits);

    toast.success(`${formatMonthKey(toLocalMonthKey())} is set`, {
      description:
        savings > 0
          ? `${formatAmount(budgetNum, 0)} to spend, ${formatAmount(savings, 0)} to save.`
          : `${formatAmount(budgetNum, 0)} to spend.`,
    });
    onDone?.();
  };

  return (
    <SpotlightCard className="rounded-sm" spotlightSize={680} scan>
      <div className="flex items-start justify-between gap-4 border-b border-white/5 px-6 py-5 md:px-8">
        <div>
          <p className="hud-label mb-2">
            {editing ? "Adjust plan" : `Step 1 · ${formatMonthKey(toLocalMonthKey())}`}
          </p>
          <h2 className="font-display text-2xl text-gradient hud-glow-soft">
            {editing ? "Your monthly plan" : "Set your month"}
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {editing
              ? "Change what comes in and what you intend to spend."
              : "Start with what comes in and what you'll allow yourself to spend. Everything after this is measured against it."}
          </p>
        </div>
        {editing && onDone && (
          <button
            type="button"
            onClick={onDone}
            className="mono-font shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-white"
          >
            Cancel
          </button>
        )}
      </div>

      <form onSubmit={apply} className="p-6 md:p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Salary */}
          <div>
            <label htmlFor="salary" className="hud-label mb-2.5 flex items-center gap-2">
              <Wallet className="h-3 w-3" />
              Monthly salary
            </label>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl text-muted-foreground" aria-hidden>
                {symbol}
              </span>
              <input
                id="salary"
                ref={salaryRef}
                type="number"
                inputMode="numeric"
                min="0"
                autoFocus={!editing}
                placeholder="0"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="mono-font w-full min-w-0 border-b border-white/15 bg-transparent pb-2 text-3xl font-medium text-white outline-none transition-colors placeholder:text-white/15 focus:border-white/60 focus-visible:!shadow-none"
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground/70">What lands in your account.</p>
          </div>

          {/* Budget */}
          <div>
            <label htmlFor="budget" className="hud-label mb-2.5 flex items-center gap-2">
              <TrendingUp className="h-3 w-3" />
              Spending budget
            </label>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl text-muted-foreground" aria-hidden>
                {symbol}
              </span>
              <input
                id="budget"
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className={`mono-font w-full min-w-0 border-b bg-transparent pb-2 text-3xl font-medium outline-none transition-colors placeholder:text-white/15 focus-visible:!shadow-none ${
                  overCommitted
                    ? "border-[#FF4060]/60 text-[#FF4060] focus:border-[#FF4060]"
                    : "border-white/15 text-white focus:border-white/60"
                }`}
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground/70">
              The most you intend to spend this month.
            </p>
          </div>
        </div>

        {/* One-tap savings targets */}
        {salaryNum > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="mt-6"
          >
            <span className="hud-label mb-2.5 block">Or pick a savings target</span>
            <div className="flex flex-wrap gap-2">
              {SAVE_RATES.map((rate) => {
                const suggested = Math.round((salaryNum * (1 - rate)) / 100) * 100;
                const active = budgetNum === suggested;
                return (
                  <motion.button
                    key={rate}
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setBudget(String(suggested))}
                    className={`flex items-center gap-2 border px-3 py-1.5 text-xs transition-colors ${
                      active
                        ? "border-white/45 bg-white/[0.09] text-white"
                        : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/25 hover:text-white"
                    }`}
                  >
                    <span className="mono-font">Save {Math.round(rate * 100)}%</span>
                    <span className="text-white/40">·</span>
                    <span>{formatAmount(suggested, 0)}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Outcome */}
        <div className="hud-readout mt-6 space-y-4 p-5" aria-live="polite">
          <div className="grid grid-cols-3 gap-4">
            <Figure label="Salary" value={salaryNum} format={(n) => formatAmount(n, 0)} />
            <Figure label="To spend" value={budgetNum} format={(n) => formatAmount(n, 0)} />
            <Figure
              label={savings < 0 ? "Shortfall" : "To save"}
              value={Math.abs(savings)}
              format={(n) => formatAmount(n, 0)}
              tone={savings < 0 ? "over" : savings > 0 ? "good" : "muted"}
            />
          </div>

          {salaryNum > 0 && (
            <div className="space-y-2">
              <Meter
                value={Math.min(budgetNum / salaryNum, 1)}
                color={overCommitted ? "#FF4060" : "#ffffff"}
                height={4}
              />
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <PiggyBank className="h-3 w-3" />
                {overCommitted
                  ? `Your budget is ${formatAmount(budgetNum - salaryNum, 0)} more than you earn.`
                  : savings > 0
                    ? `You'd keep ${Math.round(savingsRate * 100)}% of your salary.`
                    : "Every rupee accounted for."}
              </p>
            </div>
          )}
        </div>

        {/* Per-category limits */}
        <div className="mt-6 border-t border-white/5 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowLimits((v) => !v)}
              className="mono-font flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-white"
            >
              <motion.span animate={{ rotate: showLimits ? 180 : 0 }} transition={spring.snappy}>
                <ChevronDown className="h-3 w-3" />
              </motion.span>
              Limits per category
              <span className="text-white/30">(optional)</span>
            </button>

            {budgetNum > 0 && (
              <div className="flex items-center gap-2">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={autoSplit}
                  className="ghost-button flex items-center gap-1.5 px-2.5 py-1 text-[11px]"
                >
                  <Sparkles className="h-3 w-3" />
                  Split for me
                </motion.button>
                {allocated > 0 && (
                  <button
                    type="button"
                    onClick={clearLimits}
                    className="mono-font text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>

          <AnimatePresence initial={false}>
            {showLimits && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.32, ease: EASE_OUT }}
                className="overflow-hidden"
              >
                <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {CATEGORIES.map((cat) => {
                    const spent = byCategory.find((c) => c.category === cat.name)?.total ?? 0;
                    const limit = parseFloat(limits[cat.name]) || 0;
                    const already = limit > 0 && spent > limit;
                    return (
                      <div
                        key={cat.name}
                        className="surface-well flex items-center gap-2.5 px-3 py-2"
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <label htmlFor={`lim-${cat.name}`} className="flex-1 truncate text-xs">
                          {cat.name}
                        </label>
                        {already && (
                          <span className="mono-font shrink-0 text-[9px] uppercase text-[#FF9500]">
                            spent {formatAmount(spent, 0)}
                          </span>
                        )}
                        <span className="mono-font shrink-0 text-xs text-muted-foreground">{symbol}</span>
                        <input
                          id={`lim-${cat.name}`}
                          type="number"
                          inputMode="numeric"
                          min="0"
                          placeholder="—"
                          value={limits[cat.name]}
                          onChange={(e) =>
                            setLimits((prev) => ({ ...prev, [cat.name]: e.target.value }))
                          }
                          className="hud-input mono-font h-8 w-24 shrink-0 px-2 text-right text-xs"
                        />
                      </div>
                    );
                  })}
                </div>

                {budgetNum > 0 && (
                  <div className="mt-4 space-y-2">
                    <Meter
                      value={Math.min(allocated / budgetNum, 1)}
                      color={overAllocated ? "#FF4060" : "#ffffff"}
                      height={3}
                    />
                    <p
                      className={`text-[11px] ${overAllocated ? "text-[#FF4060]" : "text-muted-foreground"}`}
                    >
                      {formatAmount(allocated, 0)} of {formatAmount(budgetNum, 0)} allocated
                      {unallocated !== 0 && (
                        <span className={overAllocated ? "" : "text-muted-foreground/60"}>
                          {" · "}
                          {formatAmount(Math.abs(unallocated), 0)}{" "}
                          {overAllocated ? "over your budget" : "left to assign"}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {overCommitted && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden text-[11px] leading-relaxed text-[#FF9500]"
            >
              You can still save this — sometimes a month genuinely runs at a loss, and the
              tracker should reflect that rather than argue with you.
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={tap}
          type="submit"
          disabled={!canSave}
          className="hud-button hud-cut mt-6 flex w-full items-center justify-center gap-2 py-3.5 text-sm"
        >
          {editing ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
          {editing ? "Update plan" : "Set the budget and start logging"}
          {!editing && <ArrowRight className="h-4 w-4" strokeWidth={3} />}
        </motion.button>

        {!editing && (
          <p className="mt-3 text-center text-[11px] text-muted-foreground/60">
            You can change any of this later. Per-category limits are optional — leave them blank
            to track against the month's total only.
          </p>
        )}

        {editing && allocated > 0 && (
          <p className="mt-3 text-center text-[11px] text-muted-foreground/60">
            {formatAmount(allocated, 0)} allocated across categories ·{" "}
            {formatAmount(monthTotal, 0)} spent so far
          </p>
        )}
      </form>
    </SpotlightCard>
  );
};

const TONES = {
  good: "text-emerald-400",
  over: "text-[#FF4060]",
  muted: "text-muted-foreground",
  default: "text-white",
} as const;

const Figure = ({
  label,
  value,
  format,
  tone = "default",
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  tone?: keyof typeof TONES;
}) => (
  <div>
    <p className="hud-label mb-1.5">{label}</p>
    <p className={`font-display text-xl ${TONES[tone]}`}>
      <AnimatedNumber value={value} format={format} duration={0.4} />
    </p>
  </div>
);
