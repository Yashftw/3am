import { forwardRef, useEffect, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Check, ChevronDown, ChevronRight, ListChecks, Plus, Target, Trash2, X } from "lucide-react";
import {
  useDashboard,
  todosForDate,
  type GoalCategory,
  type PriorityLevel,
  type TodoCategory,
  type TodoV2,
} from "@/lib/dashboard-context";
import { lastNDates, relativeTime, toLocalISODate, isOnLocalDate } from "@/lib/date-utils";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Gauge, SegmentedMeter } from "@/components/motion/Gauge";
import { EASE_OUT, fadeIn, spring, staggerContainer, tap, tapSoft } from "@/lib/motion";

/* ------------------------------------------------------------------ */
/* Palette (unchanged)                                                 */
/* ------------------------------------------------------------------ */

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

const getDueDateStatus = (deadline: string, completed: boolean) => {
  if (completed) return { text: "text-muted-foreground", border: "border-white/10" };
  const d = new Date(`${deadline}T23:59:59`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = (d.getTime() - today.getTime()) / (1000 * 3600 * 24);

  if (diff < 0) return { text: "text-[#FF4060]", border: "border-[#FF4060]/50" };
  if (diff <= 3) return { text: "text-[#FF9500]", border: "border-[#FF9500]/50" };
  return { text: "text-muted-foreground", border: "border-white/10" };
};

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

/** Checkbox with a spring pop and a draw-on tick. */
const TaskCheck = ({
  checked,
  onClick,
  size = "sm",
}: {
  checked: boolean;
  onClick: () => void;
  size?: "sm" | "md";
}) => {
  const dim = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.82 }}
      whileHover={{ scale: 1.12 }}
      transition={spring.snappy}
      aria-pressed={checked}
      aria-label={checked ? "Mark as not done" : "Mark as done"}
      className={`${dim} flex shrink-0 items-center justify-center rounded-full border transition-colors ${
        checked ? "border-transparent bg-white" : "border-white/45 bg-[#0a0a0a] hover:border-white"
      }`}
    >
      <AnimatePresence>
        {checked && (
          <motion.span
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={spring.snappy}
          >
            <Check className={size === "md" ? "h-2.5 w-2.5 text-black" : "h-2 w-2 text-black"} strokeWidth={3.5} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

const EmptySlate = forwardRef<HTMLDivElement, { label: string }>(({ label }, ref) => (
  <motion.div
    ref={ref}
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.45, ease: EASE_OUT }}
    className="flex h-20 items-center justify-center border border-dashed border-white/10"
  >
    <span className="text-xs text-muted-foreground">{label}</span>
  </motion.div>
));
EmptySlate.displayName = "EmptySlate";

/* ------------------------------------------------------------------ */
/* Collapsed panes                                                     */
/* ------------------------------------------------------------------ */

const PaneHeader = ({
  icon: Icon,
  title,
  onExpand,
}: {
  icon: typeof Target;
  title: string;
  onExpand: () => void;
}) => (
  <div className="mb-4 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-white" />
      <h3 className="font-display text-lg text-white">{title}</h3>
    </div>
    <motion.button
      type="button"
      onClick={onExpand}
      whileHover={{ x: 3 }}
      whileTap={tap}
      transition={spring.snappy}
      className="mono-font flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/45 transition-colors hover:text-white"
    >
      View all <span aria-hidden>→</span>
    </motion.button>
  </div>
);

