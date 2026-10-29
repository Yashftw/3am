import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, Flame, Plus } from "lucide-react";
import { useExpenses } from "@/lib/expenses-context";
import { useDashboard, todosForDate, type WorkoutCategory } from "@/lib/dashboard-context";
import { useCurrency } from "@/lib/currency-context";
import { useSync } from "@/lib/sync-status";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Gauge, Meter } from "@/components/motion/Gauge";
import { useFlashOnChange } from "@/hooks/use-flash-on-change";
import {
  daysElapsedInMonth,
  daysInMonthKey,
  isOnLocalDate,
  lastNDates,
  relativeTime,
  toLocalISODate,
  toLocalMonthKey,
} from "@/lib/date-utils";
import { EASE_OUT, staggerContainer, fadeIn, spring, tap } from "@/lib/motion";

/**
 * Glanceable home-screen surfaces.
 *
 * This is the closest a web app can get to a home-screen widget: neither iOS
 * nor Android lets a PWA publish a real WidgetKit / App Widget surface. What
 * it can do is be a home-screen tile that opens straight to one screen of
 * numbers, reads from the offline cache so it paints instantly with no
 * network, and needs no scrolling or navigation to be useful.
 *
 * Because a tile is only a URL, each view here can be added to the home
 * screen separately — one tile for tasks, another for training — instead of
 * forcing everything through a single summary.
 *
 * Deliberately chrome-free: no nav, no footer, nothing to tap by accident.
 */

export type WidgetView = "overview" | "spending" | "tasks" | "training";

export const WIDGET_VIEWS: Array<{
  id: WidgetView;
  path: string;
  name: string;
  blurb: string;
}> = [
  { id: "overview", path: "/widget", name: "Everything", blurb: "Spending, tasks, sleep and streak in one" },
  { id: "spending", path: "/widget/spending", name: "Spending", blurb: "Budget, pace and where it's going" },
  { id: "tasks", path: "/widget/tasks", name: "Tasks", blurb: "Today's list, tickable from the tile" },
  { id: "training", path: "/widget/training", name: "Training", blurb: "Streak, weekly minutes, quick log" },
];

const isView = (v: string | undefined): v is WidgetView =>
  v === "spending" || v === "tasks" || v === "training" || v === "overview";

export default function Widget() {
  const { view } = useParams();
  const active: WidgetView = isView(view) ? view : "overview";
  const { state, lastSyncedAt } = useSync();

  // A tile is glanceable, so keep relative times honest while it is open.
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const heading = WIDGET_VIEWS.find((v) => v.id === active)!;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-6">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="mb-5 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <motion.span
            className="h-1.5 w-1.5 bg-white"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            style={{ boxShadow: "0 0 10px rgba(255,255,255,0.8)" }}
          />
          <span className="font-display text-base tracking-[0.2em]">3am</span>
        </div>
        <span className="hud-label">
          {state === "offline" ? "Offline" : active === "overview" ? "Summary" : heading.name}
        </span>
      </motion.header>

      <motion.div
        key={active}
        variants={staggerContainer(0.07)}
        initial="hidden"
        animate="visible"
        className="flex flex-1 flex-col gap-3"
      >
        {active === "overview" && <OverviewView />}
        {active === "spending" && <SpendingView />}
        {active === "tasks" && <TasksView />}
        {active === "training" && <TrainingView />}
      </motion.div>

      <Actions view={active} />

      <p className="mono-font mt-4 text-center text-[9px] uppercase tracking-[0.16em] text-white/20">
        {state === "offline"
          ? "Offline · showing your saved data"
          : lastSyncedAt
            ? `Synced ${relativeTime(new Date(lastSyncedAt).toISOString())}`
            : "Live"}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

const Panel = ({ children, scan = false }: { children: React.ReactNode; scan?: boolean }) => (
  <motion.section
    variants={fadeIn}
    className={`surface-card hud-frame rounded-sm p-5 ${scan ? "hud-scan" : ""}`}
  >
    {children}
  </motion.section>
);

const Row = ({
  label,
  value,
  ratio,
  color = "#ffffff",
}: {
  label: string;
  value: string;
  ratio: number;
  color?: string;
}) => (
  <div className="flex items-center gap-3">
    <span className="w-16 shrink-0 text-xs text-muted-foreground">{label}</span>
    <Meter value={ratio} color={color} height={3} className="flex-1" />
    <span className="mono-font w-12 shrink-0 text-right text-[11px] tabular-nums text-white">
      {value}
    </span>
  </div>
);

/** Bars for a seven-day series, with a floor so quiet days stay legible. */
const WeekBars = ({
  values,
  height = 40,
  color = "#ffffff",
}: {
  values: number[];
  height?: number;
  color?: string;
}) => {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {values.map((v, i) => (
        <motion.div
          key={i}
          className="flex-1"
          style={{ backgroundColor: color, opacity: i === values.length - 1 ? 1 : 0.35 }}
          initial={{ height: 0 }}
          animate={{ height: `${v > 0 ? Math.max((v / max) * 100, 16) : 4}%` }}
          transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.2 + i * 0.04 }}
        />
      ))}
    </div>
  );
};

