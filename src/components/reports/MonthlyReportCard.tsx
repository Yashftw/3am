import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Download, FileText, Loader2 } from "lucide-react";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Meter } from "@/components/motion/Gauge";
import { useReports } from "@/lib/reports-context";
import { useCurrency } from "@/lib/currency-context";
import { formatMonthKey, toLocalMonthKey } from "@/lib/date-utils";
import { EASE_OUT, spring, staggerContainer, fadeIn, tap } from "@/lib/motion";

/**
 * Report generator on the Expenses page.
 *
 * Shows a live preview of the selected month's headline numbers so it is
 * obvious what the PDF will contain before spending a second generating it.
 */
export const MonthlyReportCard = () => {
  const { availableMonths, buildReport, downloadReport, isGenerating } = useReports();
  const { formatAmount } = useCurrency();

  const [monthKey, setMonthKey] = useState(() => availableMonths[0] ?? toLocalMonthKey());
  const [pickerOpen, setPickerOpen] = useState(false);

  const report = useMemo(() => buildReport(monthKey), [buildReport, monthKey]);

  const stats = [
    { label: "Spent", value: formatAmount(report.spending.total, 0) },
    { label: "Entries", value: String(report.spending.transactions) },
    { label: "Tasks done", value: String(report.tasks.completed) },
    { label: "Avg sleep", value: report.sleep.nightsLogged ? `${report.sleep.averageHours.toFixed(1)}h` : "--" },
  ];

  return (
    <SpotlightCard className="rounded-sm" reveal>
      <div className="flex flex-col gap-1 border-b border-white/5 px-6 py-6 md:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="hud-badge h-10 w-10 rounded-sm border-white/15">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-xl">Monthly Report</h2>
              <p className="mt-1 text-xs text-muted-foreground">Spending and progress, as a PDF</p>
            </div>
          </div>

          {/* Month picker */}
          <div className="relative">
            <motion.button
              type="button"
              whileTap={tap}
              onClick={() => setPickerOpen((v) => !v)}
              className="ghost-button flex h-9 items-center gap-2 px-3 text-xs"
              aria-expanded={pickerOpen}
              aria-haspopup="listbox"
            >
              <span className="mono-font uppercase tracking-wider">{formatMonthKey(monthKey)}</span>
              <motion.span animate={{ rotate: pickerOpen ? 180 : 0 }} transition={spring.snappy}>
                <ChevronDown className="h-3.5 w-3.5" />
              </motion.span>
            </motion.button>

            <AnimatePresence>
              {pickerOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
                  <motion.ul
                    role="listbox"
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={spring.layout}
                    className="absolute right-0 z-50 mt-2 max-h-64 w-44 origin-top-right overflow-y-auto border border-white/10 bg-[#101010]/95 py-1 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
                  >
                    {availableMonths.map((m) => (
                      <li key={m}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={m === monthKey}
                          onClick={() => { setMonthKey(m); setPickerOpen(false); }}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-white/[0.07] ${
                            m === monthKey ? "text-white" : "text-muted-foreground"
                          }`}
                        >
                          <span>{formatMonthKey(m)}</span>
                          {m === toLocalMonthKey() && (
                            <span className="mono-font text-[8px] uppercase tracking-wider text-white/40">now</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {/* Score */}
        <div className="mb-6 flex items-end justify-between gap-6">
          <div>
            <p className="hud-label">Month score</p>
            <div className="mt-1 flex items-baseline gap-2">
              <AnimatedNumber
                key={monthKey}
                value={report.score}
                className="hud-glow font-display text-5xl tracking-tight text-gradient"
              />
              <span className="mono-font text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>
          {report.isPartial && (
            <span className="mono-font mb-1 text-[9px] uppercase tracking-[0.18em] text-white/35">
              {report.daysElapsed} of {report.daysInMonth} days
            </span>
          )}
        </div>

        <Meter key={`${monthKey}-meter`} value={report.score / 100} height={3} shimmer className="mb-7" />

        {/* Score components */}
        <motion.div
          key={`${monthKey}-breakdown`}
          variants={staggerContainer(0.05)}
          initial="hidden"
          animate="visible"
          className="mb-7 space-y-3"
        >
          {report.scoreBreakdown.map((part, i) => (
            <motion.div key={part.label} variants={fadeIn} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-xs text-muted-foreground">{part.label}</span>
              <Meter value={part.value / 100} height={3} delay={i * 0.06} className="flex-1" />
              <span className="mono-font w-9 shrink-0 text-right text-[11px] text-white/70">{part.value}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Preview figures */}
        <div className="mb-7 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={`${monthKey}-${s.label}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE_OUT, delay: i * 0.05 }}
              className="surface-well rounded-sm p-3"
            >
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p className="mt-1 truncate text-base font-medium text-white">{s.value}</p>
            </motion.div>
          ))}
        </div>

        <motion.button
          type="button"
          whileTap={tap}
          onClick={() => downloadReport(monthKey)}
          disabled={isGenerating}
          className="hud-button flex w-full items-center justify-center gap-2 py-3 text-sm"
        >
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {isGenerating ? "Building your report" : `Download ${formatMonthKey(monthKey)} PDF`}
        </motion.button>

        <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground/70">
          Cover, spending breakdown, full ledger, progress and insights.
          {report.isPartial && " This month is still open, so figures are partial."}
        </p>
      </div>
    </SpotlightCard>
  );
};