const CollapsedObjectives = ({ onExpand }: { onExpand: () => void }) => {
  const { goals } = useDashboard();
  const activeGoals = goals.filter((g) => !g.completed).slice(0, 3);

  return (
    <div className="flex h-full flex-1 flex-col border-b border-white/5 pb-6 md:border-b-0 md:border-r md:pb-0 md:pr-6">
      <PaneHeader icon={Target} title="Objectives" onExpand={onExpand} />

      <motion.div variants={staggerContainer(0.07)} initial="hidden" animate="visible" className="space-y-3">
        <AnimatePresence mode="popLayout">
          {activeGoals.length === 0 ? (
            <EmptySlate label="No active goals" />
          ) : (
            activeGoals.map((g) => {
              const due = getDueDateStatus(g.deadline, false);
              const accent = GOAL_CAT_COLORS[g.category];
              return (
                <motion.div
                  key={g.id}
                  layout
                  variants={fadeIn}
                  exit={{ opacity: 0, x: -12, transition: { duration: 0.2 } }}
                  whileHover={{ x: 3 }}
                  transition={spring.gentle}
                  className="surface-well relative flex flex-col gap-2 overflow-hidden p-2.5"
                >
                  <span
                    className="absolute inset-y-0 left-0 w-[2px] opacity-70"
                    style={{ backgroundColor: accent }}
                  />
                  <div className="flex items-center justify-between pl-2">
                    <span className="max-w-[140px] truncate text-xs font-semibold text-white">{g.title}</span>
                    <div className={`rounded-full border px-2 py-0.5 ${due.border} bg-white/[0.04]`}>
                      <span className={`mono-font text-[9px] ${due.text}`}>{g.deadline.substring(5)}</span>
                    </div>
                  </div>
                  <div className="pl-2 pr-1">
                    <SegmentedMeter progress={g.progress} color={accent} />
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

const CollapsedTasks = ({ onExpand }: { onExpand: () => void }) => {
  const { todos, toggleTodo } = useDashboard();
  const todayTodos = todosForDate(todos, toLocalISODate());

  return (
    <div className="flex h-full flex-1 flex-col pt-6 md:pl-6 md:pt-0">
      <PaneHeader icon={ListChecks} title="Tasks" onExpand={onExpand} />

      <div className="no-scrollbar max-h-[170px] space-y-2 overflow-auto">
        <AnimatePresence mode="popLayout" initial={false}>
          {todayTodos.length === 0 ? (
            <EmptySlate label="No tasks today" />
          ) : (
            todayTodos.map((t) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -12, transition: { duration: 0.2 } }}
                transition={spring.gentle}
                className={`hover-scanline surface-well flex items-center p-2 ${
                  t.completed ? "glow-completed" : `glow-${t.priority.toLowerCase()}`
                }`}
              >
                <div className="mr-2">
                  <TaskCheck checked={t.completed} onClick={() => toggleTodo(t.id)} />
                </div>
                <span
                  className={`flex-1 truncate text-xs font-medium ${
                    t.completed ? "animate-strikethrough opacity-40" : "text-foreground"
                  }`}
                >
                  {t.text}
                </span>
                {!t.completed && (
                  <span
                    className="mono-font ml-2 border border-white/10 bg-white/5 px-1 text-[8px]"
                    style={{ color: PRIORITY_COLORS[t.priority] }}
                  >
                    {t.priority}
                  </span>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Expanded: Objectives                                                */
/* ------------------------------------------------------------------ */

const ExpandedObjectives = () => {
  const { goals, addGoal, setGoalProgress, toggleGoalSubTask, addGoalSubTask, deleteGoal } = useDashboard();
  const [newTitle, setNewTitle] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newCat, setNewCat] = useState<GoalCategory>("personal");
  const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});
  const [addingStepFor, setAddingStepFor] = useState<string | null>(null);
  const [stepText, setStepText] = useState("");

  const handleAddStep = (goalId: string) => {
    if (stepText.trim()) addGoalSubTask(goalId, stepText.trim());
    setAddingStepFor(null);
    setStepText("");
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDeadline) return;
    addGoal(newTitle.trim(), newDeadline, newCat);
    setNewTitle("");
    setNewDeadline("");
  };

  const totalProgress = goals.length
    ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length)
    : 0;

  const sortedGoals = [...goals].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-white">Active Objectives</h2>
          <p className="mono-font mt-1 text-xs text-muted-foreground">Track your long-term missions</p>
        </div>
        <Gauge value={totalProgress / 100} size={48} strokeWidth={3}>
          <AnimatedNumber value={totalProgress} suffix="%" className="mono-font text-[10px] font-bold text-white" />
        </Gauge>
      </div>

      <div className="no-scrollbar mb-4 flex gap-4 overflow-x-auto pb-4">
        <AnimatePresence mode="popLayout" initial={false}>
          {sortedGoals.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-[180px] w-full items-center justify-center border border-dashed border-white/10"
            >
              <span className="text-xs text-muted-foreground">No objectives yet — add one below.</span>
            </motion.div>
          )}

          {sortedGoals.map((g, i) => {
            const due = getDueDateStatus(g.deadline, g.completed);
            const isExpanded = expandedGoals[g.id];
            const nextSubTask = g.subTasks?.find((st) => !st.completed);
            const accent = GOAL_CAT_COLORS[g.category];
            const hasSteps = (g.subTasks?.length ?? 0) > 0;

            return (
              <motion.div
                key={g.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2 } }}
                transition={{ ...spring.layout, delay: Math.min(i * 0.04, 0.24) }}
                whileHover={{ y: -4 }}
                className={`group/goal surface-card relative flex w-[290px] shrink-0 flex-col p-4 ${
                  g.completed ? "animate-glow-flash" : ""
                }`}
              >
                <span className="absolute inset-y-0 left-0 w-[3px]" style={{ backgroundColor: accent }} />

                <div className="mb-3 flex items-center justify-between">
                  <span
                    className="mono-font text-[9px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: accent }}
                  >
                    {g.category}
                  </span>
                  <span className="mono-font text-[10px] text-muted-foreground">{g.deadline}</span>
                </div>

                <h3
                  className={`mb-1 text-lg font-bold leading-tight ${
                    g.completed ? "text-white/40 line-through" : "text-white"
                  }`}
                >
                  {g.title}
                </h3>
                {g.note ? (
                  <p className="mb-4 text-xs italic text-muted-foreground">{g.note}</p>
                ) : (
                  <div className="mb-4" />
                )}

                <SegmentedMeter
                  progress={g.progress}
                  color={accent}
                  onSegmentClick={hasSteps ? undefined : (threshold) => setGoalProgress(g.id, threshold)}
                  className="mb-4"
                />

                <div className="mt-auto flex items-end justify-between pt-2">
                  <div className="flex flex-col gap-1">
                    {nextSubTask && !isExpanded && !g.completed && (
                      <span className="mono-font text-[9px] text-[#FF9500]">
                        ◆ NEXT:{" "}
                        <span className="italic text-muted-foreground">{nextSubTask.text}</span>
                      </span>
                    )}
                    {!g.completed && (
                      <button
                        type="button"
                        className="flex w-fit items-center text-muted-foreground transition-colors hover:text-white"
                        onClick={() => setExpandedGoals((p) => ({ ...p, [g.id]: !p[g.id] }))}
                      >
                        <motion.span animate={{ rotate: isExpanded ? 90 : 0 }} transition={spring.snappy}>
                          <ChevronRight className="mr-1 h-3 w-3" />
                        </motion.span>
                        <span className="mono-font text-[9px] uppercase">{g.subTasks?.length || 0} steps</span>
                      </button>
                    )}
                  </div>

                  {g.completed ? (
                    <motion.div
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={spring.snappy}
                      className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-1"
                    >
                      <Check className="h-3 w-3 text-white" />
                      <span className="mono-font text-[9px] font-bold uppercase text-white">Done</span>
                    </motion.div>
                  ) : (
                    <div className={`rounded-full border px-2 py-1 ${due.border} bg-white/[0.04]`}>
                      <span className={`mono-font text-[9px] ${due.text}`}>Due {g.deadline.substring(5)}</span>
                    </div>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key="steps"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: EASE_OUT }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
                        {(g.subTasks ?? []).map((st) => (
                          <motion.div
                            key={st.id}
                            layout
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 border-l border-white/10 pl-2"
                          >
                            <TaskCheck checked={st.completed} onClick={() => toggleGoalSubTask(g.id, st.id)} />
                            <span
                              className={`text-xs ${st.completed ? "text-white/40 line-through" : "text-white/90"}`}
                            >
                              {st.text}
                            </span>
                          </motion.div>
                        ))}

                        <div className="pt-2">
                          {addingStepFor === g.id ? (
                            <div className="pl-2">
                              <input
                                type="text"
                                autoFocus
                                value={stepText}
                                onChange={(e) => setStepText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleAddStep(g.id);
                                  if (e.key === "Escape") { setAddingStepFor(null); setStepText(""); }
                                }}
                                onBlur={() => handleAddStep(g.id)}
                                className="w-full border-b border-white/20 bg-transparent pb-1 text-xs text-white outline-none transition-colors focus:border-white/60"
                                placeholder="Step description..."
                              />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => { setAddingStepFor(g.id); setStepText(""); }}
                              className="mono-font pl-2 text-[10px] text-muted-foreground transition-colors hover:text-white"
                            >
                              [+ add step]
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  type="button"
                  whileTap={tap}
                  onClick={(e) => { e.stopPropagation(); deleteGoal(g.id); }}
                  aria-label={`Delete ${g.title}`}
                  className="absolute right-3 top-3 p-1.5 text-white/35 opacity-0 transition-all hover:bg-white/10 hover:text-white group-hover/goal:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </motion.button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <form
        onSubmit={handleAdd}
        className="mt-auto flex items-center overflow-hidden border border-white/10 bg-white/[0.02] transition-all focus-within:border-white/30 focus-within:bg-white/[0.04]"
      >
        <input
          type="text"
          placeholder="Goal name ———"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        <span className="h-4 w-px bg-white/10" />
        <select
          value={newCat}
          onChange={(e) => setNewCat(e.target.value as GoalCategory)}
          className="mono-font w-24 bg-transparent px-2 py-2.5 text-center text-[10px] uppercase outline-none"
          aria-label="Goal category"
        >
          <option value="personal">Personal</option>
          <option value="health">Health</option>
          <option value="finance">Finance</option>
        </select>
        <span className="h-4 w-px bg-white/10" />
        <input
          type="date"
          value={newDeadline}
          onChange={(e) => setNewDeadline(e.target.value)}
          className="w-32 bg-transparent px-2 py-2.5 text-xs outline-none"
          aria-label="Deadline"
        />
        <motion.button
          whileTap={tap}
          type="submit"
          className="mono-font flex items-center gap-1 bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-black transition-colors hover:bg-gray-200"
        >
          <Plus className="h-3 w-3" /> Add
        </motion.button>
      </form>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Expanded: Tasks                                                     */
/* ------------------------------------------------------------------ */

const TaskRow = ({ todo, onToggle, onDelete }: { todo: TodoV2; onToggle: () => void; onDelete: () => void }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, x: -16, height: 0, marginBottom: 0, transition: { duration: 0.22 } }}
    transition={spring.gentle}
    className={`hover-scanline group/todo flex items-center border border-white/[0.07] bg-white/[0.02] px-3 py-2 transition-colors hover:border-white/20 ${
      todo.completed ? "glow-completed" : `glow-${todo.priority.toLowerCase()}`
    }`}
  >
    <div className="mr-3">
      <TaskCheck checked={todo.completed} onClick={onToggle} size="md" />
    </div>

    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-2">
        {todo.category && (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: CAT_COLORS[todo.category] }}
          />
        )}
        <span
          className={`truncate text-sm font-medium ${
            todo.completed ? "animate-strikethrough opacity-40" : "text-white"
          }`}
        >
          {todo.text}
        </span>
        {!todo.completed && (
          <span
            className="mono-font ml-auto shrink-0 border border-white/10 bg-[#0a0a0a] px-1 text-[9px] uppercase"
            style={{ color: PRIORITY_COLORS[todo.priority] }}
          >
            [{todo.priority}]
          </span>
        )}
        {!todo.completed && todo.estimatedTime && (
          <span className="mono-font shrink-0 text-[10px] text-muted-foreground">{todo.estimatedTime}</span>
        )}
      </div>
      <span className="mt-1 text-[9px] italic text-muted-foreground">
        Logged: {relativeTime(todo.createdAt)}
      </span>
    </div>

    <motion.button
      type="button"
      whileTap={tap}
      onClick={onDelete}
      aria-label={`Delete ${todo.text}`}
      className="ml-2 shrink-0 p-1.5 text-white/35 opacity-0 transition-all hover:bg-white/10 hover:text-white group-hover/todo:opacity-100"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </motion.button>
  </motion.div>
);

const ExpandedTasks = () => {
  const { todos, addTodo, toggleTodo, deleteTodo } = useDashboard();
  const [newTodo, setNewTodo] = useState("");
  const [priority, setPriority] = useState<PriorityLevel>("P3");
  const [category, setCategory] = useState<TodoCategory>("Personal");
  const [time, setTime] = useState("");
  const [allClear, setAllClear] = useState(false);

  const todayStr = toLocalISODate();
  const todayTodos = todosForDate(todos, todayStr);
  const completedToday = todayTodos.filter((t) => t.completed).length;
  const totalToday = todayTodos.length;
  const completionPct = totalToday === 0 ? 0 : Math.round((completedToday / totalToday) * 100);

  useEffect(() => {
    if (totalToday > 0 && completedToday === totalToday) {
      setAllClear(true);
      const timer = setTimeout(() => setAllClear(false), 2400);
      return () => clearTimeout(timer);
    }
  }, [completedToday, totalToday]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    addTodo(newTodo.trim(), priority, category, time.trim());
    setNewTodo("");
    setTime("");
  };

  const sortedTodos = [...todayTodos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.priority !== b.priority) return a.priority.localeCompare(b.priority);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const last7Days = lastNDates(7).map((iso, i) => ({
    iso,
    day: new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" }),
    count: todos.filter((t) => t.completed && isOnLocalDate(t.completedAt, iso)).length,
    isToday: i === 6,
  }));

  const maxTasks = Math.max(...last7Days.map((d) => d.count), 1);
  const weeklyTotal = last7Days.reduce((acc, d) => acc + d.count, 0);

  // Consecutive days with at least one completion, counting back from today.
  // Today being empty does not break a run that is still live.
  let streak = 0;
  for (let i = 6; i >= 0; i--) {
    if (last7Days[i].count > 0) streak++;
    else if (i !== 6) break;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl text-white">Operational Queue</h2>
          <p className="mono-font mt-1 text-xs text-muted-foreground">Check your tasks and schedule</p>
        </div>
        <Gauge value={completionPct / 100} size={48} strokeWidth={3}>
          <AnimatedNumber value={completionPct} suffix="%" className="mono-font text-[10px] font-bold text-white" />
        </Gauge>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
        {/* Today's queue */}
        <div className="surface-well flex flex-col p-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="eyebrow">Today</span>
            <span className="mono-font text-[10px] text-white/40">
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>

          <div className="relative mb-4 h-px w-full overflow-hidden bg-white/10">
            <motion.div
              className="absolute inset-y-0 left-0 bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${completionPct}%` }}
              transition={{ duration: 0.6, ease: EASE_OUT }}
            />
            <AnimatePresence>
              {allClear && (
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0 }}
                  transition={spring.snappy}
                  className="absolute inset-0 z-10 flex origin-left items-center justify-center bg-white"
                >
                  <span className="mono-font text-[8px] font-bold tracking-[0.2em] text-black">ALL CLEAR</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="no-scrollbar max-h-[220px] flex-1 space-y-2 overflow-auto pr-1">
            <AnimatePresence mode="popLayout" initial={false}>
              {sortedTodos.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-full items-center justify-center border border-dashed border-white/10 py-10"
                >
                  <span className="text-xs text-muted-foreground">Queue is empty</span>
                </motion.div>
              ) : (
                sortedTodos.map((t) => (
                  <TaskRow
                    key={t.id}
                    todo={t}
                    onToggle={() => toggleTodo(t.id)}
                    onDelete={() => deleteTodo(t.id)}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Weekly chart */}
        <div className="surface-well flex flex-col p-4">
          <div className="mb-6 flex gap-4">
            <div className="flex flex-1 flex-col border border-white/[0.07] bg-[#0a0a0a] px-3 py-2">
              <span className="eyebrow mb-1">This week</span>
              <span className="font-display text-xl text-white">
                <AnimatedNumber value={weeklyTotal} />{" "}
                <span className="font-sans text-sm text-white/40">tasks</span>
              </span>
            </div>
            <div className="flex flex-1 flex-col border border-white/[0.07] bg-[#0a0a0a] px-3 py-2">
              <span className="eyebrow mb-1">Streak</span>
              <span className="font-display text-xl text-white">
                <AnimatedNumber value={streak} />{" "}
                <span className="font-sans text-sm text-white/40">days</span>
              </span>
            </div>
          </div>

          <div className="mt-auto flex h-[140px] items-stretch gap-2">
            {last7Days.map((day, i) => (
              <div key={day.iso} className="group flex flex-1 flex-col items-center gap-2">
                <div className="relative flex w-full flex-1 flex-col justify-end rounded-sm transition-colors group-hover:bg-white/5">
                  <motion.div
                    className={day.isToday ? "w-full bg-white" : "w-full bg-white/20"}
                    initial={{ height: 0 }}
                    animate={{ height: day.count > 0 ? `${Math.max((day.count / maxTasks) * 100, 8)}%` : "0%" }}
                    transition={{ duration: 0.7, ease: EASE_OUT, delay: i * 0.05 }}
                    style={{ boxShadow: day.isToday && day.count > 0 ? "0 0 12px rgba(255,255,255,0.3)" : undefined }}
                  />
                  <span className="mono-font absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {day.count}
                  </span>
                </div>
                <span className={`mono-font text-[9px] ${day.isToday ? "text-white" : "text-muted-foreground"}`}>
                  {day.day}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <form
        onSubmit={handleAdd}
        className="mt-auto flex items-center overflow-hidden border border-white/10 bg-white/[0.02] transition-all focus-within:border-white/30 focus-within:bg-white/[0.04]"
      >
        <input
          type="text"
          placeholder="Task name ———"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        <span className="h-4 w-px bg-white/10" />
        <input
          type="text"
          placeholder="~30m"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="mono-font w-16 bg-transparent px-2 py-2.5 text-center text-xs outline-none placeholder:text-muted-foreground"
          aria-label="Estimated time"
        />
        <span className="h-4 w-px bg-white/10" />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as PriorityLevel)}
          className="mono-font w-14 bg-transparent px-2 py-2.5 text-center text-[10px] outline-none"
          style={{ color: PRIORITY_COLORS[priority] }}
          aria-label="Priority"
        >
          <option value="P1">P1</option>
          <option value="P2">P2</option>
          <option value="P3">P3</option>
        </select>
        <span className="h-4 w-px bg-white/10" />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as TodoCategory)}
          className="mono-font w-24 bg-transparent px-2 py-2.5 text-center text-[10px] outline-none"
          aria-label="Category"
        >
          <option value="Work">Work</option>
          <option value="Study">Study</option>
          <option value="Personal">Personal</option>
          <option value="Health">Health</option>
        </select>
        <motion.button
          whileTap={tap}
          type="submit"
          className="mono-font flex items-center gap-1 bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-black transition-colors hover:bg-gray-200"
        >
          <Plus className="h-3 w-3" /> Add
        </motion.button>
      </form>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Shell                                                               */
/* ------------------------------------------------------------------ */

export const MissionControlHUD = () => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"OBJECTIVES" | "TASKS">("OBJECTIVES");

  // Escape collapses the expanded view.
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  return (
    <LayoutGroup id="mission-control">
      <SpotlightCard
        layout
        transition={spring.layout}
        className={`rounded-sm p-6 ${expanded ? "min-h-[540px]" : "min-h-[350px]"}`}
        interactive={!expanded}
      >
        <AnimatePresence mode="wait" initial={false}>
          {expanded ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="flex h-full flex-col"
            >
              <div className="absolute right-6 top-6 z-10">
                <motion.button
                  type="button"
                  whileHover={{ rotate: 90 }}
                  whileTap={tap}
                  transition={spring.snappy}
                  onClick={() => setExpanded(false)}
                  aria-label="Collapse"
                  className="p-1.5 text-muted-foreground transition-colors hover:text-white"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>

              <div className="mb-8 flex gap-5 border-b border-white/10 pb-2">
                {(["OBJECTIVES", "TASKS"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`mono-font relative pb-2 text-sm font-bold uppercase tracking-[0.15em] transition-colors ${
                      activeTab === tab ? "text-white" : "text-white/35 hover:text-white/70"
                    }`}
                  >
                    {tab.toLowerCase()}
                    {activeTab === tab && (
                      <motion.span
                        layoutId="mc-tab-underline"
                        className="absolute inset-x-0 -bottom-[2px] h-px bg-white"
                        transition={spring.layout}
                      />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex-1">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: activeTab === "TASKS" ? 18 : -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: activeTab === "TASKS" ? -18 : 18 }}
                    transition={{ duration: 0.28, ease: EASE_OUT }}
                    className="h-full"
                  >
                    {activeTab === "OBJECTIVES" ? <ExpandedObjectives /> : <ExpandedTasks />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
              className="flex flex-col items-stretch md:flex-row"
            >
              <CollapsedObjectives
                onExpand={() => { setExpanded(true); setActiveTab("OBJECTIVES"); }}
              />
              <CollapsedTasks onExpand={() => { setExpanded(true); setActiveTab("TASKS"); }} />
            </motion.div>
          )}
        </AnimatePresence>
      </SpotlightCard>
    </LayoutGroup>
  );
};
