import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { collection, doc, setDoc, getDocs, query, where, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useUser } from "./user-context";

export interface SleepRecordV2 {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO string
  hours: number;
}

export type WorkoutCategory = "Cardio" | "Strength" | "Flexibility" | "Recovery";

export interface WorkoutRecordV2 {
  id: string;
  date: string;
  timestamp: string;
  durationMinutes: number;
  type: WorkoutCategory;
}

export type GoalCategory = "health" | "finance" | "personal";

export interface GoalSubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface GoalV2 {
  id: string;
  title: string;
  deadline: string;
  category: GoalCategory;
  note?: string;
  subTasks?: GoalSubTask[];
  progress: number; // 0 to 100
  completed: boolean;
  createdAt: string;
  user_id?: string;
}

export type PriorityLevel = "P1" | "P2" | "P3";

export type TodoCategory = "Work" | "Study" | "Personal" | "Health";

export interface TodoV2 {
  id: string;
  text: string;
  priority: PriorityLevel;
  category?: TodoCategory;
  estimatedTime?: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  user_id?: string;
}

interface DashboardContextValue {
  sleepData: SleepRecordV2[];
  workoutData: WorkoutRecordV2[];
  goals: GoalV2[];
  todos: TodoV2[];
  addSleep: (date: string, hours: number) => void;
  addWorkout: (date: string, durationMinutes: number, type: WorkoutCategory) => void;
  addGoal: (title: string, deadline: string, category: GoalCategory, note?: string) => void;
  incrementGoal: (id: string, amount: number) => void;
  setGoalProgress: (id: string, progress: number) => void;
  toggleGoalSubTask: (goalId: string, subTaskId: string) => void;
  deleteGoal: (id: string) => void;
  addTodo: (text: string, priority: PriorityLevel, category?: TodoCategory, estimatedTime?: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  streak: number;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();

  const [sleepData, setSleepData] = useState<SleepRecordV2[]>(() => {
    try {
      const saved = localStorage.getItem("north_sleep_v2");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [workoutData, setWorkoutData] = useState<WorkoutRecordV2[]>(() => {
    try {
      const saved = localStorage.getItem("north_workout_v2");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [goals, setGoals] = useState<GoalV2[]>([]);
  const [todos, setTodos] = useState<TodoV2[]>([]);

  // Fetch from Firestore on user change
  useEffect(() => {
    if (!user) {
      setGoals([]);
      setTodos([]);
      return;
    }

    const fetchDashboard = async () => {
      try {
        const goalsQuery = query(collection(db, "goals"), where("user_id", "==", user.uid));
        const goalsSnap = await getDocs(goalsQuery);
        setGoals(goalsSnap.docs.map(doc => doc.data() as GoalV2));

        const todosQuery = query(collection(db, "todos"), where("user_id", "==", user.uid));
        const todosSnap = await getDocs(todosQuery);
        setTodos(todosSnap.docs.map(doc => doc.data() as TodoV2));
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };
    fetchDashboard();
  }, [user]);

  useEffect(() => { localStorage.setItem("north_sleep_v2", JSON.stringify(sleepData)); }, [sleepData]);
  useEffect(() => { localStorage.setItem("north_workout_v2", JSON.stringify(workoutData)); }, [workoutData]);

  const addSleep = (date: string, hours: number) => {
    setSleepData((prev) => {
      const existingIdx = prev.findIndex((s) => s.date === date);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], hours, timestamp: new Date().toISOString() };
        return next;
      }
      return [...prev, { id: crypto.randomUUID(), date, timestamp: new Date().toISOString(), hours }];
    });
  };

  const addWorkout = (date: string, durationMinutes: number, type: WorkoutCategory) => {
    setWorkoutData((prev) => [
      ...prev,
      { id: crypto.randomUUID(), date, timestamp: new Date().toISOString(), durationMinutes, type },
    ]);
  };

  const addGoal = async (title: string, deadline: string, category: GoalCategory, note?: string) => {
    const newGoal: GoalV2 = {
      id: crypto.randomUUID(),
      title,
      deadline,
      category,
      note,
      subTasks: [],
      progress: 0,
      completed: false,
      createdAt: new Date().toISOString(),
      user_id: user?.uid
    };
    setGoals((prev) => [...prev, newGoal]);
    if (user) await setDoc(doc(db, "goals", newGoal.id), newGoal);
  };

  const updateGoalDoc = async (g: GoalV2) => {
    if (user) await setDoc(doc(db, "goals", g.id), g);
  };

  const incrementGoal = (id: string, amount: number) => {
    setGoals((prev) => {
      const next = [...prev];
      const idx = next.findIndex(g => g.id === id);
      if (idx >= 0) {
        const newProgress = Math.min(Math.max(next[idx].progress + amount, 0), 100);
        next[idx] = { ...next[idx], progress: newProgress, completed: newProgress === 100 };
        updateGoalDoc(next[idx]);
      }
      return next;
    });
  };

  const setGoalProgress = (id: string, progress: number) => {
    setGoals((prev) => {
      const next = [...prev];
      const idx = next.findIndex(g => g.id === id);
      if (idx >= 0) {
        const newProgress = Math.min(Math.max(progress, 0), 100);
        next[idx] = { ...next[idx], progress: newProgress, completed: newProgress === 100 };
        updateGoalDoc(next[idx]);
      }
      return next;
    });
  };

  const toggleGoalSubTask = (goalId: string, subTaskId: string) => {
    setGoals((prev) => {
      const next = [...prev];
      const idx = next.findIndex(g => g.id === goalId);
      if (idx >= 0) {
        const updatedSubTasks = next[idx].subTasks?.map(st => 
          st.id === subTaskId ? { ...st, completed: !st.completed } : st
        ) || [];
        next[idx] = { ...next[idx], subTasks: updatedSubTasks };
        updateGoalDoc(next[idx]);
      }
      return next;
    });
  };

  const deleteGoal = async (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    if (user) await deleteDoc(doc(db, "goals", id));
  };

  const addTodo = async (text: string, priority: PriorityLevel, category?: TodoCategory, estimatedTime?: string) => {
    const newTodo: TodoV2 = {
      id: crypto.randomUUID(),
      text,
      priority,
      category,
      estimatedTime,
      completed: false,
      createdAt: new Date().toISOString(),
      user_id: user?.uid
    };
    setTodos((prev) => [...prev, newTodo]);
    if (user) await setDoc(doc(db, "todos", newTodo.id), newTodo);
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) => {
      const next = [...prev];
      const idx = next.findIndex(t => t.id === id);
      if (idx >= 0) {
        const isCompleted = !next[idx].completed;
        next[idx] = {
          ...next[idx],
          completed: isCompleted,
          completedAt: isCompleted ? new Date().toISOString() : undefined,
        };
        if (user) setDoc(doc(db, "todos", next[idx].id), next[idx]);
      }
      return next;
    });
  };

  const deleteTodo = async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    if (user) await deleteDoc(doc(db, "todos", id));
  };

  const streak = (() => {
    if (workoutData.length === 0) return 0;
    let robustStreak = 0;
    const sortedDates = [...new Set(workoutData.map(w => w.date))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    if (sortedDates.length === 0) return 0;
    
    const todayStr = new Date().toISOString().split("T")[0];
    let checkDate = new Date();
    
    if (sortedDates[0] !== todayStr) {
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayStr = checkDate.toISOString().split("T")[0];
      if (sortedDates[0] !== yesterdayStr) return 0;
    }
    
    for (const dStr of sortedDates) {
      const expectedStr = checkDate.toISOString().split("T")[0];
      if (dStr === expectedStr) {
        robustStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else break;
    }
    return robustStreak;
  })();

  return (
    <DashboardContext.Provider
      value={{
        sleepData, workoutData, goals, todos,
        addSleep, addWorkout, addGoal, incrementGoal,
        setGoalProgress, toggleGoalSubTask, deleteGoal,
        addTodo, toggleTodo, deleteTodo, streak,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
};
