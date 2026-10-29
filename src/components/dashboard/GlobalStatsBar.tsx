import { motion } from "framer-motion";
import { useDashboard, todosForDate } from "@/lib/dashboard-context";
import { lastNDates, toLocalISODate } from "@/lib/date-utils";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { EASE_OUT } from "@/lib/motion";

interface Stat {
  label: string;
  value: string;
  /** Numeric part, counted up; the string is used when there is nothing to count. */
  numeric?: number;
  decimals?: number;
  suffix?: string;
}

export const GlobalStatsBar = () => {
  const { streak, sleepData, workoutData, todos, goals } = useDashboard();

  const recentSleep = [...sleepData]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 7);
  const avgSleep = recentSleep.length
    ? recentSleep.reduce((acc, s) => acc + s.hours, 0) / recentSleep.length
    : null;

  const week = lastNDates(7);
  const workoutsThisWeek = workoutData.filter((w) => week.includes(w.date)).length;

  const todayTodos = todosForDate(todos, toLocalISODate());
  const doneToday = todayTodos.filter((t) => t.completed).length;

  const activeGoals = goals.filter((g) => !g.completed).length;

  const stats: Stat[] = [
    { label: "Streak", value: `${streak} days`, numeric: streak, suffix: " days" },
    {
      label: "Avg sleep",
      value: avgSleep === null ? "--" : `${avgSleep.toFixed(1)}h`,
      numeric: avgSleep ?? undefined,
      decimals: 1,
      suffix: "h",
    },
    { label: "Weekly workouts", value: String(workoutsThisWeek), numeric: workoutsThisWeek },
    { label: "Tasks today", value: `${doneToday}/${todayTodos.length}` },
    { label: "Active goals", value: String(activeGoals), numeric: activeGoals },
  ];

  return (
    <div className="no-scrollbar w-full overflow-x-auto border-y border-white/[0.07] bg-[#0a0a0a]/70 py-3 backdrop-blur-sm">
      <div className="mx-auto flex min-w-max max-w-[1600px] items-center gap-7 px-6 text-sm text-muted-foreground md:gap-14 md:px-12">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.07, duration: 0.5, ease: EASE_OUT }}
            className="flex items-center gap-7 md:gap-14"
          >
            <span className="whitespace-nowrap">
              <span className="mono-font text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
                {stat.label}
              </span>{" "}
              <span className="font-bold text-white">
                {stat.numeric !== undefined ? (
                  <AnimatedNumber
                    value={stat.numeric}
                    decimals={stat.decimals ?? 0}
                    suffix={stat.suffix ?? ""}
                  />
                ) : (
                  stat.value
                )}
              </span>
            </span>
            {i < stats.length - 1 && <span className="h-3.5 w-px bg-white/10" />}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
