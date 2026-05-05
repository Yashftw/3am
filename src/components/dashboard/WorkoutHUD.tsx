import { useState } from "react";
import { useDashboard, WorkoutCategory } from "@/lib/dashboard-context";
import { Activity, Flame } from "lucide-react";

const CATEGORY_COLORS: Record<WorkoutCategory, string> = {
  Cardio: "#fca5a5", // soft red
  Strength: "#93c5fd", // soft blue
  Flexibility: "#d8b4fe", // soft purple
  Recovery: "#86efac", // soft green
};

export const WorkoutHUD = () => {
  const { workoutData, addWorkout, streak } = useDashboard();
  const [durationInput, setDurationInput] = useState("");
  const [categoryInput, setCategoryInput] = useState<WorkoutCategory>("Cardio");
  const [isFlashing, setIsFlashing] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayWorkouts = workoutData.filter(w => w.date === todayStr);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const weeklyWorkouts = workoutData.filter(w => last7Days.includes(w.date));
  const weeklyTotalMins = weeklyWorkouts.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const weeklyAvgMins = weeklyWorkouts.length > 0 ? weeklyTotalMins / 7 : 0;

  const categoryTotals = weeklyWorkouts.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + curr.durationMinutes;
    return acc;
  }, {} as Record<WorkoutCategory, number>);

  const handleLog = (e: React.FormEvent) => {
    e.preventDefault();
    const min = parseInt(durationInput);
    if (isNaN(min) || min <= 0) return;
    
    setIsFlashing(true);
    addWorkout(todayStr, min, categoryInput);
    setDurationInput("");
    setTimeout(() => setIsFlashing(false), 500);
  };

  const totalRadial = Math.max(weeklyTotalMins, 1);
  let currentAngle = 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={`glass-card rounded-sm p-6 relative group flex flex-col h-full transition-opacity ${isFlashing ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="hud-badge w-10 h-10 border-white/20 text-white rounded-sm">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-display text-white">Physical</h2>
            <p className="text-xs text-muted-foreground">Activity Log</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 text-white">
            <Flame className="w-5 h-5 text-orange-400/80" />
            <span className="text-xl font-medium">{streak}</span>
          </div>
          <span className="text-xs text-muted-foreground">Active Streak</span>
        </div>
      </div>

      <div className="flex gap-6 mb-6">
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="12" />
            {(Object.keys(CATEGORY_COLORS) as WorkoutCategory[]).map((cat) => {
              const val = categoryTotals[cat] || 0;
              if (val === 0) return null;
              const slicePct = val / totalRadial;
              const strokeDasharray = `${slicePct * circumference} ${circumference}`;
              const strokeDashoffset = -currentAngle * circumference;
              currentAngle += slicePct;
              
              return (
                <circle 
                  key={cat}
                  cx="50" cy="50" r={radius} 
                  fill="none" 
                  stroke={CATEGORY_COLORS[cat]} 
                  strokeWidth="12"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-display text-foreground">{weeklyTotalMins}</span>
            <span className="text-[10px] text-muted-foreground">WK MINS</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-2">
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            {(Object.keys(CATEGORY_COLORS) as WorkoutCategory[]).map(cat => (
              <div key={cat} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                <span className="text-xs text-muted-foreground">{cat}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 flex gap-4">
            <div>
               <p className="text-xs text-muted-foreground">Daily Avg</p>
               <p className="text-lg font-medium text-white">{Math.round(weeklyAvgMins)}m</p>
            </div>
            <div>
               <p className="text-xs text-muted-foreground">Today</p>
               <p className="text-lg font-medium text-white">{todayWorkouts.reduce((a, b) => a + b.durationMinutes, 0)}m</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <form onSubmit={handleLog} className="flex gap-2">
          <select 
            value={categoryInput}
            onChange={e => setCategoryInput(e.target.value as WorkoutCategory)}
            className="hud-input w-28 px-2 py-2 text-xs"
          >
            {(Object.keys(CATEGORY_COLORS) as WorkoutCategory[]).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Minutes"
            value={durationInput}
            onChange={(e) => setDurationInput(e.target.value)}
            className="hud-input flex-1 px-3 py-2 text-sm"
          />
          <button type="submit" className="hud-button px-4 py-2">Log</button>
        </form>
      </div>
    </div>
  );
};
