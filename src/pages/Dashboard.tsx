import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GlobalStatsBar } from "@/components/dashboard/GlobalStatsBar";
import { SleepHUD } from "@/components/dashboard/SleepHUD";
import { WorkoutHUD } from "@/components/dashboard/WorkoutHUD";
import { MissionControlHUD } from "@/components/dashboard/MissionControlHUD";
import { useUser } from "@/lib/user-context";
import { useSync } from "@/lib/sync-status";
import { relativeTime } from "@/lib/date-utils";
import { EASE_OUT, riseIn, staggerContainer } from "@/lib/motion";

/** "Good evening" etc., so the greeting means something at 3am. */
function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Late one";
}

export default function Dashboard() {
  const { username } = useUser();
  const { lastSyncedAt, state } = useSync();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative z-10 flex flex-1 flex-col">
      {/* Hero */}
      <section className="relative border-b border-white/5 bg-transparent px-4 pb-7 pt-12 md:px-12">
        <div className="relative z-10 mx-auto flex w-full max-w-[1600px] items-end justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: EASE_OUT }}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="hud-label mb-3"
            >
              {greeting(now)}
            </motion.p>

            <h1 className="hud-glow-soft font-display text-4xl font-light tracking-tight text-gradient md:text-5xl lg:text-6xl">
              Hello, {username}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: EASE_OUT }}
              className="mt-2 text-sm text-muted-foreground"
            >
              Here's your overview
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: EASE_OUT }}
            className="hidden flex-col items-end md:flex"
          >
            <h2 className="font-display text-xl text-muted-foreground">
              {now.toLocaleDateString("en-US", { weekday: "long" })} ·{" "}
              {now.toLocaleDateString("en-US", { month: "short", day: "2-digit" })}
            </h2>
            <span className="mono-font mt-1 text-[10px] uppercase tracking-[0.18em] text-white/25">
              {now.getFullYear()}
            </span>
          </motion.div>
        </div>
      </section>

      <GlobalStatsBar />

      <motion.main
        variants={staggerContainer(0.09, 0.1)}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto w-full max-w-[1600px] flex-1 px-4 py-8 md:px-12"
      >
        <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          <motion.div variants={riseIn} className="lg:col-span-2">
            <MissionControlHUD />
          </motion.div>

          <motion.div variants={riseIn} className="min-h-[350px]">
            <SleepHUD />
          </motion.div>

          <motion.div variants={riseIn} className="min-h-[350px]">
            <WorkoutHUD />
          </motion.div>
        </div>
      </motion.main>

      <footer className="relative z-10 mt-auto border-t border-white/5 bg-transparent px-4 py-6 md:px-12">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-3 text-xs text-muted-foreground md:flex-row">
          <span>© {now.getFullYear()} 3am</span>
          <span className="mono-font text-white/35">
            {state === "offline"
              ? "Offline — saved on this device"
              : lastSyncedAt
                ? `Last sync: ${relativeTime(new Date(lastSyncedAt).toISOString())}`
                : "Ready"}
          </span>
        </div>
      </footer>
    </div>
  );
}
