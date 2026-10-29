import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useExpenses } from "./expenses-context";
import { useDashboard } from "./dashboard-context";
import { useCurrency } from "./currency-context";
import { useUser } from "./user-context";
import { buildMonthlyReport, reportHasData, type MonthlyReport } from "./report-data";
import { loadLocal, saveLocal } from "./local-store";
import { formatMonthKey, isoToLocalDate, previousMonthKey, toLocalMonthKey } from "./date-utils";

interface ReportsContextValue {
  /** Every month that has at least one logged item, newest first. */
  availableMonths: string[];
  buildReport: (monthKey: string) => MonthlyReport;
  downloadReport: (monthKey: string) => Promise<void>;
  isGenerating: boolean;
  /** The closed month we are prompting about, or null. */
  pendingMonth: string | null;
  dismissPending: () => void;
  openPending: () => void;
  /** Force the prompt open again (used by the Reports card). */
  promptFor: (monthKey: string) => void;
}

const ReportsContext = createContext<ReportsContextValue | null>(null);

const SEEN_SCOPE = "reportSeen";

export const ReportsProvider = ({ children }: { children: ReactNode }) => {
  const { expenses, budgets, income, salary, monthlyBudget } = useExpenses();
  const { sleepData, workoutData, todos, goals, isLoading } = useDashboard();
  const { currency } = useCurrency();
  const { user, username } = useUser();
  const uid = user?.uid ?? null;

  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingMonth, setPendingMonth] = useState<string | null>(null);

  const buildReport = useCallback(
    (monthKey: string) =>
      buildMonthlyReport({
        monthKey,
        expenses,
        budgets,
        income,
        salary,
        monthlyBudget,
        sleep: sleepData,
        workouts: workoutData,
        todos,
        goals,
      }),
    [expenses, budgets, income, salary, monthlyBudget, sleepData, workoutData, todos, goals],
  );

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    const add = (date?: string) => {
      if (date && /^\d{4}-\d{2}/.test(date)) months.add(date.slice(0, 7));
    };

    expenses.forEach((e) => add(e.date));
    sleepData.forEach((s) => add(s.date));
    workoutData.forEach((w) => add(w.date));
    todos.forEach((t) => {
      add(isoToLocalDate(t.createdAt));
      if (t.completedAt) add(isoToLocalDate(t.completedAt));
    });
    goals.forEach((g) => add(isoToLocalDate(g.createdAt)));

    // Always offer the current month, even on a brand new account.
    months.add(toLocalMonthKey());

    return Array.from(months).sort().reverse();
  }, [expenses, sleepData, workoutData, todos, goals]);

  const downloadReport = useCallback(
    async (monthKey: string) => {
      setIsGenerating(true);
      try {
        // jsPDF is ~400kB and only ever needed here, so it is fetched on
        // demand rather than shipped in the main bundle.
        const { downloadReportPdf } = await import("./report-pdf");
        // Yield a frame so the button can paint its loading state before the
        // synchronous PDF build blocks the main thread.
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        const report = buildReport(monthKey);
        downloadReportPdf({ report, currency, userName: username });
        toast.success(`${formatMonthKey(monthKey)} report downloaded`, {
          description: "Spending, progress and insights in one PDF.",
        });
      } catch (err) {
        console.error("[3am] Report generation failed.", err);
        toast.error("Couldn't build that report", {
          description: err instanceof Error ? err.message : "Please try again.",
        });
      } finally {
        setIsGenerating(false);
      }
    },
    [buildReport, currency, username],
  );

  /* ---------------------------------------------------------------- */
  /* Month-end prompt                                                  */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (isLoading) return;

    const lastMonth = previousMonthKey();
    const seen = loadLocal<string[]>(SEEN_SCOPE, uid, []);
    if (seen.includes(lastMonth)) return;

    // Only interrupt if the closed month actually has something in it.
    if (!reportHasData(buildReport(lastMonth))) return;

    // Let the page settle before the modal arrives.
    const timer = setTimeout(() => setPendingMonth(lastMonth), 1400);
    return () => clearTimeout(timer);
  }, [isLoading, uid, buildReport]);

  const markSeen = useCallback(
    (monthKey: string) => {
      const seen = loadLocal<string[]>(SEEN_SCOPE, uid, []);
      if (!seen.includes(monthKey)) saveLocal(SEEN_SCOPE, uid, [...seen, monthKey]);
    },
    [uid],
  );

  const dismissPending = useCallback(() => {
    if (pendingMonth) markSeen(pendingMonth);
    setPendingMonth(null);
  }, [pendingMonth, markSeen]);

  const openPending = useCallback(async () => {
    if (!pendingMonth) return;
    const month = pendingMonth;
    markSeen(month);
    setPendingMonth(null);
    await downloadReport(month);
  }, [pendingMonth, markSeen, downloadReport]);

  const promptFor = useCallback((monthKey: string) => setPendingMonth(monthKey), []);

  const value = useMemo<ReportsContextValue>(
    () => ({
      availableMonths,
      buildReport,
      downloadReport,
      isGenerating,
      pendingMonth,
      dismissPending,
      openPending,
      promptFor,
    }),
    [availableMonths, buildReport, downloadReport, isGenerating, pendingMonth, dismissPending, openPending, promptFor],
  );

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>;
};

export const useReports = () => {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error("useReports must be used within ReportsProvider");
  return ctx;
};
