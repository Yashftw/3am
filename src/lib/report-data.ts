import {
  CATEGORIES,
  type Budgets,
  type Expense,
  type ExpenseCategory,
} from "./expenses-context";
import type { GoalV2, SleepRecordV2, TodoV2, WorkoutCategory, WorkoutRecordV2 } from "./dashboard-context";
import {
  datesInMonth,
  daysElapsedInMonth,
  daysInMonthKey,
  formatMonthKey,
  isoToLocalDate,
  shiftMonthKey,
  toLocalMonthKey,
} from "./date-utils";

const SLEEP_TARGET_HOURS = 8;

export interface CategoryLine {
  category: ExpenseCategory;
  color: string;
  total: number;
  budget: number;
  share: number; // 0..1 of month total
  /** null when no budget is set for the category. */
  budgetUsed: number | null;
  transactions: number;
}

export interface DayLine {
  date: string;
  label: string;
  total: number;
}

export interface SpendingReport {
  total: number;
  previousTotal: number;
  /** null when there is no previous month to compare against. */
  changePct: number | null;
  transactions: number;
  dailyAverage: number;
  projectedTotal: number;
  busiestDay: DayLine | null;
  quietDays: number;
  income: number;
  /** Monthly take-home pay, as confirmed in the plan. */
  salary: number;
  /** Planned spend for the month. */
  plannedBudget: number;
  /** salary - total, i.e. what actually stayed put. */
  saved: number;
  /** saved / salary, 0..1. */
  savingsRate: number;
  remaining: number;
  categories: CategoryLine[];
  days: DayLine[];
  topExpenses: Expense[];
  ledger: Expense[];
  overBudget: CategoryLine[];
  totalBudget: number;
}

export interface SleepReport {
  nightsLogged: number;
  averageHours: number;
  bestHours: number;
  worstHours: number;
  totalHours: number;
  /** Hours short of (positive) or over (negative) the 8h target. */
  debtHours: number;
  onTargetNights: number;
  consistency: number; // 0..1, higher means less night-to-night variance
  previousAverage: number | null;
}

export interface WorkoutReport {
  sessions: number;
  totalMinutes: number;
  activeDays: number;
  averageSessionMinutes: number;
  longestStreak: number;
  byType: Array<{ type: WorkoutCategory; minutes: number; sessions: number }>;
  previousMinutes: number | null;
}

export interface TaskReport {
  created: number;
  completed: number;
  completionRate: number; // 0..1
  byPriority: Array<{ priority: "P1" | "P2" | "P3"; created: number; completed: number }>;
  mostProductiveDay: { date: string; label: string; count: number } | null;
  activeDays: number;
}

export interface GoalReport {
  completedThisMonth: number;
  active: number;
  overdue: number;
  averageProgress: number; // 0..100
  subTasksCompleted: number;
  highlights: Array<{ title: string; category: string; progress: number; completed: boolean; deadline: string }>;
}

export interface MonthlyReport {
  monthKey: string;
  monthLabel: string;
  generatedAt: Date;
  daysInMonth: number;
  daysElapsed: number;
  isPartial: boolean;
  spending: SpendingReport;
  sleep: SleepReport;
  workouts: WorkoutReport;
  tasks: TaskReport;
  goals: GoalReport;
  /** Plain-language observations derived from the numbers above. */
  insights: string[];
  /** 0..100 composite of the four tracked habits. */
  score: number;
  scoreBreakdown: Array<{ label: string; value: number; detail: string }>;
}

