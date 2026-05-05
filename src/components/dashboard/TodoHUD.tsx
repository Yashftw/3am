import { useState } from "react";
import { useDashboard, PriorityLevel } from "@/lib/dashboard-context";
import { ListChecks, Trash2 } from "lucide-react";

const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  P1: "#ffffff",
  P2: "#a0a0a0",
  P3: "#606060",
};

export const TodoHUD = () => {
  const { todos, addTodo, toggleTodo, deleteTodo } = useDashboard();
  const [newTodo, setNewTodo] = useState("");
  const [priority, setPriority] = useState<PriorityLevel>("P3");

  const todayStr = new Date().toISOString().split("T")[0];
  
  const todayTodos = todos.filter(t => t.createdAt.startsWith(todayStr) || (t.completedAt && t.completedAt.startsWith(todayStr)));
  const completedToday = todayTodos.filter(t => t.completed).length;
  const totalToday = todayTodos.length;
  
  const completionPct = totalToday === 0 ? 0 : Math.round((completedToday / totalToday) * 100);
  
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPct / 100) * circumference;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    addTodo(newTodo, priority);
    setNewTodo("");
  };

  const isOverdue = (createdAt: string, completed: boolean) => {
    if (completed) return false;
    return !createdAt.startsWith(todayStr);
  };

  const sortedTodos = [...todos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.priority !== b.priority) return a.priority.localeCompare(b.priority);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="glass-card rounded-none p-6 relative group flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="hud-badge w-10 h-10 border-white/30 text-white">
            <ListChecks className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl text-white text-shadow-glow">SYS_TSK_QUEUE</h2>
            <p className="text-[10px] text-muted-foreground uppercase mono-font tracking-widest">Operational Tasks</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-black/40 border border-white/10 px-3 py-1">
          <div className="flex flex-col items-end">
            <span className="mono-font text-[10px] text-muted-foreground uppercase">Day Cycle</span>
            <span className="mono-font text-xs font-bold text-white">{completedToday}/{totalToday}</span>
          </div>
          <div className="relative w-8 h-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 50 50">
              <circle cx="25" cy="25" r={radius} fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="4" />
              <circle 
                cx="25" cy="25" r={radius} 
                fill="none" 
                stroke="#ffffff" 
                strokeWidth="4" 
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="mono-font text-[8px] text-white">{completionPct}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto no-scrollbar space-y-2 mb-6 max-h-[300px] pr-2">
        {sortedTodos.length === 0 ? (
          <div className="h-full flex items-center justify-center border border-dashed border-white/20">
            <span className="mono-font text-xs text-white/50 uppercase">Task queue empty</span>
          </div>
        ) : (
          sortedTodos.map((t) => {
            const overdue = isOverdue(t.createdAt, t.completed);
            return (
              <div 
                key={t.id} 
                className={`flex items-stretch bg-black/50 border border-white/10 group/todo cursor-pointer transition-all hover:bg-black/80
                  ${overdue ? 'bg-white/5 border-white/30' : ''}`}
                onClick={() => toggleTodo(t.id)}
              >
                <div 
                  className="w-1.5 shrink-0 transition-colors" 
                  style={{ backgroundColor: t.completed ? '#333333' : PRIORITY_COLORS[t.priority] }} 
                />
                
                <div className="flex-1 p-3 flex justify-between items-center overflow-hidden">
                  <div className="flex flex-col w-full">
                    <span className={`text-sm font-medium truncate ${t.completed ? 'text-muted-foreground animate-strikethrough' : 'text-foreground'}`}>
                      {t.text}
                    </span>
                    <span className="text-[9px] mono-font mt-1 opacity-50 uppercase flex justify-between">
                      {overdue && !t.completed ? <span className="text-white font-bold">OVERDUE</span> : <span>LOGGED: {new Date(t.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                      {t.completed && t.completedAt && <span className="text-white">DONE: {new Date(t.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                    </span>
                  </div>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteTodo(t.id); }}
                    className="ml-3 p-2 opacity-0 group-hover/todo:opacity-100 text-white/50 hover:bg-white/10 hover:text-white transition-all shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-auto">
        <form onSubmit={handleAdd} className="flex gap-2">
          <select 
            value={priority} 
            onChange={e => setPriority(e.target.value as PriorityLevel)}
            className="hud-input w-20 px-2 py-2 outline-none mono-font text-[10px] uppercase font-bold text-center"
            style={{ color: PRIORITY_COLORS[priority] }}
          >
            <option value="P1">P1</option>
            <option value="P2">P2</option>
            <option value="P3">P3</option>
          </select>
          <input
            type="text"
            placeholder="ADD NEW TASK..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            className="hud-input flex-1 px-3 py-2 outline-none mono-font text-xs uppercase placeholder:text-white/30"
          />
          <button type="submit" className="hud-button px-4 py-2">ADD</button>
        </form>
      </div>
    </div>
  );
};
