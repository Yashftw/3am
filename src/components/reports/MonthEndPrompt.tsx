import { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Sparkles, X } from "lucide-react";
import { useReports } from "@/lib/reports-context";
import { useCurrency } from "@/lib/currency-context";
import { formatMonthKey } from "@/lib/date-utils";
import { EASE_OUT, spring, tap } from "@/lib/motion";
import { Meter } from "@/components/motion/Gauge";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";

/**
 * Shown once when a month closes.
 *
 * Deliberately a single, dismissible moment: the month key is written to
 * localStorage as soon as it is opened or dismissed, so it never reappears
 * for the same month on the same device.
 */
export const MonthEndPrompt = () => {
  const { pendingMonth, dismissPending, openPending, buildReport, isGenerating } = useReports();
  const { formatAmount } = useCurrency();

  const report = useMemo(
    () => (pendingMonth ? buildReport(pendingMonth) : null),
    [pendingMonth, buildReport],
  );

  // Escape closes, and the page behind should not scroll while it is open.
  useEffect(() => {
    if (!pendingMonth) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissPending();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [pendingMonth, dismissPending]);

  return (
    <AnimatePresence>
      {pendingMonth && report && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={dismissPending}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="month-end-title"
            initial={{ opacity: 0, scale: 0.94, y: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.96, y: 16, filter: "blur(6px)" }}
            transition={spring.layout}
            className="surface-card relative z-10 w-full max-w-md rounded-sm p-8"
          >
            <button
              type="button"
              onClick={dismissPending}
              aria-label="Dismiss"
              className="absolute right-4 top-4 p-2 text-white/35 transition-colors hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5, ease: EASE_OUT }}
              className="mb-6 flex items-center gap-2"
            >
              <Sparkles className="h-3.5 w-3.5 text-white/70" />
              <span className="eyebrow">Month closed</span>
            </motion.div>

            <h2 id="month-end-title" className="font-display text-3xl leading-tight text-gradient">
              {formatMonthKey(pendingMonth)}
              <br />
              is ready to review
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Your spending breakdown, full ledger and progress across sleep, training,
              tasks and objectives — collected into one PDF.
            </p>

            {/* Headline numbers */}
            <div className="my-7 grid grid-cols-3 gap-2">
              {[
                { label: "Spent", value: formatAmount(report.spending.total, 0) },
                { label: "Tasks", value: String(report.tasks.completed) },
                { label: "Score", value: String(report.score) },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + i * 0.07, duration: 0.5, ease: EASE_OUT }}
                  className="surface-well rounded-sm p-3 text-center"
                >
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  <p className="mt-1 truncate text-sm font-medium text-white">{s.value}</p>
                </motion.div>
              ))}
            </div>

            <div className="mb-7">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="eyebrow">Month score</span>
                <AnimatedNumber value={report.score} className="mono-font text-xs text-white/70" suffix=" / 100" />
              </div>
              <Meter value={report.score / 100} height={3} shimmer delay={0.4} />
            </div>

            <div className="flex gap-3">
              <motion.button
                type="button"
                whileTap={tap}
                onClick={dismissPending}
                className="ghost-button flex-1 py-2.5 text-sm"
              >
                Later
              </motion.button>
              <motion.button
                type="button"
                whileTap={tap}
                onClick={openPending}
                disabled={isGenerating}
                className="hud-button flex flex-[1.6] items-center justify-center gap-2 py-2.5 text-sm"
              >
                <Download className="h-4 w-4" />
                Get the PDF
              </motion.button>
            </div>

            <p className="mt-4 text-center text-[10px] text-muted-foreground/60">
              You can download any month later from the Expenses page.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