export interface ReportInput {
  monthKey: string;
  expenses: Expense[];
  budgets: Budgets;
  income: number;
  /** Confirmed monthly salary; falls back to income when absent. */
  salary?: number;
  /** Confirmed planned spend; takes precedence over income for the pool. */
  monthlyBudget?: number;
  sleep: SleepRecordV2[];
  workouts: WorkoutRecordV2[];
  todos: TodoV2[];
  goals: GoalV2[];
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const inMonth = (date: string | undefined, monthKey: string) => !!date && date.startsWith(monthKey);
const dayLabel = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/* ------------------------------------------------------------------ */
/* Spending                                                            */
/* ------------------------------------------------------------------ */

function buildSpending(input: ReportInput, daysElapsed: number, totalDays: number): SpendingReport {
  const { monthKey, expenses, budgets, income } = input;
  const salary = input.salary ?? income;
  const plannedBudget = input.monthlyBudget ?? 0;
  const prevKey = shiftMonthKey(monthKey, -1);

  const monthExpenses = expenses.filter((e) => inMonth(e.date, monthKey));
  const prevExpenses = expenses.filter((e) => inMonth(e.date, prevKey));

  const total = sum(monthExpenses.map((e) => e.amount));
  const previousTotal = sum(prevExpenses.map((e) => e.amount));
  const changePct = prevExpenses.length > 0 && previousTotal > 0
    ? ((total - previousTotal) / previousTotal) * 100
    : null;

  const categories: CategoryLine[] = CATEGORIES.map((cat) => {
    const rows = monthExpenses.filter((e) => e.category === cat.name);
    const catTotal = sum(rows.map((e) => e.amount));
    const budget = budgets[cat.name] ?? 0;
    return {
      category: cat.name,
      color: cat.color,
      total: catTotal,
      budget,
      share: total > 0 ? catTotal / total : 0,
      budgetUsed: budget > 0 ? catTotal / budget : null,
      transactions: rows.length,
    };
  }).sort((a, b) => b.total - a.total);

  const days: DayLine[] = datesInMonth(monthKey).map((date) => ({
    date,
    label: dayLabel(date),
    total: sum(monthExpenses.filter((e) => e.date === date).map((e) => e.amount)),
  }));

  const spentDays = days.filter((d) => d.total > 0);
  const busiestDay = spentDays.length
    ? spentDays.reduce((best, d) => (d.total > best.total ? d : best))
    : null;

  // Average across days actually elapsed, not the whole month, so a report
  // pulled mid-month is not artificially flattered.
  const divisor = Math.max(daysElapsed, 1);
  const dailyAverage = total / divisor;

  const totalBudget = sum(CATEGORIES.map((c) => budgets[c.name] ?? 0));
  // Same precedence as the app: planned budget, then salary, then the sum of
  // category limits. The report must never disagree with the screen.
  const pool = plannedBudget > 0 ? plannedBudget : income > 0 ? income : totalBudget;

  const saved = salary > 0 ? salary - total : 0;

  return {
    total,
    previousTotal,
    changePct,
    transactions: monthExpenses.length,
    dailyAverage,
    projectedTotal: dailyAverage * totalDays,
    busiestDay,
    quietDays: Math.max(daysElapsed - spentDays.length, 0),
    income,
    salary,
    plannedBudget,
    saved,
    savingsRate: salary > 0 ? saved / salary : 0,
    remaining: Math.max(pool - total, 0),
    categories,
    days,
    topExpenses: [...monthExpenses].sort((a, b) => b.amount - a.amount).slice(0, 10),
    ledger: [...monthExpenses].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    overBudget: categories.filter((c) => c.budget > 0 && c.total > c.budget),
    totalBudget,
  };
}

/* ------------------------------------------------------------------ */
/* Sleep                                                               */
/* ------------------------------------------------------------------ */

function buildSleep(input: ReportInput): SleepReport {
  const { monthKey, sleep } = input;
  const rows = sleep.filter((s) => inMonth(s.date, monthKey) && s.hours > 0);
  const prevRows = sleep.filter((s) => inMonth(s.date, shiftMonthKey(monthKey, -1)) && s.hours > 0);

  const hours = rows.map((s) => s.hours);
  const totalHours = sum(hours);
  const averageHours = rows.length ? totalHours / rows.length : 0;

  // Standard deviation mapped onto 0..1. Two hours of swing reads as zero
  // consistency, which matches how uneven that actually feels.
  const variance = rows.length
    ? sum(hours.map((h) => (h - averageHours) ** 2)) / rows.length
    : 0;
  const consistency = rows.length ? Math.max(0, 1 - Math.sqrt(variance) / 2) : 0;

  return {
    nightsLogged: rows.length,
    averageHours,
    bestHours: hours.length ? Math.max(...hours) : 0,
    worstHours: hours.length ? Math.min(...hours) : 0,
    totalHours,
    debtHours: rows.length ? SLEEP_TARGET_HOURS * rows.length - totalHours : 0,
    onTargetNights: hours.filter((h) => h >= SLEEP_TARGET_HOURS - 0.25).length,
    consistency,
    previousAverage: prevRows.length ? sum(prevRows.map((s) => s.hours)) / prevRows.length : null,
  };
}

/* ------------------------------------------------------------------ */
/* Workouts                                                            */
/* ------------------------------------------------------------------ */

function buildWorkouts(input: ReportInput): WorkoutReport {
  const { monthKey, workouts } = input;
  const rows = workouts.filter((w) => inMonth(w.date, monthKey));
  const prevRows = workouts.filter((w) => inMonth(w.date, shiftMonthKey(monthKey, -1)));

  const totalMinutes = sum(rows.map((w) => w.durationMinutes));
  const activeDates = Array.from(new Set(rows.map((w) => w.date))).sort();

  // Longest run of consecutive calendar days inside the month.
  let longestStreak = 0;
  let run = 0;
  let previous: Date | null = null;
  for (const iso of activeDates) {
    const current = new Date(`${iso}T00:00:00`);
    const consecutive =
      previous !== null && Math.round((current.getTime() - previous.getTime()) / 86400000) === 1;
    run = consecutive ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    previous = current;
  }

  const types: WorkoutCategory[] = ["Cardio", "Strength", "Flexibility", "Recovery"];
  const byType = types
    .map((type) => {
      const typeRows = rows.filter((w) => w.type === type);
      return { type, minutes: sum(typeRows.map((w) => w.durationMinutes)), sessions: typeRows.length };
    })
    .filter((t) => t.sessions > 0)
    .sort((a, b) => b.minutes - a.minutes);

  return {
    sessions: rows.length,
    totalMinutes,
    activeDays: activeDates.length,
    averageSessionMinutes: rows.length ? totalMinutes / rows.length : 0,
    longestStreak,
    byType,
    previousMinutes: prevRows.length ? sum(prevRows.map((w) => w.durationMinutes)) : null,
  };
}

/* ------------------------------------------------------------------ */
/* Tasks                                                               */
/* ------------------------------------------------------------------ */

function buildTasks(input: ReportInput): TaskReport {
  const { monthKey, todos } = input;
  const created = todos.filter((t) => inMonth(isoToLocalDate(t.createdAt), monthKey));
  const completed = todos.filter((t) => t.completedAt && inMonth(isoToLocalDate(t.completedAt), monthKey));

  const priorities: Array<"P1" | "P2" | "P3"> = ["P1", "P2", "P3"];
  const byPriority = priorities.map((priority) => ({
    priority,
    created: created.filter((t) => t.priority === priority).length,
    completed: completed.filter((t) => t.priority === priority).length,
  }));

  const perDay = new Map<string, number>();
  for (const t of completed) {
    const date = isoToLocalDate(t.completedAt!);
    perDay.set(date, (perDay.get(date) ?? 0) + 1);
  }

  let mostProductiveDay: TaskReport["mostProductiveDay"] = null;
  for (const [date, count] of perDay) {
    if (!mostProductiveDay || count > mostProductiveDay.count) {
      mostProductiveDay = { date, label: dayLabel(date), count };
    }
  }

  return {
    created: created.length,
    completed: completed.length,
    // Measured against tasks raised this month; a rate over 100% would mean
    // clearing a backlog, so it is capped for readability.
    completionRate: created.length ? Math.min(completed.length / created.length, 1) : 0,
    byPriority,
    mostProductiveDay,
    activeDays: perDay.size,
  };
}

/* ------------------------------------------------------------------ */
/* Goals                                                               */
/* ------------------------------------------------------------------ */

function buildGoals(input: ReportInput): GoalReport {
  const { monthKey, goals } = input;
  const today = new Date();

  const completedThisMonth = goals.filter(
    (g) => g.completed && g.completedAt && inMonth(isoToLocalDate(g.completedAt), monthKey),
  ).length;

  const active = goals.filter((g) => !g.completed);
  const overdue = active.filter((g) => g.deadline && new Date(`${g.deadline}T23:59:59`) < today).length;

  const subTasksCompleted = goals.reduce(
    (acc, g) => acc + (g.subTasks?.filter((st) => st.completed).length ?? 0),
    0,
  );

  return {
    completedThisMonth,
    active: active.length,
    overdue,
    averageProgress: goals.length ? sum(goals.map((g) => g.progress)) / goals.length : 0,
    subTasksCompleted,
    highlights: [...goals]
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return b.progress - a.progress;
      })
      .slice(0, 8)
      .map((g) => ({
        title: g.title,
        category: g.category,
        progress: g.progress,
        completed: g.completed,
        deadline: g.deadline,
      })),
  };
}

