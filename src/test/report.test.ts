import { describe, expect, it } from "vitest";
import { buildMonthlyReport, reportHasData, type ReportInput } from "@/lib/report-data";
import { toLocalISODate } from "@/lib/date-utils";
import type { Expense } from "@/lib/expenses-context";
import type { GoalV2, SleepRecordV2, TodoV2, WorkoutRecordV2 } from "@/lib/dashboard-context";

/* A closed month, so figures are never "partial" and the assertions are stable. */
const MONTH = "2026-08";
const PREV = "2026-07";

const expense = (date: string, amount: number, category: Expense["category"], note = ""): Expense => ({
  id: `${date}-${amount}-${category}`,
  date,
  amount,
  category,
  note,
  user_id: "u1",
});

function fixture(): ReportInput {
  const expenses: Expense[] = [
    expense(`${MONTH}-02`, 1200, "Food", "Groceries"),
    expense(`${MONTH}-02`, 300, "Transport", "Cab"),
    expense(`${MONTH}-09`, 8000, "Housing", "Rent"),
    expense(`${MONTH}-14`, 2500, "Shopping", "Jacket"),
    expense(`${MONTH}-14`, 450, "Food", "Dinner"),
    expense(`${MONTH}-21`, 900, "Bills", "Internet"),
    expense(`${PREV}-11`, 6000, "Housing", "Rent"),
    expense(`${PREV}-12`, 4000, "Food", "Groceries"),
  ];

  const sleep: SleepRecordV2[] = [
    { id: "s1", date: `${MONTH}-01`, timestamp: "", hours: 7 },
    { id: "s2", date: `${MONTH}-02`, timestamp: "", hours: 8 },
    { id: "s3", date: `${MONTH}-03`, timestamp: "", hours: 6.5 },
    { id: "s4", date: `${MONTH}-04`, timestamp: "", hours: 9 },
    { id: "s5", date: `${PREV}-04`, timestamp: "", hours: 5 },
  ];

  const workouts: WorkoutRecordV2[] = [
    { id: "w1", date: `${MONTH}-01`, timestamp: "", durationMinutes: 45, type: "Cardio" },
    { id: "w2", date: `${MONTH}-02`, timestamp: "", durationMinutes: 60, type: "Strength" },
    { id: "w3", date: `${MONTH}-03`, timestamp: "", durationMinutes: 30, type: "Recovery" },
    { id: "w4", date: `${MONTH}-10`, timestamp: "", durationMinutes: 50, type: "Cardio" },
    { id: "w5", date: `${PREV}-10`, timestamp: "", durationMinutes: 20, type: "Cardio" },
  ];

  const todos: TodoV2[] = [
    { id: "t1", text: "Ship report", priority: "P1", completed: true, createdAt: `${MONTH}-05T09:00:00`, completedAt: `${MONTH}-05T17:00:00` },
    { id: "t2", text: "Call bank", priority: "P2", completed: true, createdAt: `${MONTH}-05T09:10:00`, completedAt: `${MONTH}-05T12:00:00` },
    { id: "t3", text: "Read chapter", priority: "P3", completed: false, createdAt: `${MONTH}-06T09:00:00` },
    { id: "t4", text: "Renew lease", priority: "P1", completed: false, createdAt: `${MONTH}-18T09:00:00` },
  ];

  const goals: GoalV2[] = [
    {
      id: "g1", title: "Run a half marathon", deadline: `${MONTH}-30`, category: "health",
      progress: 100, completed: true, completedAt: `${MONTH}-28T10:00:00`, createdAt: `${PREV}-01T10:00:00`,
      subTasks: [{ id: "st1", text: "10k", completed: true }],
    },
    {
      id: "g2", title: "Emergency fund", deadline: "2020-01-01", category: "finance",
      progress: 40, completed: false, createdAt: `${MONTH}-01T10:00:00`, subTasks: [],
    },
  ];

  return {
    monthKey: MONTH,
    expenses,
    budgets: { Food: 1500, Housing: 9000, Shopping: 1000 },
    income: 20000,
    sleep,
    workouts,
    todos,
    goals,
  };
}

