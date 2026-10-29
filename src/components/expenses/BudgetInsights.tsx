import { useMemo } from "react";
import { motion } from "framer-motion";
import { useExpenses } from "@/lib/expenses-context";
import { useCurrency } from "@/lib/currency-context";
import { useReports } from "@/lib/reports-context";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { toLocalMonthKey } from "@/lib/date-utils";
import { EASE_OUT } from "@/lib/motion";

/**
 * On-screen version of the report's analysis.
 *
 * Reads the same engine that writes the PDF, so the app and the export can
 * never disagree about the month.
 */
export const BudgetInsights = () => {
  const { buildReport } = useReports();
  const { formatAmount } = useCurrency();
  const { expenses } = useExpenses();

  const report = useMemo(() => buildReport(toLocalMonthKey()), [buildReport]);

  const tiles = [
    { label: "Daily average", value: formatAmount(report.spending.dailyAverage, 0) },
    {
      label: "Projected month",
      value: formatAmount(report.spending.projectedTotal, 0),
      sub: "at your current pace",
    },
    {
      label: "No-spend days",
      value: String(report.spending.quietDays),
      sub: `of ${report.daysElapsed} so far`,
    },
    {
      label: "vs last month",
      value:
        report.spending.changePct === null
          ? "—"
          : `${report.spending.changePct > 0 ? "+" : ""}${report.spending.changePct.toFixed(0)}%`,
      sub:
        report.spending.previousTotal > 0
          ? `was ${formatAmount(report.spending.previousTotal, 0)}`
          : "no prior data",
    },
  ];

  return (
    <SpotlightCard className="h-full rounded-sm" reveal delay={0.25}>
      <div className="border-b border-white/5 px-6 py-6 md:px-8">
        <h2 className="font-display text-xl">This Month, Read Back</h2>
        <p className="mt-1 text-xs text-muted-foreground">The same analysis that goes into your PDF</p>
      </div>

      <div className="p-6 md:p-8">
        <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map((t, i) => (
            <motion.div
              key={t.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, ease: EASE_OUT, delay: i * 0.05 }}
              className="surface-well rounded-sm p-3.5"
            >
              <p className="text-[10px] text-muted-foreground">{t.label}</p>
              <p className="mt-1 truncate text-lg font-medium text-white">{t.value}</p>
              {t.sub && <p className="mt-0.5 truncate text-[10px] text-muted-foreground/60">{t.sub}</p>}
            </motion.div>
          ))}
        </div>

        {report.insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {expenses.length === 0
              ? "Log a few expenses and this fills in automatically."
              : "Not enough history yet to draw conclusions."}
          </p>
        ) : (
          <ul className="space-y-3">
            {report.insights.slice(0, 6).map((line, i) => (
              <motion.li
                key={line}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, ease: EASE_OUT, delay: i * 0.06 }}
                className="flex gap-3"
              >
                <span className="mono-font mt-0.5 shrink-0 text-[10px] text-white/30">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground">{line}</span>
              </motion.li>
            ))}
          </ul>
        )}

        <div className="mt-7 flex items-center justify-between border-t border-white/5 pt-5">
          <span className="hud-label">Month score</span>
          <span className="font-display text-2xl text-white">
            <AnimatedNumber value={report.score} animateOnView />
            <span className="mono-font ml-1 text-xs text-muted-foreground">/ 100</span>
          </span>
        </div>
      </div>
    </SpotlightCard>
  );
};
