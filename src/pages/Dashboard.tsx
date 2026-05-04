import { motion } from "framer-motion";
import { SiteNav } from "@/components/SiteNav";
import { GlobalStatsBar } from "@/components/dashboard/GlobalStatsBar";
import { SleepHUD } from "@/components/dashboard/SleepHUD";
import { WorkoutHUD } from "@/components/dashboard/WorkoutHUD";
import { GoalsHUD } from "@/components/dashboard/GoalsHUD";
import { TodoHUD } from "@/components/dashboard/TodoHUD";
import { useUser } from "@/lib/user-context";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { username } = useUser();
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    // Simulate periodic syncs for the sci-fi feel
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
    <div className="min-h-screen flex flex-col relative">
      <SiteNav />

      {/* Hero Section */}
      <section className="relative flex flex-col justify-end pt-20 pb-8 px-6 md:px-12 border-b border-primary/20">
        <div 
          className="absolute inset-0 bg-[url('/mountain-bg.jpg')] bg-cover bg-center bg-fixed opacity-50 mix-blend-luminosity grayscale" 
          style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)' }}
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        
        <div className="relative z-10 w-full max-w-[1600px] mx-auto flex items-end justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-2 opacity-80">
              <span className="w-2 h-2 bg-primary animate-pulse" />
              <p className="mono-font text-[10px] uppercase tracking-[0.3em] text-primary">
                Operator: {username} // Access Granted
              </p>
            </div>
            <h1 className="display-font text-5xl md:text-7xl lg:text-8xl text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 filter drop-shadow-[0_0_15px_rgba(0,229,255,0.3)]">
              COMMAND CENTER
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="hidden md:flex flex-col items-end"
          >
            <p className="mono-font text-[10px] text-primary uppercase tracking-widest opacity-70">Current Cycle</p>
            <h2 className="display-font text-2xl lg:text-4xl text-foreground">
              {new Date().toLocaleDateString("en-US", { weekday: 'long' }).toUpperCase()} · {new Date().toLocaleDateString("en-US", { month: 'short', day: '2-digit' }).toUpperCase()}
            </h2>
          </motion.div>
        </div>
      </section>

      <GlobalStatsBar />

      <main className="flex-1 relative px-6 md:px-12 py-8 max-w-[1600px] w-full mx-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          
          <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants} className="h-[450px]">
            <SleepHUD />
          </motion.div>
          
          <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants} className="h-[450px]">
            <WorkoutHUD />
          </motion.div>
          
          <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants} className="h-[450px]">
            <GoalsHUD />
          </motion.div>
          
          <motion.div custom={4} initial="hidden" animate="visible" variants={cardVariants} className="h-[450px]">
            <TodoHUD />
          </motion.div>

        </div>
      </main>

      <footer className="border-t border-primary/20 px-6 md:px-12 py-6 bg-black/50 backdrop-blur-sm mt-auto relative z-10">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] mono-font text-primary/60 uppercase tracking-widest">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              SYSTEM ONLINE
            </span>
            <span>|</span>
            <span>DATA ENCRYPTED: LOCAL_STORAGE_V2</span>
          </div>
          <span className="text-primary/40">LAST SYNC: [{lastSync}]</span>
        </div>
      </footer>
    </div>
  );
}