/* ------------------------------------------------------------------ */
/* Score + insights                                                    */
/* ------------------------------------------------------------------ */

function buildScore(
  spending: SpendingReport,
  sleep: SleepReport,
  workouts: WorkoutReport,
  tasks: TaskReport,
  daysElapsed: number,
): { score: number; breakdown: MonthlyReport["scoreBreakdown"] } {
  const days = Math.max(daysElapsed, 1);

  // Sleep: how close the nightly average sat to the 8h target.
  const sleepScore = sleep.nightsLogged
    ? Math.round(Math.min(sleep.averageHours / SLEEP_TARGET_HOURS, 1) * 100)
    : 0;

  // Movement: 4 active days a week is treated as full marks.
  const targetActiveDays = (days / 7) * 4;
  const movementScore = targetActiveDays
    ? Math.round(Math.min(workouts.activeDays / targetActiveDays, 1) * 100)
    : 0;

  const focusScore = Math.round(tasks.completionRate * 100);

  // Budget: full marks while total spend is at or under the available pool.
  const pool = spending.plannedBudget > 0
    ? spending.plannedBudget
    : spending.income > 0 ? spending.income : spending.totalBudget;
  const budgetScore = pool > 0
    ? Math.round(Math.max(0, Math.min(1, 1 - Math.max(0, spending.total - pool) / pool)) * 100)
    : spending.total > 0 ? 70 : 0;

  const breakdown: MonthlyReport["scoreBreakdown"] = [
    { label: "Rest", value: sleepScore, detail: sleep.nightsLogged ? `${sleep.averageHours.toFixed(1)}h avg over ${sleep.nightsLogged} nights` : "No nights logged" },
    { label: "Movement", value: movementScore, detail: workouts.sessions ? `${workouts.activeDays} active days, ${workouts.totalMinutes} min` : "No sessions logged" },
    { label: "Focus", value: focusScore, detail: tasks.created ? `${tasks.completed} of ${tasks.created} tasks cleared` : "No tasks logged" },
    { label: "Budget", value: budgetScore, detail: pool > 0 ? `${Math.round((spending.total / pool) * 100)}% of the month's budget used` : "No budget set" },
  ];

  const counted = breakdown.filter((b) => b.value > 0);
  const score = counted.length ? Math.round(sum(counted.map((b) => b.value)) / counted.length) : 0;

  return { score, breakdown };
}

