import { useState } from "react";
import { useDashboard, GoalCategory } from "@/lib/dashboard-context";
import { Target, Plus, Trash2 } from "lucide-react";

const CAT_COLORS: Record<GoalCategory, string> = {
  health: "#ffffff",
  finance: "#a0a0a0",
  personal: "#606060",
};

export const GoalsHUD = () => {
  const { goals, addGoal, incrementGoal, deleteGoal } = useDashboard();
  const [newTitle, setNewTitle] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newCat, setNewCat] = useState<GoalCategory>("personal");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDeadline) return;
    addGoal(newTitle, newDeadline, newCat);
    setNewTitle("");
    setNewDeadline("");
  };

  const today = new Date();
  today.setHours(0,0,0,0);

  const sortedGoals = [...goals].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  const getStatusClasses = (deadline: string, completed: boolean) => {
    if (completed) return "border-white/10 text-muted-foreground opacity-50";
    const d = new Date(deadline);
    d.setHours(0,0,0,0);
    const diff = (d.getTime() - today.getTime()) / (1000 * 3600 * 24);
    if (diff < 0) return "border-white text-white shadow-[0_0_10px_rgba(255,255,255,0.4)]";
    if (diff <= 3) return "border-white/50 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]";
    return "border-white/10 text-foreground";
  };

  return (
    <div className="glass-card rounded-sm p-6 relative group flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="hud-badge w-10 h-10 border-white/20 text-white rounded-sm">
          <Target className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-display text-white">Objectives</h2>
          <p className="text-xs text-muted-foreground">Active Goals</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto no-scrollbar space-y-3 mb-6 max-h-[300px] pr-2">
        {sortedGoals.length === 0 ? (
          <div className="h-full flex items-center justify-center border border-dashed border-white/10 rounded-sm">
            <span className="text-sm text-muted-foreground">No active objectives</span>
          </div>
        ) : (
          sortedGoals.map((g) => (
            <div key={g.id} className={`p-3 border bg-[#121212] rounded-sm relative overflow-hidden group/goal transition-all ${getStatusClasses(g.deadline, g.completed)}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CAT_COLORS[g.category] }} />
                    <span className="text-[10px] uppercase mono-font tracking-wider opacity-70">{g.category}</span>
                  </div>
                  <h3 className={`font-bold tracking-wide text-sm ${g.completed ? 'line-through' : ''}`}>{g.title}</h3>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground">Due</span>
                  <span className="text-sm font-medium">{g.deadline}</span>
                </div>
              </div>
              
              <div 
                className="h-2 w-full bg-black border border-white/10 rounded-full cursor-pointer relative overflow-hidden mt-3 group/bar"
                onClick={() => incrementGoal(g.id, 25)}
              >
                <div 
                  className="h-full transition-all duration-500 ease-out"
                  style={{ width: `${g.progress}%`, backgroundColor: g.completed ? '#ffffff' : '#808080' }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-[10px] mix-blend-difference text-white">{g.progress}%</span>
                </div>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/bar:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="mono-font text-[8px] text-white tracking-widest">+25%</span>
                </div>
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); deleteGoal(g.id); }}
                className="absolute top-2 right-2 p-1 opacity-0 group-hover/goal:opacity-100 text-white/50 hover:text-white hover:bg-white/10 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-auto">
        <form onSubmit={handleAdd} className="flex gap-2">
          <select 
            value={newCat} 
            onChange={e => setNewCat(e.target.value as GoalCategory)}
            className="hud-input w-24 px-2 py-2 outline-none mono-font text-[10px] uppercase"
          >
            <option value="personal">PRS</option>
            <option value="health">HLT</option>
            <option value="finance">FIN</option>
          </select>
          <input
            type="text"
            placeholder="New goal..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="hud-input flex-1 px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
            className="hud-input w-32 px-2 py-2 text-sm"
          />
          <button type="submit" className="hud-button px-3 py-2"><Plus className="w-4 h-4" /></button>
        </form>
      </div>
    </div>
  );
};
