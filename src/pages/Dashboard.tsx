import { motion } from "framer-motion";
import { GlobalStatsBar } from "@/components/dashboard/GlobalStatsBar";
import { SleepHUD } from "@/components/dashboard/SleepHUD";
import { WorkoutHUD } from "@/components/dashboard/WorkoutHUD";
import { MissionControlHUD } from "@/components/dashboard/MissionControlHUD";
import { useUser } from "@/lib/user-context";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { username } = useUser();
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    // Simulate periodic syncs
    const interval = setInterval(() => {
      setLastSync(new Date().toLocaleTimeString());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: custom * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    })
  };

  return (
    <div className="flex-1 flex flex-col relative z-10">
      {/* Hero Section */}
      <section className="relative flex flex-col justify-end pt-12 pb-6 px-4 md:px-12 border-b border-white/5 bg-transparent">
        <div className="relative z-10 w-full max-w-[1600px] mx-auto flex items-end justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground font-light tracking-tight">
              Hello, {username}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">Here's your overview</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="hidden md:flex flex-col items-end"
          >
            <h2 className="font-display text-xl text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { weekday: 'long' })} · {new Date().toLocaleDateString("en-US", { month: 'short', day: '2-digit' })}
            </h2>
          </motion.div>
        </div>
      </section>

      <GlobalStatsBar />

      <main className="flex-1 relative px-4 md:px-12 py-8 max-w-[1600px] w-full mx-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          
          <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants} className="lg:col-span-2 min-h-[350px]">
            <MissionControlHUD />
          </motion.div>
          
          <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants} className="min-h-[350px]">
            <SleepHUD />
          </motion.div>
          
          <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants} className="min-h-[350px]">
            <WorkoutHUD />
          </motion.div>

        </div>
      </main>

      <footer className="border-t border-white/5 px-4 md:px-12 py-6 bg-transparent mt-auto relative z-10">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-sans text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>© 2026 3am</span>
          </div>
          <span className="text-white/40">Last sync: {lastSync}</span>
        </div>
      </footer>
    </div>
  );
}
