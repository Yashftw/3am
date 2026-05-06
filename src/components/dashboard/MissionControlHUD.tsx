import { useState, useEffect } from "react";
import { useDashboard, GoalCategory, PriorityLevel, TodoCategory } from "@/lib/dashboard-context";
import { Target, ListChecks, Plus, Trash2, ChevronRight, ChevronDown, Check } from "lucide-react";

// --- HELPERS ---

const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  P1: "#FF4060",
  P2: "#FF9500",
  P3: "#9B9B9B",
};

const CAT_COLORS: Record<TodoCategory, string> = {
  Work: "#FF4060",
  Study: "#FF9500",
  Personal: "#9B9B9B",
  Health: "#39D353",
};

const GOAL_CAT_COLORS: Record<GoalCategory, string> = {
  health: "#39D353",
  finance: "#FFB800",
  personal: "#9B9B9B",
};

const getRelativeTime = (timestamp: string) => {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return "older";
};

const getDueDateStatus = (deadline: string, completed: boolean) => {
  if (completed) return { text: "muted-foreground", class: "", border: "border-white/10" };
  const d = new Date(deadline);
  d.setHours(0,0,0,0);
  const today = new Date();
  today.setHours(0,0,0,0);
  const diff = (d.getTime() - today.getTime()) / (1000 * 3600 * 24);
  
  if (diff < 0) return { text: "text-[#FF4060]", class: "animate-blink-once", border: "border-[#FF4060]" };
  if (diff <= 3) return { text: "text-[#FF9500]", class: "", border: "border-[#FF9500]" };
  return { text: "text-muted-foreground", class: "", border: "border-white/10" };
};

// --- SUB-COMPONENTS ---