function buildInsights(report: Omit<MonthlyReport, "insights">): string[] {
  const { spending, sleep, workouts, tasks, goals, daysElapsed } = report;
  const out: string[] = [];

  if (spending.changePct !== null) {
    const magnitude = Math.abs(spending.changePct);
    if (magnitude < 5) {
      out.push(`Spending held steady, within ${magnitude.toFixed(1)}% of last month.`);
    } else if (spending.changePct < 0) {
      out.push(`You spent ${magnitude.toFixed(0)}% less than last month. That is real progress.`);
    } else {
      out.push(`Spending rose ${magnitude.toFixed(0)}% versus last month. Worth a look at what shifted.`);
    }
  }

  if (spending.salary > 0) {
    if (spending.saved > 0) {
      out.push(
        `You kept ${spending.saved.toFixed(0)} of a ${spending.salary.toFixed(0)} salary, a ${(spending.savingsRate * 100).toFixed(0)}% savings rate.`,
      );
    } else {
      out.push(`You spent ${Math.abs(spending.saved).toFixed(0)} more than you earned this month.`);
    }
  }

  if (spending.plannedBudget > 0) {
    const delta = spending.total - spending.plannedBudget;
    out.push(
      delta > 0
        ? `That is ${delta.toFixed(0)} past the budget you set at the start of the month.`
        : `You finished ${Math.abs(delta).toFixed(0)} under the budget you set.`,
    );
  }

  const top = spending.categories[0];
  if (top && top.total > 0) {
    out.push(`${top.category} was your largest category at ${(top.share * 100).toFixed(0)}% of everything you spent.`);
  }

  if (spending.overBudget.length > 0) {
    const names = spending.overBudget.map((c) => c.category).join(", ");
    out.push(`Over budget in ${spending.overBudget.length === 1 ? "one category" : `${spending.overBudget.length} categories`}: ${names}.`);
  } else if (spending.totalBudget > 0) {
    out.push("Every category with a budget stayed inside it.");
  }

  if (spending.quietDays > 0) {
    out.push(`${spending.quietDays} no-spend ${spending.quietDays === 1 ? "day" : "days"} out of ${daysElapsed}.`);
  }

  if (sleep.nightsLogged >= 3) {
    if (sleep.debtHours > 6) {
      out.push(`You are carrying about ${sleep.debtHours.toFixed(0)} hours of sleep debt against an 8 hour target.`);
    } else if (sleep.debtHours < -3) {
      out.push(`You slept ${Math.abs(sleep.debtHours).toFixed(0)} hours beyond target across the month.`);
    } else {
      out.push(`Sleep landed close to target, averaging ${sleep.averageHours.toFixed(1)} hours.`);
    }
    if (sleep.previousAverage !== null) {
      const delta = sleep.averageHours - sleep.previousAverage;
      if (Math.abs(delta) >= 0.3) {
        out.push(`That is ${Math.abs(delta).toFixed(1)}h ${delta > 0 ? "more" : "less"} per night than last month.`);
      }
    }
  }

  if (workouts.sessions > 0) {
    out.push(`${workouts.sessions} ${workouts.sessions === 1 ? "session" : "sessions"} across ${workouts.activeDays} days, ${workouts.totalMinutes} minutes total.`);
    if (workouts.longestStreak >= 3) {
      out.push(`Longest unbroken run: ${workouts.longestStreak} days.`);
    }
    if (workouts.previousMinutes !== null && workouts.previousMinutes > 0) {
      const delta = ((workouts.totalMinutes - workouts.previousMinutes) / workouts.previousMinutes) * 100;
      if (Math.abs(delta) >= 10) {
        out.push(`Training volume is ${Math.abs(delta).toFixed(0)}% ${delta > 0 ? "up" : "down"} on last month.`);
      }
    }
  }

  if (tasks.created > 0) {
    out.push(`You cleared ${tasks.completed} of ${tasks.created} tasks, a ${(tasks.completionRate * 100).toFixed(0)}% completion rate.`);
    if (tasks.mostProductiveDay) {
      out.push(`Best day was ${tasks.mostProductiveDay.label} with ${tasks.mostProductiveDay.count} tasks done.`);
    }
  }

  if (goals.completedThisMonth > 0) {
    out.push(`${goals.completedThisMonth} ${goals.completedThisMonth === 1 ? "objective" : "objectives"} closed out this month.`);
  }
  if (goals.overdue > 0) {
    out.push(`${goals.overdue} ${goals.overdue === 1 ? "objective is" : "objectives are"} past deadline and still open.`);
  }

  return out;
}

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

