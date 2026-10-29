import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from "react";
import { collection, doc, setDoc, onSnapshot, query, where, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useUser } from "./user-context";
import { useSync } from "./sync-status";
import { addTombstone, loadLocal, loadTombstones, mergeById, saveLocal } from "./local-store";
import { isOnLocalDate, lastNDates, toLocalISODate } from "./date-utils";

export interface SleepRecordV2 {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO string
  hours: number;
  user_id?: string;
}

export type WorkoutCategory = "Cardio" | "Strength" | "Flexibility" | "Recovery";

export interface WorkoutRecordV2 {
  id: string;
  date: string;
  timestamp: string;
  durationMinutes: number;
  type: WorkoutCategory;
  user_id?: string;
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
  completedAt?: string;
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
  isLoading: boolean;
  addSleep: (date: string, hours: number) => void;
  addWorkout: (date: string, durationMinutes: number, type: WorkoutCategory) => void;
  addGoal: (title: string, deadline: string, category: GoalCategory, note?: string) => void;
  incrementGoal: (id: string, amount: number) => void;
  setGoalProgress: (id: string, progress: number) => void;
  toggleGoalSubTask: (goalId: string, subTaskId: string) => void;
  addGoalSubTask: (goalId: string, text: string) => void;
  deleteGoal: (id: string) => void;
  addTodo: (text: string, priority: PriorityLevel, category?: TodoCategory, estimatedTime?: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  streak: number;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

const SCOPES = {
  sleep: "sleep",
  workouts: "workouts",
  goals: "goals",
  todos: "todos",
} as const;

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const { track } = useSync();
  const uid = user?.uid ?? null;

  const [sleepData, setSleepData] = useState<SleepRecordV2[]>([]);
  const [workoutData, setWorkoutData] = useState<WorkoutRecordV2[]>([]);
  const [goals, setGoals] = useState<GoalV2[]>([]);
  const [todos, setTodos] = useState<TodoV2[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * The uid whose cache is currently loaded into state.
   *
   * This is state, not a ref, on purpose. When the signed-in user changes,
   * React commits one render where `uid` is already the new user but the data
   * in state still belongs to the old one. A ref updated inside the hydration
   * effect would already read as the new uid during that same commit, and the
   * mirror effects below would write the previous user's records into the new
   * user's cache key. Because this is state, it only catches up on the next
   * render - by which point the data matches it.
   */
  const [hydratedUid, setHydratedUid] = useState<string | null | undefined>(undefined);

  /* ---------------------------------------------------------------- */
  /* Hydrate from cache, then attach live listeners                    */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    // 1. Paint from the local mirror immediately - no network, no spinner.
    setSleepData(loadLocal<SleepRecordV2[]>(SCOPES.sleep, uid, []));
    setWorkoutData(loadLocal<WorkoutRecordV2[]>(SCOPES.workouts, uid, []));
    setGoals(loadLocal<GoalV2[]>(SCOPES.goals, uid, []));
    setTodos(loadLocal<TodoV2[]>(SCOPES.todos, uid, []));
    setHydratedUid(uid);

    if (!uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // 2. Subscribe. Firestore serves the IndexedDB cache first, then the
    //    server, so this fires fast offline and stays live online.
    const subscribe = <T extends { id: string }>(
      name: string,
      scope: string,
      apply: (next: T[]) => void,
    ) => {
      const q = query(collection(db, name), where("user_id", "==", uid));
      return onSnapshot(
        q,
        (snap) => {
          const remote = snap.docs.map((d) => d.data() as T);
          const tombstones = loadTombstones(scope, uid);
          const local = loadLocal<T[]>(scope, uid, []);
          apply(mergeById(local, remote, tombstones));
          setIsLoading(false);
        },
        (err) => {
          // Permission trouble or a hard network failure. The cached copy
          // already on screen stays exactly as it is.
          console.error(`[3am] Live sync for "${name}" interrupted; using cached data.`, err);
          setIsLoading(false);
        },
      );
    };

    const unsubs = [
      subscribe<SleepRecordV2>("sleep", SCOPES.sleep, setSleepData),
      subscribe<WorkoutRecordV2>("workouts", SCOPES.workouts, setWorkoutData),
      subscribe<GoalV2>("goals", SCOPES.goals, setGoals),
      subscribe<TodoV2>("todos", SCOPES.todos, setTodos),
    ];

    return () => unsubs.forEach((u) => u());
  }, [uid]);

  /* ---------------------------------------------------------------- */
  /* Write-through mirror                                              */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (hydratedUid !== uid) return;
    saveLocal(SCOPES.sleep, uid, sleepData);
  }, [sleepData, uid, hydratedUid]);

  useEffect(() => {
    if (hydratedUid !== uid) return;
    saveLocal(SCOPES.workouts, uid, workoutData);
  }, [workoutData, uid, hydratedUid]);

  useEffect(() => {
    if (hydratedUid !== uid) return;
    saveLocal(SCOPES.goals, uid, goals);
  }, [goals, uid, hydratedUid]);

  useEffect(() => {
    if (hydratedUid !== uid) return;
    saveLocal(SCOPES.todos, uid, todos);
  }, [todos, uid, hydratedUid]);

  /** Push one document. Local state and cache are already updated by now. */
  const push = useCallback(
    (name: string, record: Record<string, unknown> & { id: string }) => {
      if (!uid) return;
      void track(() => setDoc(doc(db, name, record.id), record, { merge: true }));
    },
    [track, uid],
  );

  const remove = useCallback(
    (name: string, scope: string, id: string) => {
      addTombstone(scope, uid, id);
      if (!uid) return;
      void track(() => deleteDoc(doc(db, name, id)));
    },
    [track, uid],
  );

  /* ---------------------------------------------------------------- */
  /* Mutations                                                         */
  /* ---------------------------------------------------------------- */

  const addSleep = useCallback((date: string, hours: number) => {
    setSleepData((prev) => {
      const idx = prev.findIndex((s) => s.date === date);
      const record: SleepRecordV2 =
        idx >= 0
          ? { ...prev[idx], hours, timestamp: new Date().toISOString() }
          : { id: crypto.randomUUID(), date, timestamp: new Date().toISOString(), hours, user_id: uid ?? "" };

      push("sleep", { ...record });

      if (idx >= 0) {
        const next = [...prev];
        next[idx] = record;
        return next;
      }
      return [...prev, record];
    });
  }, [push, uid]);

  const addWorkout = useCallback((date: string, durationMinutes: number, type: WorkoutCategory) => {
    const record: WorkoutRecordV2 = {
      id: crypto.randomUUID(),
      date,
      timestamp: new Date().toISOString(),
      durationMinutes,
      type,
      user_id: uid ?? "",
    };
    setWorkoutData((prev) => [...prev, record]);
    push("workouts", { ...record });
  }, [push, uid]);

  const addGoal = useCallback((title: string, deadline: string, category: GoalCategory, note?: string) => {
    const record: GoalV2 = {
      id: crypto.randomUUID(),
      title,
      deadline,
      category,
      note: note || "",
      subTasks: [],
      progress: 0,
      completed: false,
      createdAt: new Date().toISOString(),
      user_id: uid ?? "",
    };
    setGoals((prev) => [...prev, record]);
    push("goals", { ...record });
  }, [push, uid]);

  /** Single place where a goal is rewritten, so persistence cannot be skipped. */
  const patchGoal = useCallback((id: string, patch: (g: GoalV2) => GoalV2) => {
    setGoals((prev) => {
      const idx = prev.findIndex((g) => g.id === id);
      if (idx < 0) return prev;
      const updated = patch(prev[idx]);
      const next = [...prev];
      next[idx] = updated;
      push("goals", { ...updated, completedAt: updated.completedAt ?? null });
      return next;
    });
  }, [push]);

  const withProgress = (g: GoalV2, progress: number): GoalV2 => {
    const clamped = Math.min(Math.max(progress, 0), 100);
    const completed = clamped === 100;
    return {
      ...g,
      progress: clamped,
      completed,
      completedAt: completed ? g.completedAt ?? new Date().toISOString() : undefined,
    };
  };

  const incrementGoal = useCallback((id: string, amount: number) => {
    patchGoal(id, (g) => withProgress(g, g.progress + amount));
  }, [patchGoal]);

  const setGoalProgress = useCallback((id: string, progress: number) => {
    patchGoal(id, (g) => withProgress(g, progress));
  }, [patchGoal]);

  const recalcFromSubTasks = (g: GoalV2, subTasks: GoalSubTask[]): GoalV2 => {
    const total = subTasks.length;
    const done = subTasks.filter((st) => st.completed).length;
    const progress = total > 0 ? Math.round((done / total) * 100) : g.progress;
    return withProgress({ ...g, subTasks }, progress);
  };

  const toggleGoalSubTask = useCallback((goalId: string, subTaskId: string) => {
    patchGoal(goalId, (g) =>
      recalcFromSubTasks(
        g,
        (g.subTasks ?? []).map((st) => (st.id === subTaskId ? { ...st, completed: !st.completed } : st)),
      ),
    );
  }, [patchGoal]);

  const addGoalSubTask = useCallback((goalId: string, text: string) => {
    patchGoal(goalId, (g) =>
      recalcFromSubTasks(g, [...(g.subTasks ?? []), { id: crypto.randomUUID(), text, completed: false }]),
    );
  }, [patchGoal]);

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    remove("goals", SCOPES.goals, id);
  }, [remove]);

  const addTodo = useCallback((
    text: string,
    priority: PriorityLevel,
    category?: TodoCategory,
    estimatedTime?: string,
  ) => {
    const record: TodoV2 = {
      id: crypto.randomUUID(),
      text,
      priority,
      category: category || "Personal",
      estimatedTime: estimatedTime || "",
      completed: false,
      createdAt: new Date().toISOString(),
      user_id: uid ?? "",
    };
    setTodos((prev) => [...prev, record]);
    push("todos", { ...record });
  }, [push, uid]);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx < 0) return prev;
      const completed = !prev[idx].completed;
      const updated: TodoV2 = {
        ...prev[idx],
        completed,
        completedAt: completed ? new Date().toISOString() : undefined,
      };
      const next = [...prev];
      next[idx] = updated;
      // null rather than undefined so a merge write actually clears the field
      // when a task is un-checked.
      push("todos", { ...updated, completedAt: updated.completedAt ?? null });
      return next;
    });
  }, [push]);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    remove("todos", SCOPES.todos, id);
  }, [remove]);

  /* ---------------------------------------------------------------- */
  /* Derived                                                           */
  /* ---------------------------------------------------------------- */

  const streak = useMemo(() => {
    if (workoutData.length === 0) return 0;
    const logged = new Set(workoutData.map((w) => w.date));
    const today = toLocalISODate();

    const cursor = new Date();
    // A streak stays alive until the end of today, so start counting from
    // yesterday if nothing is logged yet today.
    if (!logged.has(today)) cursor.setDate(cursor.getDate() - 1);

    let count = 0;
    // Cap the walk so a corrupt cache cannot spin forever.
    for (let i = 0; i < 3650; i++) {
      if (!logged.has(toLocalISODate(cursor))) break;
      count++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [workoutData]);

  const value = useMemo<DashboardContextValue>(() => ({
    sleepData, workoutData, goals, todos, isLoading,
    addSleep, addWorkout, addGoal, incrementGoal,
    setGoalProgress, toggleGoalSubTask, addGoalSubTask, deleteGoal,
    addTodo, toggleTodo, deleteTodo, streak,
  }), [
    sleepData, workoutData, goals, todos, isLoading,
    addSleep, addWorkout, addGoal, incrementGoal,
    setGoalProgress, toggleGoalSubTask, addGoalSubTask, deleteGoal,
    addTodo, toggleTodo, deleteTodo, streak,
  ]);

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
};

/** Tasks belonging to a given local day (created then, or completed then). */
export function todosForDate(todos: TodoV2[], date: string): TodoV2[] {
  return todos.filter((t) => isOnLocalDate(t.createdAt, date) || isOnLocalDate(t.completedAt, date));
}

export { lastNDates };