const CollapsedObjectives = ({ onExpand }: { onExpand: () => void }) => {
  const { goals } = useDashboard();
  const activeGoals = goals.filter(g => !g.completed).slice(0, 3);

  return (
    <div className="flex-1 flex flex-col h-full border-r border-white/5 pr-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-white" />
          <h3 className="font-display text-lg text-white">Objectives</h3>
        </div>
        <button onClick={onExpand} className="mono-font text-[10px] uppercase text-white/50 hover:text-white transition-colors">
          View All →
        </button>
      </div>

      <div className="space-y-3">
        {activeGoals.length === 0 ? (
          <div className="h-20 flex items-center justify-center border border-dashed border-white/10 rounded-sm">
            <span className="text-xs text-muted-foreground">No active goals</span>
          </div>
        ) : (
          activeGoals.map(g => {
            const dueStatus = getDueDateStatus(g.deadline, false);
            return (
              <div key={g.id} className="bg-[#111] border border-white/5 rounded-sm p-2 flex flex-col gap-2 relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-[2px] bg-[${GOAL_CAT_COLORS[g.category]}] opacity-50`} />
                <div className="flex justify-between items-center pl-2">
                  <span className="text-xs font-bold text-white truncate max-w-[120px]">{g.title}</span>
                  <div className={`px-2 py-0.5 rounded-full border ${dueStatus.border} bg-[#1a1a1a]`}>
                    <span className={`text-[9px] mono-font ${dueStatus.text}`}>{g.deadline.substring(5)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-px pl-2 pr-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div 
                      key={i}
                      className={`h-1.5 flex-1 ${g.progress >= (i+1)*10 ? 'bg-white' : 'bg-white/10'}`}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const CollapsedTasks = ({ onExpand }: { onExpand: () => void }) => {
  const { todos, toggleTodo } = useDashboard();
  const todayStr = new Date().toISOString().split("T")[0];
  const todayTodos = todos.filter(t => t.createdAt.startsWith(todayStr) || (t.completedAt && t.completedAt.startsWith(todayStr)));

  return (
    <div className="flex-1 flex flex-col h-full pl-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-white" />
          <h3 className="font-display text-lg text-white">Tasks</h3>
        </div>
        <button onClick={onExpand} className="mono-font text-[10px] uppercase text-white/50 hover:text-white transition-colors">
          View All →
        </button>
      </div>

      <div className="space-y-2 overflow-auto no-scrollbar max-h-[160px]">
        {todayTodos.length === 0 ? (
          <div className="h-20 flex items-center justify-center border border-dashed border-white/10 rounded-sm">
            <span className="text-xs text-muted-foreground">No tasks today</span>
          </div>
        ) : (
          todayTodos.map(t => {
            const glowClass = t.completed ? 'glow-completed' : `glow-${t.priority.toLowerCase()}`;
            return (
              <div key={t.id} className={`flex items-center bg-[#111] border border-white/5 rounded-sm p-2 hover-scanline ${glowClass}`}>
                <button 
                  className={`w-3.5 h-3.5 rounded-full border border-white/50 flex items-center justify-center mr-2 shrink-0 ${t.completed ? 'bg-white/20 border-transparent' : 'bg-[#0a0a0a]'}`}
                  onClick={() => toggleTodo(t.id)}
                >
                  {t.completed && <Check className="w-2 h-2 text-white" />}
                </button>
                <span className={`text-xs font-medium truncate flex-1 ${t.completed ? 'opacity-40 animate-strikethrough' : 'text-foreground'}`}>
                  {t.text}
                </span>
                {!t.completed && (
                  <span className="text-[8px] mono-font px-1 border border-white/10 bg-white/5 rounded-sm ml-2" style={{ color: PRIORITY_COLORS[t.priority] }}>
                    {t.priority}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const ExpandedObjectives = () => {
  const { goals, addGoal, setGoalProgress, toggleGoalSubTask, addGoalSubTask, deleteGoal } = useDashboard();
  const [newTitle, setNewTitle] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newCat, setNewCat] = useState<GoalCategory>("personal");
  const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});
  const [addingStepFor, setAddingStepFor] = useState<string | null>(null);
  const [stepText, setStepText] = useState("");

  const handleAddStep = (goalId: string) => {
    if (stepText.trim()) {
      addGoalSubTask(goalId, stepText);
    }
    setAddingStepFor(null);
    setStepText("");
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDeadline) return;
    addGoal(newTitle, newDeadline, newCat);
    setNewTitle("");
    setNewDeadline("");
  };

  const totalProgress = goals.length > 0 
    ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length) 
    : 0;

  const sortedGoals = [...goals].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  return (
    <div className="flex flex-col h-full animate-float-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display text-white">Active Objectives</h2>
          <p className="text-xs text-muted-foreground mono-font mt-1">Track your long-term missions</p>
        </div>
        <div className="relative w-12 h-12">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="22" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="3" />
            <circle 
              cx="25" cy="25" r="22" 
              fill="none" 
              stroke="#ffffff" 
              strokeWidth="3" 
              strokeLinecap="round"
              strokeDasharray={138.2}
              strokeDashoffset={138.2 - (totalProgress / 100) * 138.2}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="mono-font text-[10px] text-white font-bold">{totalProgress}%</span>
          </div>
        </div>
      </div>

      <div className="flex overflow-x-auto no-scrollbar gap-4 pb-4 mb-4">
        {sortedGoals.map(g => {
          const dueStatus = getDueDateStatus(g.deadline, g.completed);
          const isExpanded = expandedGoals[g.id];
          const nextSubTask = g.subTasks?.find(st => !st.completed);

          return (
            <div key={g.id} className={`shrink-0 w-[280px] bg-[#141414] border border-[#2a2a2a] rounded-[8px] p-4 flex flex-col relative group/goal ${g.completed ? 'animate-glow-flash' : ''}`}>
              <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[8px]" style={{ backgroundColor: GOAL_CAT_COLORS[g.category] }} />
              
              <div className="flex justify-between items-center mb-3">
                <span className="mono-font text-[9px] font-bold uppercase tracking-widest" style={{ color: GOAL_CAT_COLORS[g.category] }}>
                  {g.category}
                </span>
                <span className="mono-font text-[10px] text-muted-foreground">{g.deadline}</span>
              </div>
              
              <h3 className={`text-lg font-bold mb-1 leading-tight ${g.completed ? 'text-white/40 line-through' : 'text-white'}`}>{g.title}</h3>
              {g.note && <p className="text-xs text-muted-foreground italic mb-4">{g.note}</p>}
              {!g.note && <div className="mb-4" />}

              <div className="flex items-center gap-0.5 mb-4">
                {Array.from({ length: 10 }).map((_, i) => {
                  const threshold = (i + 1) * 10;
                  const isFilled = g.progress >= threshold;
                  const hasSteps = g.subTasks && g.subTasks.length > 0;
                  return (
                    <div 
                      key={i}
                      className={`h-[6px] flex-1 transition-all ${isFilled ? `bg-[${GOAL_CAT_COLORS[g.category]}] shadow-[0_0_8px_${GOAL_CAT_COLORS[g.category]}80]` : 'bg-white/10'} ${!hasSteps ? 'cursor-pointer hover:bg-white/20' : ''}`}
                      style={isFilled ? { backgroundColor: GOAL_CAT_COLORS[g.category] } : {}}
                      onClick={() => !hasSteps && setGoalProgress(g.id, threshold)}
                    />
                  );
                })}
              </div>

              <div className="flex justify-between items-end mt-auto pt-2">
                <div className="flex flex-col gap-1">
                  {nextSubTask && !isExpanded && !g.completed && (
                    <span className="mono-font text-[9px] text-[#FF9500]">◆ NEXT: <span className="text-muted-foreground italic">{nextSubTask.text}</span></span>
                  )}
                  {!g.completed && (
                    <button 
                      className="flex items-center text-muted-foreground hover:text-white transition-colors w-fit"
                      onClick={() => setExpandedGoals(prev => ({ ...prev, [g.id]: !prev[g.id] }))}
                    >
                      {isExpanded ? <ChevronDown className="w-3 h-3 mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
                      <span className="mono-font text-[9px] uppercase">{g.subTasks?.length || 0} steps</span>
                    </button>
                  )}
                </div>
                
                {g.completed ? (
                  <div className="flex items-center gap-1 border border-white/20 bg-white/10 px-2 py-1 rounded-full">
                    <Check className="w-3 h-3 text-white" />
                    <span className="text-[9px] font-bold text-white mono-font uppercase">DONE</span>
                  </div>
                ) : (
                  <div className={`px-2 py-1 rounded-full border ${dueStatus.border} bg-[#1a1a1a]`}>
                    <span className={`text-[9px] mono-font ${dueStatus.text}`}>Due {g.deadline.substring(5)}</span>
                  </div>
                )}
              </div>

              {isExpanded && g.subTasks && (
                <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                  {g.subTasks.map(st => (
                    <div key={st.id} className="flex items-center gap-2 pl-2 border-l border-white/10">
                      <button 
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${st.completed ? 'bg-white border-transparent' : 'bg-[#0a0a0a] border-white/50 hover:border-white'}`}
                        onClick={() => toggleGoalSubTask(g.id, st.id)}
                      >
                        {st.completed && <Check className="w-2.5 h-2.5 text-black" />}
                      </button>
                      <span className={`text-xs ${st.completed ? 'text-white/40 line-through' : 'text-white/90'}`}>{st.text}</span>
                    </div>
                  ))}
                  <div className="pt-2">
                    {addingStepFor === g.id ? (
                      <div className="flex items-center gap-2 pl-2">
                        <input
                          type="text"
                          autoFocus
                          value={stepText}
                          onChange={e => setStepText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") handleAddStep(g.id);
                            if (e.key === "Escape") setAddingStepFor(null);
                          }}
                          onBlur={() => handleAddStep(g.id)}
                          className="bg-transparent text-xs text-white outline-none border-b border-white/20 focus:border-white/50 pb-1 w-full"
                          placeholder="Step description..."
                        />
                      </div>
                    ) : (
                      <button 
                        onClick={() => { setAddingStepFor(g.id); setStepText(""); }}
                        className="text-[10px] mono-font text-muted-foreground hover:text-white pl-2 transition-colors"
                      >
                        [+ add step]
                      </button>
                    )}
                  </div>
                </div>
              )}

              <button 
                onClick={(e) => { e.stopPropagation(); deleteGoal(g.id); }}
                className="absolute top-3 right-3 p-1.5 opacity-0 group-hover/goal:opacity-100 text-white/40 hover:text-white hover:bg-white/10 transition-all rounded-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-auto">
        <form onSubmit={handleAdd} className="flex items-center bg-[#111] border border-[#222] rounded-sm overflow-hidden focus-within:border-white/30 focus-within:ring-1 focus-within:ring-white/10 transition-all">
          <input
            type="text"
            placeholder="Goal name ———"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <div className="w-px h-4 bg-[#222]" />
          <select 
            value={newCat} 
            onChange={e => setNewCat(e.target.value as GoalCategory)}
            className="w-24 bg-transparent px-2 py-2 outline-none mono-font text-[10px] uppercase text-center"
          >
            <option value="personal" className="text-black">Personal▾</option>
            <option value="health" className="text-black">Health▾</option>
            <option value="finance" className="text-black">Finance▾</option>
          </select>
          <div className="w-px h-4 bg-[#222]" />
          <input
            type="date"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
            className="w-32 bg-transparent px-2 py-2 text-xs outline-none"
          />
          <button type="submit" className="bg-white text-black font-bold px-4 py-2 text-[10px] mono-font uppercase tracking-wider hover:bg-gray-200 transition-colors">
            + ADD
          </button>
        </form>
      </div>
    </div>
  );
};

const ExpandedTasks = () => {
  const { todos, addTodo, toggleTodo, deleteTodo } = useDashboard();
  const [newTodo, setNewTodo] = useState("");
  const [priority, setPriority] = useState<PriorityLevel>("P3");
  const [category, setCategory] = useState<TodoCategory>("Personal");
  const [time, setTime] = useState("");
  const [allClear, setAllClear] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayTodos = todos.filter(t => t.createdAt.startsWith(todayStr) || (t.completedAt && t.completedAt.startsWith(todayStr)));
  const completedToday = todayTodos.filter(t => t.completed).length;
  const totalToday = todayTodos.length;
  const completionPct = totalToday === 0 ? 0 : Math.round((completedToday / totalToday) * 100);

  useEffect(() => {
    if (totalToday > 0 && completedToday === totalToday) {
      setAllClear(true);
      const timer = setTimeout(() => setAllClear(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [completedToday, totalToday]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    addTodo(newTodo, priority, category, time);
    setNewTodo("");
    setTime("");
  };

  const sortedTodos = [...todayTodos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.priority !== b.priority) return a.priority.localeCompare(b.priority);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Calculate 7-day chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const completedCount = todos.filter(t => t.completed && t.completedAt?.startsWith(dateStr)).length;
    return {
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      count: completedCount,
      isToday: i === 6
    };
  });
  const maxTasks = Math.max(...last7Days.map(d => d.count), 1);
  const weeklyTotal = last7Days.reduce((acc, d) => acc + d.count, 0);
  
  let streak = 0;
  for (let i = 6; i >= 0; i--) {
    if (last7Days[i].count > 0) streak++;
    else if (i !== 6) break; // Allow today to be 0 without breaking yesterday's streak yet
  }

  return (
    <div className="flex flex-col h-full animate-float-up">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display text-white">Operational Queue</h2>
          <p className="text-xs text-muted-foreground mono-font mt-1">Check your tasks and schedule</p>
        </div>
        <div className="relative w-12 h-12">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="22" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="3" />
            <circle 
              cx="25" cy="25" r="22" 
              fill="none" 
              stroke="#ffffff" 
              strokeWidth="3" 
              strokeLinecap="round"
              strokeDasharray={138.2}
              strokeDashoffset={138.2 - (completionPct / 100) * 138.2}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="mono-font text-[10px] text-white font-bold">{completionPct}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        {/* Left: Today's Tasks */}
        <div className="flex flex-col border border-[#222] rounded-sm p-4 bg-[#111]">
          <div className="flex justify-between items-center mb-4">
            <span className="mono-font text-xs text-muted-foreground uppercase tracking-widest">Today</span>
            <span className="mono-font text-[10px] text-white/40">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          </div>

          <div className="w-full h-px bg-[#222] mb-4 relative overflow-hidden">
            <div 
              className="absolute top-0 left-0 bottom-0 bg-white transition-all duration-500 ease-out"
              style={{ width: `${completionPct}%` }}
            />
            {allClear && (
              <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                <span className="mono-font text-[8px] font-bold text-black tracking-widest">ALL CLEAR</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto no-scrollbar space-y-2 max-h-[200px] pr-1">
            {sortedTodos.length === 0 ? (
               <div className="h-full flex items-center justify-center border border-dashed border-[#222] rounded-sm py-8">
                 <span className="text-xs text-muted-foreground">Queue is empty</span>
               </div>
            ) : (
              sortedTodos.map(t => {
                const glowClass = t.completed ? 'glow-completed' : `glow-${t.priority.toLowerCase()}`;
                return (
                  <div key={t.id} className={`flex items-center bg-[#141414] border border-[#222] rounded-sm group/todo transition-all hover:border-white/20 hover-scanline py-2 px-3 ${glowClass}`}>
                    <button 
                      className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 shrink-0 transition-colors ${t.completed ? 'bg-white border-transparent' : 'bg-[#0a0a0a] border-white/50 hover:border-white'}`}
                      onClick={() => toggleTodo(t.id)}
                    >
                      {t.completed && <Check className="w-2.5 h-2.5 text-black" />}
                    </button>
                    
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="flex items-center gap-2">
                        {t.category && (
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CAT_COLORS[t.category] }} />
                        )}
                        <span className={`text-sm font-medium truncate ${t.completed ? 'opacity-40 animate-strikethrough' : 'text-white'}`}>
                          {t.text}
                        </span>
                        {!t.completed && (
                          <span className="text-[9px] mono-font uppercase px-1 border border-white/10 bg-[#0a0a0a] rounded-sm ml-auto shrink-0" style={{ color: PRIORITY_COLORS[t.priority] }}>
                            [{t.priority}]
                          </span>
                        )}
                        {!t.completed && t.estimatedTime && (
                          <span className="text-[10px] mono-font text-muted-foreground shrink-0">
                            {t.estimatedTime}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-muted-foreground mt-1 italic">
                        Logged: {getRelativeTime(t.createdAt)}
                      </span>
                    </div>

                    <button 
                      onClick={() => deleteTodo(t.id)}
                      className="ml-2 p-1.5 opacity-0 group-hover/todo:opacity-100 text-white/40 hover:bg-white/10 hover:text-white transition-all shrink-0 rounded-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Weekly Chart */}
        <div className="flex flex-col border border-[#222] rounded-sm p-4 bg-[#111]">
           <div className="flex gap-4 mb-6">
              <div className="flex flex-col border border-[#222] bg-[#0a0a0a] rounded-sm px-3 py-2 flex-1">
                <span className="mono-font text-[9px] text-muted-foreground mb-1 uppercase tracking-wider">This Week</span>
                <span className="font-display text-xl text-white">{weeklyTotal} <span className="text-sm text-white/40 font-sans">tasks</span></span>
              </div>
              <div className="flex flex-col border border-[#222] bg-[#0a0a0a] rounded-sm px-3 py-2 flex-1">
                <span className="mono-font text-[9px] text-muted-foreground mb-1 uppercase tracking-wider">Streak</span>
                <span className="font-display text-xl text-white">{streak} <span className="text-sm text-white/40 font-sans">days</span></span>
              </div>
           </div>

           <div className="flex-1 flex items-end gap-2 h-[120px] mt-auto">
              {last7Days.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full relative h-full flex flex-col justify-end group-hover:bg-white/5 transition-colors rounded-sm">
                    {day.count > 0 && (
                      <div 
                        className={`w-full rounded-sm transition-all duration-1000 ${day.isToday ? 'bg-white' : 'bg-[#333]'}`}
                        style={{ height: `${Math.max((day.count / maxTasks) * 100, 10)}%` }}
                      />
                    )}
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 mono-font text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.count}
                    </span>
                  </div>
                  <span className={`mono-font text-[9px] ${day.isToday ? 'text-white' : 'text-muted-foreground'}`}>{day.day}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="mt-auto">
        <form onSubmit={handleAdd} className="flex items-center bg-[#111] border border-[#222] rounded-sm overflow-hidden focus-within:border-white/30 focus-within:ring-1 focus-within:ring-white/10 transition-all">
          <input
            type="text"
            placeholder="Task name ———"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <div className="w-px h-4 bg-[#222]" />
          <input
            type="text"
            placeholder="~30m"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-16 bg-transparent px-2 py-2 text-xs mono-font outline-none placeholder:text-muted-foreground text-center"
          />
          <div className="w-px h-4 bg-[#222]" />
          <select 
            value={priority} 
            onChange={e => setPriority(e.target.value as PriorityLevel)}
            className="w-14 bg-transparent px-2 py-2 text-[10px] mono-font outline-none text-center"
            style={{ color: PRIORITY_COLORS[priority] }}
          >
            <option value="P1" className="text-black">P1▾</option>
            <option value="P2" className="text-black">P2▾</option>
            <option value="P3" className="text-black">P3▾</option>
          </select>
          <div className="w-px h-4 bg-[#222]" />
          <select 
            value={category} 
            onChange={e => setCategory(e.target.value as TodoCategory)}
            className="w-20 bg-transparent px-2 py-2 text-[10px] mono-font outline-none text-center"
          >
            <option value="Work" className="text-black">● Work</option>
            <option value="Study" className="text-black">● Study</option>
            <option value="Personal" className="text-black">● PRS</option>
            <option value="Health" className="text-black">● HLT</option>
          </select>
          <button type="submit" className="bg-white text-black font-bold px-4 py-2 text-[10px] mono-font uppercase tracking-wider hover:bg-gray-200 transition-colors">
            + ADD
          </button>
        </form>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

export const MissionControlHUD = () => {
  const [viewState, setViewState] = useState<"collapsed" | "expanded">("collapsed");
  const [activeTab, setActiveTab] = useState<"OBJECTIVES" | "TASKS">("OBJECTIVES");

  if (viewState === "expanded") {
    return (
      <div className="glass-card rounded-sm p-6 relative flex flex-col h-full min-h-[500px]">
        <div className="absolute top-6 right-6">
           <button 
             onClick={() => setViewState("collapsed")}
             className="mono-font text-[10px] text-muted-foreground hover:text-white uppercase tracking-wider transition-colors flex items-center gap-1"
           >
             Close ✕
           </button>
        </div>
        
        <div className="flex gap-4 mb-8 border-b border-white/10 pb-2">
          <button 
            className={`mono-font text-sm font-bold tracking-widest uppercase transition-colors relative pb-2 ${activeTab === "OBJECTIVES" ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
            onClick={() => setActiveTab("OBJECTIVES")}
          >
            Objectives
            {activeTab === "OBJECTIVES" && <div className="absolute bottom-0 left-0 right-0 h-px bg-white" />}
          </button>
          <button 
            className={`mono-font text-sm font-bold tracking-widest uppercase transition-colors relative pb-2 ${activeTab === "TASKS" ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
            onClick={() => setActiveTab("TASKS")}
          >
            Tasks
            {activeTab === "TASKS" && <div className="absolute bottom-0 left-0 right-0 h-px bg-white" />}
          </button>
        </div>

        <div className="flex-1">
          {activeTab === "OBJECTIVES" ? <ExpandedObjectives /> : <ExpandedTasks />}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-sm p-6 flex items-stretch min-h-[350px]">
      <CollapsedObjectives onExpand={() => { setViewState("expanded"); setActiveTab("OBJECTIVES"); }} />
      <CollapsedTasks onExpand={() => { setViewState("expanded"); setActiveTab("TASKS"); }} />
    </div>
  );
};