export function buildMonthlyReport(input: ReportInput): MonthlyReport {
  const { monthKey } = input;
  const totalDays = daysInMonthKey(monthKey);
  const daysElapsed = daysElapsedInMonth(monthKey);

  const spending = buildSpending(input, daysElapsed, totalDays);
  const sleep = buildSleep(input);
  const workouts = buildWorkouts(input);
  const tasks = buildTasks(input);
  const goals = buildGoals(input);
  const { score, breakdown } = buildScore(spending, sleep, workouts, tasks, daysElapsed);

  const base: Omit<MonthlyReport, "insights"> = {
    monthKey,
    monthLabel: formatMonthKey(monthKey),
    generatedAt: new Date(),
    daysInMonth: totalDays,
    daysElapsed,
    isPartial: monthKey === toLocalMonthKey(),
    spending,
    sleep,
    workouts,
    tasks,
    goals,
    score,
    scoreBreakdown: breakdown,
  };

  return { ...base, insights: buildInsights(base) };
}

/** True when the month has any activity worth reporting on. */
export function reportHasData(report: MonthlyReport): boolean {
  return (
    report.spending.transactions > 0 ||
    report.sleep.nightsLogged > 0 ||
    report.workouts.sessions > 0 ||
    report.tasks.created > 0 ||
    report.goals.highlights.length > 0
  );
}
