import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface SleepRecord {
  date: string;
  hours: number;
}

export interface WorkoutRecord {
  date: string;
  durationMinutes: number;
  type: string;
}

export interface Goal {
  id: string;
  title: string;
  deadline: string;
  completed: boolean;
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface DashboardContextValue {
  sleepData: SleepRecord[];
  workoutData: WorkoutRecord[];
  goals: Goal[];
  todos: Todo[];
  addSleep: (date: string, hours: number) => void;
  addWorkout: (date: string, durationMinutes: number, type: string) => void;
  addGoal: (title: string, deadline: string) => void;
  toggleGoal: (id: string) => void;
  deleteGoal: (id: string) => void;
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [sleepData, setSleepData] = useState<SleepRecord[]>(() => {
    try {
      const saved = localStorage.getItem("north_sleep_v1");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [workoutData, setWorkoutData] = useState<WorkoutRecord[]>(() => {
    try {
      const saved = localStorage.getItem("north_workout_v1");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const saved = localStorage.getItem("north_goals_v1");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [todos, setTodos] = useState<Todo[]>(() => {
    try {
      const saved = localStorage.getItem("north_todos_v1");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("north_sleep_v1", JSON.stringify(sleepData));
  }, [sleepData]);

  useEffect(() => {
    localStorage.setItem("north_workout_v1", JSON.stringify(workoutData));
  }, [workoutData]);

  useEffect(() => {
    localStorage.setItem("north_goals_v1", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem("north_todos_v1", JSON.stringify(todos));
  }, [todos]);

  const addSleep = (date: string, hours: number) => {
    setSleepData((prev) => {
      const existing = prev.findIndex((s) => s.date === date);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = { date, hours };
        return next;
      }
      return [...prev, { date, hours }];
    });
  };

  const addWorkout = (date: string, durationMinutes: number, type: string) => {
    setWorkoutData((prev) => [...prev, { date, durationMinutes, type }]);
  };

  const addGoal = (title: string, deadline: string) => {
    setGoals((prev) => [...prev, { id: crypto.randomUUID(), title, deadline, completed: false }]);
  };

  const toggleGoal = (id: string) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g)));
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const addTodo = (text: string) => {
    setTodos((prev) => [...prev, { id: crypto.randomUUID(), text, completed: false }]);
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <DashboardContext.Provider
      value={{
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