describe("buildMonthlyReport", () => {
  const report = buildMonthlyReport(fixture());

  it("totals only the requested month", () => {
    expect(report.spending.total).toBe(1200 + 300 + 8000 + 2500 + 450 + 900);
    expect(report.spending.transactions).toBe(6);
    expect(report.spending.previousTotal).toBe(10000);
  });

  it("computes the month-over-month change", () => {
    // 13350 vs 10000
    expect(report.spending.changePct).toBeCloseTo(33.5, 1);
  });

  it("flags only the categories that broke their budget", () => {
    const over = report.spending.overBudget.map((c) => c.category).sort();
    // Food 1650/1500 and Shopping 2500/1000 are over; Housing 8000/9000 is not.
    expect(over).toEqual(["Food", "Shopping"]);
  });

  it("ranks categories by spend", () => {
    expect(report.spending.categories[0].category).toBe("Housing");
    expect(report.spending.categories[0].share).toBeCloseTo(8000 / 13350, 4);
  });

  it("covers every day of the month in the daily series", () => {
    expect(report.spending.days).toHaveLength(31);
    expect(report.spending.days.find((d) => d.date === `${MONTH}-09`)?.total).toBe(8000);
  });

  it("measures sleep against the 8h target", () => {
    expect(report.sleep.nightsLogged).toBe(4);
    expect(report.sleep.averageHours).toBeCloseTo(7.625, 3);
    expect(report.sleep.debtHours).toBeCloseTo(8 * 4 - 30.5, 3);
    expect(report.sleep.previousAverage).toBe(5);
  });

  it("finds the longest consecutive training run", () => {
    // Aug 1-2-3 is a run of 3; Aug 10 is separate.
    expect(report.workouts.longestStreak).toBe(3);
    expect(report.workouts.activeDays).toBe(4);
    expect(report.workouts.totalMinutes).toBe(185);
  });

  it("scores task completion against tasks raised that month", () => {
    expect(report.tasks.created).toBe(4);
    expect(report.tasks.completed).toBe(2);
    expect(report.tasks.completionRate).toBeCloseTo(0.5, 5);
    expect(report.tasks.mostProductiveDay?.count).toBe(2);
  });

  it("separates closed objectives from overdue ones", () => {
    expect(report.goals.completedThisMonth).toBe(1);
    expect(report.goals.active).toBe(1);
    expect(report.goals.overdue).toBe(1);
  });

  it("produces readable insights", () => {
    expect(report.insights.length).toBeGreaterThan(3);
    expect(report.insights.join(" ")).toContain("Housing");
  });

  it("scores the month between 0 and 100", () => {
    expect(report.score).toBeGreaterThan(0);
    expect(report.score).toBeLessThanOrEqual(100);
  });

  it("reports an empty month as having no data", () => {
    const empty = buildMonthlyReport({
      monthKey: "2019-01",
      expenses: [], budgets: {}, income: 0, sleep: [], workouts: [], todos: [], goals: [],
    });
    expect(reportHasData(empty)).toBe(false);
    expect(empty.spending.total).toBe(0);
    expect(empty.score).toBe(0);
  });
});

describe("monthly plan", () => {
  it("prefers the planned budget over salary for the spending pool", () => {
    const input = fixture();
    input.salary = 40000;
    input.monthlyBudget = 15000;
    const r = buildMonthlyReport(input);

    expect(r.spending.salary).toBe(40000);
    expect(r.spending.plannedBudget).toBe(15000);
    // 13350 spent against a 15000 budget.
    expect(r.spending.remaining).toBe(15000 - 13350);
  });

  it("reports what was kept out of salary, not out of the budget", () => {
    const input = fixture();
    input.salary = 40000;
    input.monthlyBudget = 15000;
    const r = buildMonthlyReport(input);

    expect(r.spending.saved).toBe(40000 - 13350);
    expect(r.spending.savingsRate).toBeCloseTo((40000 - 13350) / 40000, 5);
    expect(r.insights.join(" ")).toContain("savings rate");
  });

  it("flags a month that spent more than it earned", () => {
    const input = fixture();
    input.salary = 10000; // less than the 13350 spent
    input.monthlyBudget = 12000;
    const r = buildMonthlyReport(input);

    expect(r.spending.saved).toBeLessThan(0);
    expect(r.insights.join(" ")).toContain("more than you earned");
  });

  it("says whether the month landed inside the budget that was set", () => {
    const under = buildMonthlyReport({ ...fixture(), salary: 40000, monthlyBudget: 20000 });
    expect(under.insights.join(" ")).toContain("under the budget you set");

    const over = buildMonthlyReport({ ...fixture(), salary: 40000, monthlyBudget: 10000 });
    expect(over.insights.join(" ")).toContain("past the budget you set");
  });

  it("falls back to income when no plan was ever confirmed", () => {
    // The fixture sets income: 20000 and no salary/monthlyBudget.
    const r = buildMonthlyReport(fixture());
    expect(r.spending.salary).toBe(20000);
    expect(r.spending.plannedBudget).toBe(0);
    expect(r.spending.remaining).toBe(20000 - 13350);
  });
});

describe("report PDF", () => {
  it("renders a multi-page document without throwing", async () => {
    const { buildReportPdf } = await import("@/lib/report-pdf");
    const doc = buildReportPdf({
      report: buildMonthlyReport(fixture()),
      currency: "INR",
      userName: "yashraj",
    });

    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(4);

    const bytes = doc.output("arraybuffer");
    expect(bytes.byteLength).toBeGreaterThan(5000);
    // Valid PDF header.
    expect(new TextDecoder().decode(new Uint8Array(bytes).slice(0, 5))).toBe("%PDF-");
  });

  it("survives text the core PDF fonts cannot encode", async () => {
    const { buildReportPdf } = await import("@/lib/report-pdf");
    const input = fixture();
    input.expenses = [
      { ...expense(`${MONTH}-03`, 500, "Food"), note: "Café ☕ 日本語 — “smart quotes”" },
    ];
    input.goals = [
      { id: "g9", title: "🎯 Emoji goal", deadline: `${MONTH}-30`, category: "personal", progress: 10, completed: false, createdAt: `${MONTH}-01T00:00:00`, subTasks: [] },
    ];

    const doc = buildReportPdf({
      report: buildMonthlyReport(input),
      currency: "USD",
      userName: "Zoë",
    });
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
  });

  it("handles a month with a single expense and nothing else", async () => {
    const { buildReportPdf } = await import("@/lib/report-pdf");
    const doc = buildReportPdf({
      report: buildMonthlyReport({
        monthKey: toLocalISODate().slice(0, 7),
        expenses: [expense(`${toLocalISODate()}`, 10, "Other")],
        budgets: {}, income: 0, sleep: [], workouts: [], todos: [], goals: [],
      }),
      currency: "INR",
      userName: "yashraj",
    });
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(3);
  });
});