const Actions = ({ view }: { view: WidgetView }) => {
  const primary =
    view === "tasks" || view === "training"
      ? { to: "/", label: view === "tasks" ? "Open tasks" : "Open dashboard" }
      : { to: "/expenses", label: "Add expense" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5, ease: EASE_OUT }}
      className="mt-5 flex gap-3"
    >
      <Link to={primary.to} className="flex-1">
        <motion.span
          whileTap={tap}
          className="hud-button hud-cut flex w-full items-center justify-center gap-2 py-3 text-sm"
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
          {primary.label}
        </motion.span>
      </Link>
      <Link to="/">
        <motion.span
          whileTap={tap}
          className="ghost-button flex items-center justify-center gap-1.5 px-4 py-3 text-sm"
        >
          Full app
          <ArrowUpRight className="h-3.5 w-3.5" />
        </motion.span>
      </Link>
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/* Spending                                                            */
/* ------------------------------------------------------------------ */

function useSpending() {
  const { monthTotal, todayTotal, byCategory, expenses, spendingPool } = useExpenses();
  const monthKey = toLocalMonthKey();
  const elapsed = Math.max(daysElapsedInMonth(monthKey), 1);
  const totalDays = daysInMonthKey(monthKey);

  const pool = spendingPool;
  const remaining = pool > 0 ? pool - monthTotal : null;
  const usedRatio = pool > 0 ? monthTotal / pool : 0;

  /**
   * Ahead of or behind an even burn rate. A month 60% elapsed with 45% of the
   * pool spent is the good case, and it is what people want at a glance.
   */
  const pace = pool > 0 ? usedRatio - elapsed / totalDays : 0;

  const week = useMemo(
    () => lastNDates(7).map((iso) => expenses.filter((e) => e.date === iso).reduce((s, e) => s + e.amount, 0)),
    [expenses],
  );

  return {
    monthTotal,
    todayTotal,
    byCategory,
    pool,
    remaining,
    usedRatio,
    overspent: remaining !== null && remaining < 0,
    daysLeft: Math.max(totalDays - elapsed, 0),
    paceLabel: pool <= 0 ? null : pace > 0.06 ? "ahead of pace" : pace < -0.06 ? "under pace" : "on pace",
    week,
  };
}

const SpendHeadline = () => {
  const s = useSpending();
  const { formatAmount } = useCurrency();
  const flash = useFlashOnChange(s.monthTotal);

  return (
    <Panel scan>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="hud-label mb-2">Spent this month</p>
          <p
            className={`hud-glow font-display text-4xl leading-none ${
              s.overspent ? "text-[#FF4060]" : "text-white"
            } ${flash ? "animate-hud-tick" : ""}`}
          >
            <AnimatedNumber value={s.monthTotal} format={(n) => formatAmount(n, 0)} />
          </p>
          {s.remaining !== null && (
            <p className="mt-2 text-xs text-muted-foreground">
              {formatAmount(Math.abs(s.remaining), 0)} {s.overspent ? "over" : "left"}
              {s.paceLabel && <span className="text-muted-foreground/60"> · {s.paceLabel}</span>}
            </p>
          )}
        </div>

        {s.pool > 0 && (
          <Gauge
            value={Math.min(s.usedRatio, 1)}
            size={72}
            strokeWidth={6}
            color={s.overspent ? "#FF4060" : "#ffffff"}
            glow
          >
            <span className="mono-font text-[11px] font-bold text-white">
              {Math.round(s.usedRatio * 100)}%
            </span>
          </Gauge>
        )}
      </div>

      <div className="mt-5">
        <WeekBars values={s.week} />
        <p className="mono-font mt-2 text-[9px] uppercase tracking-[0.18em] text-white/30">
          Last 7 days
        </p>
      </div>
    </Panel>
  );
};

