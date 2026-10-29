import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Moon } from "lucide-react";
import { useDashboard } from "@/lib/dashboard-context";
import { lastNDates, toLocalISODate } from "@/lib/date-utils";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Gauge } from "@/components/motion/Gauge";
import { EASE_OUT, spring, tap } from "@/lib/motion";

const TARGET = 8;

/** Greyscale-to-blue ramp, matching the original palette. */
const colorFor = (hours: number) => {
  if (hours === 0) return "#1e293b";
  if (hours < 6) return "#475569";
  if (hours < 7) return "#94a3b8";
  if (hours <= 9) return "#93c5fd";
  return "#cbd5e1";
};

export const SleepHUD = () => {
  const { sleepData, addSleep } = useDashboard();
  const [hoursInput, setHoursInput] = useState("");
  const [justLogged, setJustLogged] = useState(false);

  const todayStr = toLocalISODate();
  const todayRecord = sleepData.find((s) => s.date === todayStr);
  const currentHours = todayRecord?.hours ?? 0;

  const weeklyData = lastNDates(7).map((date) => ({
    date,
    hours: sleepData.find((s) => s.date === date)?.hours ?? 0,
  }));

  const bestNight = Math.max(...weeklyData.map((d) => d.hours), 0);
  const weekTotal = weeklyData.reduce((acc, d) => acc + d.hours, 0);
  const weeklyAvg = weekTotal / 7;
  const sleepDebt = TARGET * 7 - weekTotal;

  const handleLog = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseFloat(hoursInput);
    if (Number.isNaN(h) || h <= 0) return;

    addSleep(todayStr, h);
    setHoursInput("");
    setJustLogged(true);
    setTimeout(() => setJustLogged(false), 1400);
  };

  return (
    <SpotlightCard className="h-full rounded-sm p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            className="hud-badge h-10 w-10 rounded-sm border-white/15"
            whileHover={{ rotate: -8, scale: 1.05 }}
            transition={spring.snappy}
          >
            <Moon className="h-4.5 w-4.5" />
          </motion.div>
          <div>
            <h2 className="font-display text-xl text-white">Sleep</h2>
            <p className="text-xs text-muted-foreground">Rest monitoring</p>
          </div>
        </div>

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
      </div>

      <div className="mb-6 flex gap-6">
        <Gauge
          value={Math.min(currentHours / TARGET, 1)}
          size={126}
          strokeWidth={8}
          color={colorFor(currentHours)}
          glow
        >
          <AnimatedNumber
            value={currentHours}
            decimals={currentHours % 1 === 0 ? 0 : 1}
            className="display-font hud-glow text-2xl text-foreground"
          />
          <span className="mono-font text-[10px] uppercase text-muted-foreground">/ {TARGET} hr</span>
        </Gauge>

        <div className="grid flex-1 grid-cols-2 gap-2">
          <div className="surface-well flex flex-col justify-center rounded-sm p-2.5">
            <span className="hud-label">7D avg</span>
            <span className="text-lg font-medium text-white">
              <AnimatedNumber value={weeklyAvg} decimals={1} />
              <span className="text-xs">h</span>
            </span>
          </div>
          <div className="surface-well flex flex-col justify-center rounded-sm p-2.5">
            <span className="hud-label">Best</span>
            <span className="text-lg font-medium text-white">
              <AnimatedNumber value={bestNight} decimals={1} />
              <span className="text-xs">h</span>
            </span>
          </div>
          <div className="surface-well col-span-2 flex flex-col justify-center rounded-sm p-2.5">
            <span className="hud-label">Weekly delta</span>
            <span className={`text-lg font-medium ${sleepDebt > 0 ? "text-white/50" : "text-white"}`}>
              {sleepDebt > 0 ? "-" : "+"}
              <AnimatedNumber value={Math.abs(sleepDebt)} decimals={1} />
              <span className="text-xs">h</span>
            </span>
          </div>
        </div>
      </div>

      {/* Weekly bars */}
      <div className="mb-6 flex h-28 items-stretch justify-between gap-1.5 border-b border-white/10 pb-2">
        {weeklyData.map((d, i) => {
          const heightPct = Math.min((d.hours / 12) * 100, 100);
          const isToday = d.date === todayStr;
          return (
            <div key={d.date} className="group/bar relative flex flex-1 flex-col items-center gap-2">
              <div className="relative flex w-full flex-1 items-end overflow-hidden bg-white/[0.03]">
                <motion.div
                  className="w-full origin-bottom"
                  style={{ backgroundColor: colorFor(d.hours) }}
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ duration: 0.75, ease: EASE_OUT, delay: i * 0.05 }}
                />
                {isToday && <div className="absolute inset-x-0 bottom-0 h-px bg-white" />}
              </div>
              <span
                className={`mono-font text-[8px] ${isToday ? "text-white" : "text-muted-foreground"}`}
              >
                {new Date(`${d.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "narrow" })}
              </span>

              <motion.div
                initial={false}
                className="pointer-events-none absolute -top-7 z-10 whitespace-nowrap border border-white/25 bg-black px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover/bar:opacity-100"
              >
                <span className="mono-font">{d.hours ? `${d.hours}h` : "no data"}</span>
              </motion.div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleLog} className="mt-auto flex gap-2">
        <input
          type="number"
          step="0.5"
          min="0"
          max="24"
          placeholder="Hours slept"
          value={hoursInput}
          onChange={(e) => setHoursInput(e.target.value)}
          className="hud-input flex-1 px-3 py-2 text-sm"
          aria-label="Hours slept"
        />
        <motion.button whileTap={tap} type="submit" className="hud-button px-5 py-2 text-sm">
          Log
        </motion.button>
      </form>
    </SpotlightCard>
  );
};
