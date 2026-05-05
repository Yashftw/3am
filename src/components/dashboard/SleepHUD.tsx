import { useState } from "react";
import { useDashboard } from "@/lib/dashboard-context";
import { Moon } from "lucide-react";

export const SleepHUD = () => {
  const { sleepData, addSleep } = useDashboard();
  const [hoursInput, setHoursInput] = useState("");
  const [isFlashing, setIsFlashing] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayRecord = sleepData.find((s) => s.date === todayStr);
  const currentHours = todayRecord ? todayRecord.hours : 0;
  
  const target = 8;
  const percentage = Math.min((currentHours / target) * 100, 100);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const weeklyData = last7Days.map(date => {
    const record = sleepData.find(s => s.date === date);
    return { date, hours: record ? record.hours : 0 };
  });

  const bestNight = Math.max(...weeklyData.map(d => d.hours), 0);
  const weeklyAvg = weeklyData.reduce((acc, curr) => acc + curr.hours, 0) / 7;
  const sleepDebt = (target * 7) - weeklyData.reduce((acc, curr) => acc + curr.hours, 0);

  const getColor = (h: number) => {
    if (h === 0) return "#1e293b"; // empty
    if (h < 6) return "#475569"; // slate-600
    if (h < 7) return "#94a3b8"; // slate-400
    if (h <= 9) return "#93c5fd"; // soft blue
    return "#cbd5e1"; // light slate
  };

  const handleLog = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseFloat(hoursInput);
    if (isNaN(h) || h <= 0) return;
    
    setIsFlashing(true);
    addSleep(todayStr, h);
    setHoursInput("");
    setTimeout(() => setIsFlashing(false), 500);
  };

  return (
    <div className={`glass-card rounded-sm p-6 relative group flex flex-col h-full transition-opacity ${isFlashing ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="hud-badge w-10 h-10 border-white/20 text-white rounded-sm">
          <Moon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-display text-white">Sleep</h2>
          <p className="text-xs text-muted-foreground">Rest Monitoring</p>
        </div>
      </div>

      <div className="flex gap-6 mb-6">
        {/* Arc Gauge */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="8" />
            <circle 
              cx="50" cy="50" r={radius} 
              fill="none" 
              stroke={getColor(currentHours)} 
              strokeWidth="8" 
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out animate-sweep"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="display-font text-2xl text-foreground">{currentHours}</span>
            <span className="mono-font text-[10px] text-muted-foreground uppercase">/ {target} HR</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex-1 grid grid-cols-2 gap-2">
          <div className="bg-[#121212] border border-white/5 rounded-sm p-2 flex flex-col justify-center">
            <span className="text-xs text-muted-foreground">7D Avg</span>
            <span className="text-lg font-medium text-white">{weeklyAvg.toFixed(1)}<span className="text-xs">h</span></span>
          </div>
          <div className="bg-[#121212] border border-white/5 rounded-sm p-2 flex flex-col justify-center">
            <span className="text-xs text-muted-foreground">Best</span>
            <span className="text-lg font-medium text-white">{bestNight.toFixed(1)}<span className="text-xs">h</span></span>
          </div>
          <div className="bg-[#121212] border border-white/5 rounded-sm p-2 col-span-2 flex flex-col justify-center relative overflow-hidden">
            <span className="text-xs text-muted-foreground">Weekly Delta</span>
            <span className={`text-lg font-medium ${sleepDebt > 0 ? 'text-white/50' : 'text-white'}`}>
              {sleepDebt > 0 ? '-' : '+'}{Math.abs(sleepDebt).toFixed(1)}<span className="text-xs">h</span>
            </span>
          </div>
        </div>
      </div>

      {/* Weekly Bar Chart */}
      <div className="h-24 mb-6 flex items-end justify-between gap-1 border-b border-white/10 pb-2">
        {weeklyData.map((d, i) => {
          const heightPct = Math.min((d.hours / 12) * 100, 100);
          return (
            <div key={i} className="flex flex-col items-center gap-2 flex-1 group/bar relative">
              <div className="w-full bg-black/50 rounded-t-sm relative h-full flex items-end overflow-hidden">
                <div 
                  className="w-full transition-all duration-1000"
                  style={{ height: `${heightPct}%`, backgroundColor: getColor(d.hours) }}
                />
              </div>
              <span className="mono-font text-[8px] text-muted-foreground">
                {new Date(d.date).toLocaleDateString('en-US', { weekday: 'narrow' })}
              </span>
              
              {/* Tooltip */}
              <div className="absolute -top-8 bg-black border border-white/50 text-[10px] mono-font px-2 py-1 opacity-0 group-hover/bar:opacity-100 pointer-events-none z-10 transition-opacity whitespace-nowrap text-white">
                {d.hours}h
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto">
        <form onSubmit={handleLog} className="flex gap-2">
          <input
            type="number"
            step="0.5"
            placeholder="Hours slept"
            value={hoursInput}
            onChange={(e) => setHoursInput(e.target.value)}
            className="hud-input flex-1 px-3 py-2 text-sm"
          />
          <button type="submit" className="hud-button px-4 py-2">Log</button>
        </form>
      </div>
    </div>
  );
};
