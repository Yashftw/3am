import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Pencil, X } from "lucide-react";
import { useCurrency } from "@/lib/currency-context";
import { Meter } from "@/components/motion/Gauge";
import { EASE_OUT, spring, tap } from "@/lib/motion";
import type { ExpenseCategory } from "@/lib/expenses-context";

export interface LimitBreach {
  category: ExpenseCategory;
  color: string;
  /** Already spent in this category before the pending entry. */
  spent: number;
  /** The entry that trips the limit. */
  amount: number;
  limit: number;
}

interface Props {
  breach: LimitBreach | null;
  /** Log the expense and leave the limit alone. */
  onConfirm: () => void;
  /** Raise the limit to `next`, then log. */
  onRaise: (next: number) => void;
  onCancel: () => void;
}

/**
 * Shown when an expense would push a category past the limit set at the
 * start of the month.
 *
 * This deliberately interrupts rather than passing by as a toast: breaking a
 * limit you set on purpose is a decision, and the three ways out of it are
 * all legitimate. Nothing is logged until one is chosen, and the limit can be
 * revised here rather than sending you off to find the budget panel.
 */
export const CategoryLimitDialog = ({ breach, onConfirm, onRaise, onCancel }: Props) => {
  const { formatAmount } = useCurrency();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const totals = useMemo(() => {
    if (!breach) return null;
    const after = breach.spent + breach.amount;
    return {
      after,
      over: after - breach.limit,
      // Rounded up to something tidy so the suggestion looks deliberate.
      suggested: Math.ceil(after / 100) * 100,
    };
  }, [breach]);

  // Reset between breaches, and move focus into the dialog for keyboard use.
  useEffect(() => {
    if (!breach || !totals) return;
    setEditing(false);
    setDraft(String(totals.suggested));
    const t = setTimeout(() => confirmRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [breach, totals]);

  useEffect(() => {
    if (!breach) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [breach, onCancel]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const draftNum = Math.max(parseFloat(draft) || 0, 0);
  const raiseIsValid = totals ? draftNum >= totals.after : false;

  /*
   * Rendered into <body>. The route wrapper animates `filter`, and any
   * non-none filter makes an element the containing block for its fixed
   * descendants — which scoped this overlay inside the page and let the
   * sticky header paint over the top of it.
   */
  return createPortal(
    <AnimatePresence>
      {breach && totals && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onCancel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="limit-title"
            aria-describedby="limit-body"
            initial={{ opacity: 0, scale: 0.94, y: 20, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.96, y: 12, filter: "blur(6px)" }}
            transition={spring.layout}
            className="surface-card hud-frame relative z-10 w-full max-w-md rounded-sm p-7"
          >
            <button
              type="button"
              onClick={onCancel}
              aria-label="Cancel"
              className="absolute right-4 top-4 p-2 text-white/35 transition-colors hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-5 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-[#FF9500]" />
              <span className="hud-label">Category limit</span>
            </div>

            <h2 id="limit-title" className="font-display text-2xl leading-tight text-white">
              This puts {breach.category}
              <br />
              over its limit
            </h2>

            <p id="limit-body" className="mt-3 text-sm leading-relaxed text-muted-foreground">
              You set {formatAmount(breach.limit, 0)} for {breach.category} this month. Adding{" "}
              {formatAmount(breach.amount, 0)} takes it to{" "}
              <span className="text-white">{formatAmount(totals.after, 0)}</span> —{" "}
              <span className="text-[#FF4060]">{formatAmount(totals.over, 0)} over</span>.
            </p>

            {/* Where the category lands */}
            <div className="hud-readout my-6 space-y-3 p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: breach.color }}
                  />
                  {breach.category}
                </span>
                <span className="mono-font text-xs text-white">
                  {formatAmount(totals.after, 0)} / {formatAmount(breach.limit, 0)}
                </span>
              </div>
              <Meter value={1} color="#FF4060" height={4} />
              <p className="text-[11px] text-muted-foreground/70">
                {formatAmount(breach.spent, 0)} already spent this month.
              </p>
            </div>

            {/* Raise the limit inline */}
            <AnimatePresence initial={false}>
              {editing && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: EASE_OUT }}
                  className="overflow-hidden"
                >
                  <div className="mb-5">
                    <label htmlFor="new-limit" className="hud-label mb-2 block">
                      New {breach.category} limit
                    </label>
                    <input
                      id="new-limit"
                      ref={inputRef}
                      type="number"
                      inputMode="numeric"
                      min={totals.after}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && raiseIsValid) {
                          e.preventDefault();
                          onRaise(draftNum);
                        }
                      }}
                      className="hud-input mono-font h-12 w-full px-3 text-xl"
                    />
                    <p
                      className={`mt-2 text-[11px] ${
                        raiseIsValid ? "text-muted-foreground/70" : "text-[#FF9500]"
                      }`}
                    >
                      {raiseIsValid
                        ? `${formatAmount(draftNum - totals.after, 0)} of headroom after this expense.`
                        : `Needs to be at least ${formatAmount(totals.after, 0)} to cover it.`}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col gap-2.5">
              {editing ? (
                <motion.button
                  type="button"
                  whileTap={tap}
                  disabled={!raiseIsValid}
                  onClick={() => onRaise(draftNum)}
                  className="hud-button hud-cut flex w-full items-center justify-center gap-2 py-3 text-sm"
                >
                  Raise limit and log
                  <ArrowRight className="h-4 w-4" strokeWidth={3} />
                </motion.button>
              ) : (
                <motion.button
                  ref={confirmRef}
                  type="button"
                  whileTap={tap}
                  onClick={onConfirm}
                  className="hud-button hud-cut w-full py-3 text-sm"
                >
                  Log it anyway
                </motion.button>
              )}

              <div className="flex gap-2.5">
                <motion.button
                  type="button"
                  whileTap={tap}
                  onClick={() => setEditing((v) => !v)}
                  className="ghost-button flex flex-1 items-center justify-center gap-2 py-2.5 text-sm"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {editing ? "Keep the limit" : "Change the limit"}
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={tap}
                  onClick={onCancel}
                  className="ghost-button flex-1 py-2.5 text-sm"
                >
                  Cancel
                </motion.button>
              </div>
            </div>

            <p className="mt-4 text-center text-[11px] text-muted-foreground/60">
              Nothing is logged until you choose.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