const CategoryList = ({ limit = 4 }: { limit?: number }) => {
  const { byCategory } = useExpenses();
  const { formatAmount } = useCurrency();
  const rows = byCategory.filter((c) => c.total > 0).sort((a, b) => b.total - a.total).slice(0, limit);
  if (rows.length === 0) return null;

  return (
    <Panel>
      <p className="hud-label mb-3.5">Where it's going</p>
      <div className="space-y-2.5">
        {rows.map((cat) => {
          const over = cat.budget > 0 && cat.total > cat.budget;
          return (
            <div key={cat.category} className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="flex-1 truncate text-xs text-muted-foreground">{cat.category}</span>
              {over && (
                <span className="mono-font shrink-0 text-[9px] uppercase text-[#FF4060]">over</span>
              )}
              <span className="mono-font shrink-0 text-xs tabular-nums text-white">
                {formatAmount(cat.total, 0)}
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

const SpendingView = () => {
  const s = useSpending();
  const { formatAmount } = useCurrency();

  return (
    <>
      <SpendHeadline />
      <motion.section variants={fadeIn} className="grid grid-cols-2 gap-3">
        <div className="surface-card hud-frame rounded-sm p-4">
          <p className="hud-label mb-1.5">Today</p>
          <p className="font-display text-2xl text-white">
            <AnimatedNumber value={s.todayTotal} format={(n) => formatAmount(n, 0)} />
          </p>
        </div>
        <div className="surface-card hud-frame rounded-sm p-4">
          <p className="hud-label mb-1.5">Days left</p>
          <p className="font-display text-2xl text-white">{s.daysLeft}</p>
        </div>
      </motion.section>
      <CategoryList limit={6} />
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Tasks                                                               */
/* ------------------------------------------------------------------ */

const TasksView = () => {
  const { todos, toggleTodo } = useDashboard();
  const today = toLocalISODate();
  const todayTodos = todosForDate(todos, today);
  const done = todayTodos.filter((t) => t.completed).length;
  const pct = todayTodos.length ? done / todayTodos.length : 0;

  const week = useMemo(
    () =>
      lastNDates(7).map((iso) => todos.filter((t) => t.completed && isOnLocalDate(t.completedAt, iso)).length),
    [todos],
  );
  const weekTotal = week.reduce((a, b) => a + b, 0);

  // Consecutive days with at least one completion, counting back from today.
  // Today being empty does not break a run that is still live.
  let streak = 0;
  for (let i = 6; i >= 0; i--) {
    if (week[i] > 0) streak++;
    else if (i !== 6) break;
  }

  const sorted = [...todayTodos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return a.priority.localeCompare(b.priority);
  });

  return (
    <>
      <Panel scan>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="hud-label mb-2">Done today</p>
            <p className="hud-glow font-display text-4xl leading-none text-white">
              {done}
              <span className="text-2xl text-white/35"> / {todayTodos.length}</span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {todayTodos.length === 0
                ? "Nothing queued"
                : done === todayTodos.length
                  ? "All clear"
                  : `${todayTodos.length - done} to go`}
            </p>
          </div>
          <Gauge value={pct} size={72} strokeWidth={6} glow>
            <span className="mono-font text-[11px] font-bold text-white">{Math.round(pct * 100)}%</span>
          </Gauge>
        </div>

        <div className="mt-5">
          <WeekBars values={week} />
          <p className="mono-font mt-2 text-[9px] uppercase tracking-[0.18em] text-white/30">
            Last 7 days · {weekTotal} cleared
          </p>
        </div>
      </Panel>

      {/* Tickable straight from the tile — the one thing worth doing here. */}
      <Panel>
        <p className="hud-label mb-3.5">Today's list</p>
        {sorted.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted-foreground">Nothing for today.</p>
        ) : (
          <div className="space-y-1">
            <AnimatePresence initial={false}>
              {sorted.map((t) => (
                <motion.button
                  key={t.id}
                  layout
                  type="button"
                  onClick={() => toggleTodo(t.id)}
                  whileTap={{ scale: 0.98 }}
                  transition={spring.gentle}
                  className="flex w-full items-center gap-3 px-1 py-2 text-left"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      t.completed ? "border-transparent bg-white" : "border-white/45 bg-[#0a0a0a]"
                    }`}
                  >
                    {t.completed && <Check className="h-2.5 w-2.5 text-black" strokeWidth={3.5} />}
                  </span>
                  <span
                    className={`flex-1 truncate text-sm ${
                      t.completed ? "text-white/35 line-through" : "text-white"
                    }`}
                  >
                    {t.text}
                  </span>
                  {!t.completed && (
                    <span className="mono-font shrink-0 text-[9px] text-white/30">{t.priority}</span>
                  )}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </Panel>

      <motion.section variants={fadeIn} className="grid grid-cols-2 gap-3">
        <div className="surface-card hud-frame rounded-sm p-4">
          <p className="hud-label mb-1.5">Day streak</p>
          <p className="font-display text-2xl text-white">
            <AnimatedNumber value={streak} />
            <span className="text-sm text-white/40">d</span>
          </p>
        </div>
        <div className="surface-card hud-frame rounded-sm p-4">
          <p className="hud-label mb-1.5">This week</p>
          <p className="font-display text-2xl text-white">
            <AnimatedNumber value={weekTotal} />
          </p>
        </div>
      </motion.section>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Training                                                            */
/* ------------------------------------------------------------------ */

const CATEGORY_COLORS: Record<WorkoutCategory, string> = {
  Cardio: "#fca5a5",
  Strength: "#93c5fd",
  Flexibility: "#d8b4fe",
  Recovery: "#86efac",
};
const TYPES = Object.keys(CATEGORY_COLORS) as WorkoutCategory[];

const TrainingView = () => {
  const { workoutData, streak, addWorkout } = useDashboard();
  const today = toLocalISODate();
  const week = lastNDates(7);

  const [minutes, setMinutes] = useState("");
  const [type, setType] = useState<WorkoutCategory>("Cardio");

  const weekly = workoutData.filter((w) => week.includes(w.date));
  const weeklyMinutes = weekly.reduce((s, w) => s + w.durationMinutes, 0);
  const activeDays = new Set(weekly.map((w) => w.date)).size;
  const todayMinutes = workoutData
    .filter((w) => w.date === today)
    .reduce((s, w) => s + w.durationMinutes, 0);

  const perDay = week.map((iso) =>
    workoutData.filter((w) => w.date === iso).reduce((s, w) => s + w.durationMinutes, 0),
  );

  const byType = TYPES.map((t) => ({
    type: t,
    minutes: weekly.filter((w) => w.type === t).reduce((s, w) => s + w.durationMinutes, 0),
  })).filter((t) => t.minutes > 0);

  const log = (e: React.FormEvent) => {
    e.preventDefault();
    const m = parseInt(minutes, 10);
    if (Number.isNaN(m) || m <= 0) return;
    addWorkout(today, m, type);
    setMinutes("");
  };

  return (
    <>
      <Panel scan>
        <p className="hud-label mb-2">Active streak</p>
        <p className="hud-glow flex items-baseline gap-2 font-display text-4xl leading-none text-white">
          <motion.span
            animate={streak > 0 ? { scale: [1, 1.12, 1] } : {}}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex self-center"
          >
            <Flame className={`h-7 w-7 ${streak > 0 ? "text-orange-400/80" : "text-white/20"}`} />
          </motion.span>
          <AnimatedNumber value={streak} />
          <span className="text-2xl text-white/35">days</span>
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {todayMinutes > 0 ? `${todayMinutes} min logged today` : "Nothing logged today yet"}
        </p>

        <div className="mt-5">
          <WeekBars values={perDay} />
          <p className="mono-font mt-2 text-[9px] uppercase tracking-[0.18em] text-white/30">
            Last 7 days · {weeklyMinutes} min
          </p>
        </div>
      </Panel>

      <motion.section variants={fadeIn} className="grid grid-cols-2 gap-3">
        <div className="surface-card hud-frame rounded-sm p-4">
          <p className="hud-label mb-1.5">This week</p>
          <p className="font-display text-2xl text-white">
            <AnimatedNumber value={weeklyMinutes} />
            <span className="text-sm text-white/40">m</span>
          </p>
        </div>
        <div className="surface-card hud-frame rounded-sm p-4">
          <p className="hud-label mb-1.5">Active days</p>
          <p className="font-display text-2xl text-white">
            <AnimatedNumber value={activeDays} />
            <span className="text-sm text-white/40">/7</span>
          </p>
        </div>
      </motion.section>

      {byType.length > 0 && (
        <Panel>
          <p className="hud-label mb-3.5">By type</p>
          <div className="space-y-3">
            {byType.map((t) => (
              <Row
                key={t.type}
                label={t.type}
                value={`${t.minutes}m`}
                ratio={weeklyMinutes > 0 ? t.minutes / weeklyMinutes : 0}
                color={CATEGORY_COLORS[t.type]}
              />
            ))}
          </div>
        </Panel>
      )}

      {/* Logging a session is the one thing worth doing from this tile. */}
      <Panel>
        <p className="hud-label mb-3">Log a session</p>
        {/*
          Stacked rather than one row: at phone width the select, the input and
          the button did not fit, and the card clips its overflow, so the
          button was silently cut off the right edge.
        */}
        <form onSubmit={log} className="space-y-2">
          <div className="flex gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as WorkoutCategory)}
              className="hud-input w-32 shrink-0 px-2 py-2.5 text-xs"
              aria-label="Session type"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              placeholder="Minutes"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="hud-input min-w-0 flex-1 px-3 py-2.5 text-sm"
              aria-label="Duration in minutes"
            />
          </div>
          <motion.button
            whileTap={tap}
            type="submit"
            disabled={!minutes}
            className="hud-button w-full py-2.5 text-sm"
          >
            Log session
          </motion.button>
        </form>
      </Panel>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */

const OverviewView = () => {
  const s = useSpending();
  const { streak, todos, sleepData } = useDashboard();
  const { formatAmount } = useCurrency();

  const today = toLocalISODate();
  const todayTodos = todosForDate(todos, today);
  const tasksDone = todayTodos.filter((t) => t.completed).length;
  const slept = sleepData.find((x) => x.date === today)?.hours ?? 0;

  return (
    <>
      <SpendHeadline />

      <motion.section variants={fadeIn} className="grid grid-cols-2 gap-3">
        <div className="surface-card hud-frame rounded-sm p-4">
          <p className="hud-label mb-1.5">Today</p>
          <p className="font-display text-2xl text-white">
            <AnimatedNumber value={s.todayTotal} format={(n) => formatAmount(n, 0)} />
          </p>
        </div>
        <div className="surface-card hud-frame rounded-sm p-4">
          <p className="hud-label mb-1.5">Streak</p>
          <p className="flex items-center gap-1.5 font-display text-2xl text-white">
            <Flame className={`h-4 w-4 ${streak > 0 ? "text-orange-400/80" : "text-white/20"}`} />
            <AnimatedNumber value={streak} />
            <span className="text-sm text-white/40">d</span>
          </p>
        </div>
      </motion.section>

      <Panel>
        <p className="hud-label mb-4">Today's progress</p>
        <div className="space-y-3.5">
          <Row
            label="Tasks"
            value={todayTodos.length ? `${tasksDone}/${todayTodos.length}` : "—"}
            ratio={todayTodos.length ? tasksDone / todayTodos.length : 0}
          />
          <Row label="Sleep" value={slept ? `${slept}h` : "—"} ratio={Math.min(slept / 8, 1)} />
          <Row
            label="Budget"
            value={s.pool > 0 ? `${Math.round(s.usedRatio * 100)}%` : "—"}
            ratio={Math.min(s.usedRatio, 1)}
            color={s.overspent ? "#FF4060" : "#ffffff"}
          />
        </div>
      </Panel>

      <CategoryList />
    </>
  );
};
