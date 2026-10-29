import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Calendar, Check, ChevronDown, Plus } from "lucide-react";
import { toast } from "sonner";
import { useExpenses, CATEGORIES, type ExpenseCategory } from "@/lib/expenses-context";
import { CategoryLimitDialog, type LimitBreach } from "@/components/expenses/CategoryLimitDialog";
import { useCurrency } from "@/lib/currency-context";
import { toLocalISODate } from "@/lib/date-utils";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { Meter } from "@/components/motion/Gauge";
import { EASE_OUT, spring, tap } from "@/lib/motion";

/**
 * Amount-first expense entry.
 *
 * The previous form spread six equal fields across a row, so logging a coffee
 * took the same effort as filing a tax return. Here the amount is the whole
 * focus, category is one tap on a chip, and note/date stay folded away until
 * they are actually needed. Everything updates as you type, so the cost of an
 * entry is visible before you commit it.
 */
export const QuickAdd = () => {
  const { addExpense, setBudget, byCategory, monthTotal, spendingPool } = useExpenses();
  const { formatAmount } = useCurrency();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>(CATEGORIES[0].name);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(toLocalISODate());
  const [showDetails, setShowDetails] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  /** Entry held back while the category-limit dialog is open. */
  const [breach, setBreach] = useState<LimitBreach | null>(null);

  const amountRef = useRef<HTMLInputElement>(null);
  const [params, setParams] = useSearchParams();

  // The launcher shortcut ("Add an expense") lands here with ?quick=1, so
  // the keyboard is already up by the time the page settles.
  useEffect(() => {
    if (params.get("quick") !== "1") return;
    const t = setTimeout(() => amountRef.current?.focus(), 350);
    setParams((p) => {
      const next = new URLSearchParams(p);
      next.delete("quick");
      return next;
    }, { replace: true });
    return () => clearTimeout(t);
  }, [params, setParams]);

  // "n" from anywhere on the page jumps here, the way a terminal would.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.toLowerCase() !== "n") return;
      e.preventDefault();
      amountRef.current?.focus();
      amountRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const parsed = parseFloat(amount);
  const pending = Number.isNaN(parsed) || parsed <= 0 ? 0 : parsed;

  const catRollup = byCategory.find((c) => c.category === category);
  const activeColor = CATEGORIES.find((c) => c.name === category)?.color ?? "#ffffff";

  /** What the books look like the moment this entry lands. */
  const projection = useMemo(() => {
    const pool = spendingPool;
    const afterMonth = monthTotal + pending;
    const catBudget = catRollup?.budget ?? 0;
    const afterCat = (catRollup?.total ?? 0) + pending;

    return {
      pool,
      afterMonth,
      remaining: pool > 0 ? pool - afterMonth : null,
      overPool: pool > 0 && afterMonth > pool,
      catBudget,
      afterCat,
      catRatio: catBudget > 0 ? afterCat / catBudget : null,
      overCat: catBudget > 0 && afterCat > catBudget,
    };
  }, [spendingPool, monthTotal, pending, catRollup]);

  /**
   * Writes the expense and resets the form. Assumes the decision is made.
   *
   * Emits exactly one toast. Raising a limit and logging is a single action
   * from the user's side, so reporting it as two notifications made them
   * compete for the same corner and read as a glitch.
   */
  const commit = (amount: number, raisedTo?: number) => {
    addExpense({ amount, category, note: note.trim(), date });

    const detail = `${category}${note.trim() ? ` · ${note.trim()}` : ""}`;

    if (raisedTo !== undefined) {
      toast.success(`${formatAmount(amount, 0)} logged`, {
        description: `${category} limit raised to ${formatAmount(raisedTo, 0)}.`,
      });
    } else if (projection.overPool) {
      toast.warning("Over your monthly budget", {
        description: `${formatAmount(projection.afterMonth, 0)} against ${formatAmount(projection.pool, 0)}. Logged anyway.`,
      });
    } else {
      toast.success(`${formatAmount(amount, 0)} logged`, { description: detail });
    }

    setAmount("");
    setNote("");
    setDate(toLocalISODate());
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
    amountRef.current?.focus();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (pending <= 0) {
      toast.error("Enter an amount greater than zero");
      amountRef.current?.focus();
      return;
    }

    // Breaking a category limit you set on purpose is a decision, not a
    // footnote, so it interrupts. An expense that breaks a budget is still
    // an expense that happened, though, so every route out of the dialog
    // except Cancel still records it.
    if (projection.overCat) {
      setBreach({
        category,
        color: activeColor,
        spent: catRollup?.total ?? 0,
        amount: pending,
        limit: projection.catBudget,
      });
      return;
    }

    commit(pending);
  };

  const resolveBreach = (raiseTo?: number) => {
    const amount = breach?.amount ?? pending;
    const cat = breach?.category;
    setBreach(null);

    if (raiseTo !== undefined && cat) setBudget(cat, raiseTo);
    commit(amount, raiseTo);
  };

  const isToday = date === toLocalISODate();

  return (
    <>
      <CategoryLimitDialog
        breach={breach}
        onConfirm={() => resolveBreach()}
        onRaise={(next) => resolveBreach(next)}
        onCancel={() => setBreach(null)}
      />

      <SpotlightCard className="rounded-sm" spotlightSize={620} scan>
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-5 md:px-8">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-xl">Log an expense</h2>
          <kbd className="mono-font hidden border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
            N
          </kbd>
        </div>

        <AnimatePresence>
          {justAdded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, x: 8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={spring.snappy}
              className="hud-cut-sm flex items-center gap-1.5 bg-white px-2.5 py-1"
            >
              <Check className="h-3 w-3 text-black" strokeWidth={3} />
              <span className="mono-font text-[9px] font-bold uppercase tracking-wider text-black">Logged</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={submit} className="p-6 md:p-8">
        {/* Amount */}
        <div className="mb-6 flex items-end gap-4">
          <div className="min-w-0 flex-1">
            <label htmlFor="qa-amount" className="hud-label mb-2 block">
              Amount
            </label>
            <div className="relative flex items-baseline gap-3">
              <span
                className="font-display text-3xl text-muted-foreground transition-colors md:text-4xl"
                style={{ color: pending > 0 ? activeColor : undefined }}
                aria-hidden
              >
                {formatAmount(0, 0).replace(/[\d.,\s]/g, "")}
              </span>
              <input
                id="qa-amount"
                ref={amountRef}
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mono-font w-full min-w-0 border-b border-white/15 bg-transparent pb-2 text-4xl font-medium text-white outline-none transition-colors placeholder:text-white/15 focus:border-white/60 focus-visible:!shadow-none md:text-5xl"
                aria-describedby="qa-impact"
                required
              />
            </div>
          </div>

          <motion.button
            whileTap={tap}
            type="submit"
            disabled={pending <= 0}
            className="hud-button hud-cut flex h-14 shrink-0 items-center gap-2 px-6 text-sm"
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
            <span className="hidden sm:inline">Add</span>
          </motion.button>
        </div>

        {/* Category chips */}
        <div className="mb-5">
          <span className="hud-label mb-2.5 block">Category</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const selected = cat.name === category;
              return (
                <motion.button
                  key={cat.name}
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setCategory(cat.name)}
                  aria-pressed={selected}
                  className={`relative flex items-center gap-2 border px-3 py-1.5 text-xs transition-colors ${
                    selected
                      ? "border-white/45 bg-white/[0.09] text-white"
                      : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/25 hover:text-white"
                  }`}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full transition-shadow"
                    style={{
                      backgroundColor: cat.color,
                      boxShadow: selected ? `0 0 8px ${cat.color}` : "none",
                    }}
                  />
                  {cat.name}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Live impact */}
        <div id="qa-impact" aria-live="polite" className="hud-readout mb-5 space-y-3 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="hud-label">After this entry</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={`${projection.afterMonth}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
                className={`mono-font text-sm ${projection.overPool ? "text-[#FF4060]" : "text-white"}`}
              >
                {projection.remaining === null
                  ? `${formatAmount(projection.afterMonth, 0)} spent this month`
                  : `${formatAmount(Math.abs(projection.remaining), 0)} ${projection.remaining < 0 ? "over" : "left"}`}
              </motion.span>
            </AnimatePresence>
          </div>

          {projection.pool > 0 && (
            <Meter
              value={Math.min(projection.afterMonth / projection.pool, 1)}
              color={projection.overPool ? "#FF4060" : "#ffffff"}
              height={3}
            />
          )}

          {projection.catRatio !== null && (
            <div className="flex items-center gap-3 pt-1">
              <span className="w-20 shrink-0 text-[11px] text-muted-foreground">{category}</span>
              <Meter
                value={Math.min(projection.catRatio, 1)}
                color={projection.overCat ? "#FF4060" : activeColor}
                height={3}
                className="flex-1"
              />
              <span
                className={`mono-font w-12 shrink-0 text-right text-[11px] ${
                  projection.overCat ? "text-[#FF4060]" : "text-muted-foreground"
                }`}
              >
                {Math.round(projection.catRatio * 100)}%
              </span>
            </div>
          )}

          <AnimatePresence>
            {(projection.overCat || projection.overPool) && pending > 0 && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2 overflow-hidden pt-1 text-[11px] leading-relaxed text-[#FF9500]"
              >
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                {projection.overCat
                  ? `This goes ${formatAmount(projection.afterCat - projection.catBudget, 0)} past your ${category} limit. You'll be asked before it's logged.`
                  : `This puts you ${formatAmount(projection.afterMonth - projection.pool, 0)} past your monthly budget. It'll still be logged.`}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Note + date, folded away */}
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="mono-font flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-white"
        >
          <motion.span animate={{ rotate: showDetails ? 180 : 0 }} transition={spring.snappy}>
            <ChevronDown className="h-3 w-3" />
          </motion.span>
          Note and date
          {(note || !isToday) && <span className="ml-1 h-1 w-1 rounded-full bg-white" />}
        </button>

        <AnimatePresence initial={false}>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="overflow-hidden"
            >
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  type="text"
                  placeholder="What was it for?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="hud-input h-11 px-3 text-sm"
                  aria-label="Note"
                />
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="date"
                    value={date}
                    max={toLocalISODate()}
                    onChange={(e) => setDate(e.target.value)}
                    className="hud-input mono-font h-11 w-full pl-9 pr-3 text-sm sm:w-48"
                    aria-label="Date"
                    required
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </form>
      </SpotlightCard>
    </>
  );
};
