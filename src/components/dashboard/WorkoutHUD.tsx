import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Check, Flame } from "lucide-react";
import { useDashboard, type WorkoutCategory } from "@/lib/dashboard-context";
import { lastNDates, toLocalISODate } from "@/lib/date-utils";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { EASE_OUT, spring, tap } from "@/lib/motion";

const CATEGORY_COLORS: Record<WorkoutCategory, string> = {
  Cardio: "#fca5a5",
  Strength: "#93c5fd",
  Flexibility: "#d8b4fe",
  Recovery: "#86efac",
};

const CATEGORIES = Object.keys(CATEGORY_COLORS) as WorkoutCategory[];

/** Hairline separation between ring segments, as a fraction of the circle. */
const SEGMENT_GAP = 0.008;

export const WorkoutHUD = () => {
  const { workoutData, addWorkout, streak } = useDashboard();
  const [durationInput, setDurationInput] = useState("");
  const [categoryInput, setCategoryInput] = useState<WorkoutCategory>("Cardio");
  const [justLogged, setJustLogged] = useState(false);

  const todayStr = toLocalISODate();
  const last7 = lastNDates(7);

  const todayMinutes = workoutData
    .filter((w) => w.date === todayStr)
    .reduce((a, w) => a + w.durationMinutes, 0);

  const weeklyWorkouts = workoutData.filter((w) => last7.includes(w.date));
  const weeklyTotalMins = weeklyWorkouts.reduce((acc, w) => acc + w.durationMinutes, 0);
  const weeklyAvgMins = weeklyTotalMins / 7;

  const categoryTotals = weeklyWorkouts.reduce((acc, w) => {
    acc[w.type] = (acc[w.type] || 0) + w.durationMinutes;
    return acc;
  }, {} as Record<WorkoutCategory, number>);

  const handleLog = (e: React.FormEvent) => {
    e.preventDefault();
    const min = parseInt(durationInput, 10);
    if (Number.isNaN(min) || min <= 0) return;

    addWorkout(todayStr, min, categoryInput);
    setDurationInput("");
    setJustLogged(true);
    setTimeout(() => setJustLogged(false), 1400);
  };

  /* Segmented ring. Each category is an arc drawn with pathLength, so the
     whole ring assembles in sequence instead of snapping into place. */
  const radius = 44;
  const total = Math.max(weeklyTotalMins, 1);
  let offset = 0;
  const arcs = CATEGORIES.map((cat) => {
    const minutes = categoryTotals[cat] || 0;
    const fraction = minutes / total;
    const arc = { cat, fraction, start: offset, minutes };
    offset += fraction;
    return arc;
  }).filter((a) => a.minutes > 0);

  return (
    <SpotlightCard className="h-full rounded-sm p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            className="hud-badge h-10 w-10 rounded-sm border-white/15"
            whileHover={{ rotate: 8, scale: 1.05 }}
            transition={spring.snappy}
          >
            <Activity className="h-4.5 w-4.5" />
          </motion.div>
          <div>
            <h2 className="font-display text-xl text-white">Physical</h2>
            <p className="text-xs text-muted-foreground">Activity log</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AnimatePresence>
            {justLogged && (
              <motion.div
                initial={{ opacity: 0, scale: 0.7, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={spring.snappy}
                className="flex items-center gap-1.5 border border-white/20 bg-white/10 px-2 py-1"
              >
                <Check className="h-3 w-3 text-white" />
                <span className="mono-font text-[9px] uppercase tracking-wider text-white">Saved</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-white">
              <motion.span
                animate={streak > 0 ? { scale: [1, 1.14, 1] } : {}}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Flame className={`h-5 w-5 ${streak > 0 ? "text-orange-400/80" : "text-white/20"}`} />
              </motion.span>
              <AnimatedNumber value={streak} className="text-xl font-medium" />
            </div>
            <span className="text-[11px] text-muted-foreground">Active streak</span>
          </div>
        </div>
      </div>

      <div className="mb-6 flex gap-6">
        <div className="relative h-[126px] w-[126px] flex-shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90 overflow-visible">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
            {/*
              pathLength and pathOffset are framer's own path-drawing props and
              it derives strokeDasharray from them. Setting dasharray by hand as
              well left a dead wedge in the ring.
            */}
            {arcs.map((arc, i) => (
              <motion.circle
                key={arc.cat}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={CATEGORY_COLORS[arc.cat]}
                strokeWidth="12"
                strokeLinecap="butt"
                initial={{ pathLength: 0, pathOffset: arc.start }}
                animate={{ pathLength: Math.max(arc.fraction - SEGMENT_GAP, 0.004), pathOffset: arc.start }}
                transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.1 + i * 0.1 }}
                style={{ filter: `drop-shadow(0 0 5px ${CATEGORY_COLORS[arc.cat]}44)` }}
              />
            ))}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <AnimatedNumber value={weeklyTotalMins} className="font-display hud-glow text-2xl text-foreground" />
            <span className="mono-font text-[10px] uppercase text-muted-foreground">wk mins</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-2">
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
            {CATEGORIES.map((cat, i) => {
              const active = (categoryTotals[cat] || 0) > 0;
              return (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05, duration: 0.4, ease: EASE_OUT }}
                  className="flex items-center gap-1.5"
                >
                  <span
                    className="h-2 w-2 rounded-full transition-opacity"
                    style={{
                      backgroundColor: CATEGORY_COLORS[cat],
                      opacity: active ? 1 : 0.25,
                      boxShadow: active ? `0 0 6px ${CATEGORY_COLORS[cat]}80` : "none",
                    }}
                  />
                  <span className={`text-xs ${active ? "text-white/80" : "text-muted-foreground"}`}>{cat}</span>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-2 flex gap-4 border-t border-white/5 pt-2.5">
            <div>
              <p className="hud-label">Daily avg</p>
              <p className="text-lg font-medium text-white">
                <AnimatedNumber value={Math.round(weeklyAvgMins)} />m
              </p>
            </div>
            <div>
              <p className="hud-label">Today</p>
              <p className="text-lg font-medium text-white">
                <AnimatedNumber value={todayMinutes} />m
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleLog} className="mt-auto flex gap-2">
        <select
          value={categoryInput}
          onChange={(e) => setCategoryInput(e.target.value as WorkoutCategory)}
          className="hud-input w-28 px-2 py-2 text-xs"
          aria-label="Workout type"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          placeholder="Minutes"
          value={durationInput}
          onChange={(e) => setDurationInput(e.target.value)}
          className="hud-input flex-1 px-3 py-2 text-sm"
          aria-label="Duration in minutes"
        />
        <motion.button whileTap={tap} type="submit" className="hud-button px-5 py-2 text-sm">
          Log
        </motion.button>
      </form>
    </SpotlightCard>
  );
};
