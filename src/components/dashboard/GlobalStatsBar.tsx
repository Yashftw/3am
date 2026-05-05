import { useDashboard } from "@/lib/dashboard-context";

export const GlobalStatsBar = () => {
  const { streak, sleepData, workoutData, todos, goals } = useDashboard();

  const avgSleep = (() => {
    if (sleepData.length === 0) return "--";
    const last7 = sleepData.slice(-7);
    const sum = last7.reduce((acc, curr) => acc + curr.hours, 0);
    return (sum / last7.length).toFixed(1) + "h";
  })();

  const workoutsThisWeek = (() => {
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return workoutData.filter(w => new Date(w.date) >= oneWeekAgo).length;
  })();

  const tasksDoneToday = (() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayTodos = todos.filter(t => t.createdAt.startsWith(todayStr) || (t.completedAt && t.completedAt.startsWith(todayStr)));
    const done = todayTodos.filter(t => t.completed).length;
    return `${done}/${todayTodos.length}`;
  })();

  const activeGoals = goals.filter(g => !g.completed).length;

  return (
    <div className="w-full border-y border-white/5 bg-[#0a0a0a] py-3 overflow-x-auto no-scrollbar">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 flex items-center gap-8 md:gap-16 min-w-max text-sm text-muted-foreground">
        
        <div className="flex items-center gap-2">
          <span>Streak: <span className="text-white font-bold">{streak} days</span></span>
        </div>

        <div className="w-px h-4 bg-white/10" />

        <div className="flex items-center gap-2">
          <span>Avg Sleep: <span className="text-white font-bold">{avgSleep}</span></span>
        </div>

        <div className="w-px h-4 bg-white/10" />

        <div className="flex items-center gap-2">
          <span>Weekly Workouts: <span className="text-white font-bold">{workoutsThisWeek}</span></span>
        </div>

        <div className="w-px h-4 bg-white/10" />

        <div className="flex items-center gap-2">
          <span>Tasks Today: <span className="text-white font-bold">{tasksDoneToday}</span></span>
        </div>

        <div className="w-px h-4 bg-white/10" />

        <div className="flex items-center gap-2">
          <span>Active Goals: <span className="text-white font-bold">{activeGoals}</span></span>
        </div>

      </div>
    </div>
  );
};
