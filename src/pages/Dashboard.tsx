import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock, Activity, Target, Plus, Trash2, Dumbbell } from "lucide-react";
import GradualBlur from "@/components/GradualBlur";
import { SiteNav } from "@/components/SiteNav";
import heroBg from "@/assets/hero-bg.jpg";
import { useDashboard } from "@/lib/dashboard-context";
import { useUser } from "@/lib/user-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
  const { username } = useUser();
  const {
    sleepData,
    workoutData,
    goals,
    todos,
    addSleep,
    addWorkout,
    addGoal,
    toggleGoal,
    deleteGoal,
    addTodo,
    toggleTodo,
    deleteTodo,
  } = useDashboard();

  const [newTodo, setNewTodo] = useState("");
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDeadline, setNewGoalDeadline] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [workoutDuration, setWorkoutDuration] = useState("");
  const [workoutType, setWorkoutType] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const todaySleep = sleepData.find((s) => s.date === today);
  const todayWorkouts = workoutData.filter((w) => w.date === today);
  const totalWorkoutMinutes = todayWorkouts.reduce((acc, curr) => acc + curr.durationMinutes, 0);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    addTodo(newTodo);
    setNewTodo("");
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || !newGoalDeadline) return;
    addGoal(newGoalTitle, newGoalDeadline);
    setNewGoalTitle("");
    setNewGoalDeadline("");
  };

  const handleLogSleep = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(sleepHours);
    if (isNaN(hours) || hours <= 0) return;
    addSleep(today, hours);
    setSleepHours("");
  };

  const handleLogWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    const duration = parseInt(workoutDuration);
    if (isNaN(duration) || duration <= 0 || !workoutType.trim()) return;
    addWorkout(today, duration, workoutType);
    setWorkoutDuration("");
    setWorkoutType("");
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="relative min-h-[40vh] flex flex-col overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover" width={1920} height={1280} />
          <div className="absolute inset-0 bg-gradient-hero" />
        </div>
        <SiteNav variant="hero" />

        <div className="relative z-10 flex-1 flex items-center px-6 md:px-12 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-3 mono-font">
              ◆ Personal Dashboard
            </p>
            <h1 className="display-font text-5xl md:text-7xl text-foreground">
              Hello, {username}
            </h1>
          </motion.div>
        </div>
        <GradualBlur preset="bottom" strength={2.5} divCount={6} curve="ease-out" />
      </section>

      <main className="relative px-6 md:px-12 py-8 md:py-12 max-w-[1600px] mx-auto space-y-8 z-10">
        
        {/* Health Metrics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass-card rounded-sm p-8 shadow-elegant relative overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-sm bg-primary/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <h2 className="display-font text-2xl">Sleep Tracker</h2>
            </div>
            
            <div className="mb-6 bg-background/40 p-4 rounded-lg border border-border/50">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Today's Sleep</p>
              <p className="text-3xl font-bold mono-font">
                {todaySleep ? `${todaySleep.hours} hrs` : "Not logged"}
              </p>
            </div>

            <form onSubmit={handleLogSleep} className="flex gap-4">
              <Input
                type="number"
                step="0.5"
                placeholder="Hours..."
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                className="mono-font flex-1"
              />
              <Button type="submit">Log Sleep</Button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-card rounded-sm p-8 shadow-elegant relative overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-sm bg-accent/20 flex items-center justify-center">
                <Activity className="h-5 w-5 text-accent" />
              </div>
              <h2 className="display-font text-2xl">Workout Log</h2>
            </div>
            
            <div className="mb-6 bg-background/40 p-4 rounded-lg border border-border/50">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Today's Activity</p>
              <p className="text-3xl font-bold mono-font">
                {totalWorkoutMinutes > 0 ? `${totalWorkoutMinutes} mins` : "No activity"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {todayWorkouts.map((w, idx) => (
                  <span key={idx} className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-sm mono-font flex items-center gap-1">
                    <Dumbbell className="h-3 w-3" /> {w.type} ({w.durationMinutes}m)
                  </span>
                ))}
              </div>
            </div>

            <form onSubmit={handleLogWorkout} className="flex gap-4">
              <Input
                type="text"
                placeholder="Workout Type..."
                value={workoutType}
                onChange={(e) => setWorkoutType(e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Mins..."
                value={workoutDuration}
                onChange={(e) => setWorkoutDuration(e.target.value)}
                className="w-24 mono-font"
              />
              <Button type="submit">Log</Button>
            </form>
          </motion.div>
        </div>

        {/* Goals & Todos Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="glass-card rounded-sm p-8 shadow-elegant relative overflow-hidden flex flex-col"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-sm bg-success/20 flex items-center justify-center">
                <Target className="h-5 w-5 text-success" />
              </div>
              <h2 className="display-font text-2xl">Goals</h2>
            </div>

            <form onSubmit={handleAddGoal} className="flex gap-4 mb-6">
              <Input
                type="text"
                placeholder="New goal..."
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                className="flex-1"
              />
              <Input
                type="date"
                value={newGoalDeadline}
                onChange={(e) => setNewGoalDeadline(e.target.value)}
                className="w-36 mono-font"
              />
              <Button type="submit" size="icon"><Plus className="h-4 w-4" /></Button>
            </form>

            <div className="space-y-3 flex-1 overflow-auto max-h-[400px]">
              {goals.length === 0 ? (
                <p className="text-muted-foreground text-sm">No goals set yet.</p>
              ) : (
                goals.map((g) => (
                  <div key={g.id} className="flex items-center justify-between p-3 bg-background/50 border border-border/50 rounded-md">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleGoal(g.id)}>
                      {g.completed ? <CheckCircle2 className="text-success h-5 w-5" /> : <Circle className="text-muted-foreground h-5 w-5" />}
                      <div>
                        <p className={`text-sm ${g.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{g.title}</p>
                        <p className="text-xs text-muted-foreground/70 mono-font mt-1">Due: {g.deadline}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteGoal(g.id)}>
                      <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="glass-card rounded-sm p-8 shadow-elegant relative overflow-hidden flex flex-col"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-sm bg-foreground/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-foreground" />
              </div>
              <h2 className="display-font text-2xl">To-Do List</h2>
            </div>

            <form onSubmit={handleAddTodo} className="flex gap-4 mb-6">
              <Input
                type="text"
                placeholder="What needs to be done?"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">Add Task</Button>
            </form>

            <div className="space-y-2 flex-1 overflow-auto max-h-[400px]">
              {todos.length === 0 ? (
                <p className="text-muted-foreground text-sm">All caught up!</p>
              ) : (
                todos.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 hover:bg-background/50 border border-transparent hover:border-border/50 rounded-md transition-colors">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleTodo(t.id)}>
                      {t.completed ? <CheckCircle2 className="text-success h-5 w-5" /> : <Circle className="text-muted-foreground h-5 w-5" />}
                      <span className={`text-sm ${t.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.text}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteTodo(t.id)} className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-destructive/10 transition-opacity">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

      </main>

      <footer className="border-t border-border px-6 md:px-12 py-10 mt-16">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs mono-font text-muted-foreground">
          <span>© 2026 NORTH — All amounts stored locally.</span>
          <span>STAY FOCUSED · ACHIEVE GOALS</span>
        </div>
      </footer>

      <GradualBlur preset="page-footer" strength={2} divCount={6} animated="scroll" />
    </div>
  );
}
