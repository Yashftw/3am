import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from "react";
import { collection, doc, setDoc, onSnapshot, query, where, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useUser } from "./user-context";
import { useSync } from "./sync-status";
import { addTombstone, loadLocal, loadTombstones, mergeById, saveLocal } from "./local-store";
import { lastNDates, toLocalISODate, toLocalMonthKey } from "./date-utils";

export type ExpenseCategory =
  | "Food"
  | "Transport"
  | "Housing"
  | "Entertainment"
  | "Shopping"
  | "Health"
  | "Bills"
  | "Other";

export interface CategoryInfo {
  name: ExpenseCategory;
  color: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { name: "Food", color: "hsl(25 95% 60%)" },
  { name: "Transport", color: "hsl(190 80% 55%)" },
  { name: "Housing", color: "hsl(220 80% 65%)" },
  { name: "Entertainment", color: "hsl(280 70% 65%)" },
  { name: "Shopping", color: "hsl(330 75% 60%)" },
  { name: "Health", color: "hsl(140 70% 55%)" },
  { name: "Bills", color: "hsl(210 75% 60%)" },
  { name: "Other", color: "hsl(0 0% 50%)" },
];

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  note: string;
  date: string; // ISO yyyy-mm-dd
  createdAt?: string;
  user_id?: string;
}

export type Budgets = Partial<Record<ExpenseCategory, number>>;

/**
 * What you decided, up front, about the month.
 *
 * Salary and planned spend are deliberately separate numbers: the gap
 * between them is the month's savings, and collapsing them into one "funds"
 * figure made that invisible.
 */
export interface BudgetPlan {
  /** Monthly take-home pay. */
  salary: number;
  /** Total you intend to spend. Savings = salary - monthlyBudget. */
  monthlyBudget: number;
  /** The YYYY-MM this plan was confirmed for. */
  month: string;
  confirmedAt: string;
}

export interface CategoryRollup {
  category: ExpenseCategory;
  total: number;
  color: string;
  budget: number;
}

interface ExpensesContextValue {
  expenses: Expense[];
  budgets: Budgets;
  isLoading: boolean;
  addExpense: (expense: Omit<Expense, "id">) => void;
  removeExpense: (id: string) => void;
  setBudget: (category: ExpenseCategory, amount: number) => void;
  /** Replace every category limit at once, as one write. */
  setBudgets: (next: Budgets) => void;
  income: number;
  setIncome: (amount: number) => void;
  /** Monthly take-home pay (stored as `income` for backward compatibility). */
  salary: number;
  /** Total planned spend for the month. */
  monthlyBudget: number;
  /**
   * The figure every "remaining" calculation is measured against: the planned
   * budget when one is set, otherwise salary, otherwise the sum of category
   * limits. One place to change, so the page can never disagree with itself.
   */
  spendingPool: number;
  /** Salary + budget confirmed for the current month. */
  isPlanSetForMonth: boolean;
  plan: BudgetPlan | null;
  savePlan: (salary: number, monthlyBudget: number) => void;
  monthTotal: number;
  todayTotal: number;
  byCategory: CategoryRollup[];
  last7Days: Array<{ date: string; iso: string; total: number }>;
  /** All expenses in a YYYY-MM month, newest first. */
  expensesForMonth: (monthKey: string) => Expense[];
}

const ExpensesContext = createContext<ExpensesContextValue | null>(null);

const SCOPES = {
  expenses: "expenses",
  budgets: "budgets",
  income: "income",
  plan: "plan",
  settingsId: "settingsId",
} as const;

export const ExpensesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const { track } = useSync();
  const uid = user?.uid ?? null;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budgets>({});
  const [income, setIncomeState] = useState<number>(0);
  const [plan, setPlan] = useState<BudgetPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** See the note in dashboard-context: this must be state, not a ref. */
  const [hydratedUid, setHydratedUid] = useState<string | null | undefined>(undefined);
  // Stable per-user settings doc id, so budgets and income always land on the
  // same document instead of racing a query on every write.
  const settingsIdRef = useRef<string | null>(null);

  /* ---------------------------------------------------------------- */
  /* Hydrate, then subscribe                                           */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    setExpenses(loadLocal<Expense[]>(SCOPES.expenses, uid, []));
    setBudgets(loadLocal<Budgets>(SCOPES.budgets, uid, {}));
    setIncomeState(loadLocal<number>(SCOPES.income, uid, 0));
    setPlan(loadLocal<BudgetPlan | null>(SCOPES.plan, uid, null));
    settingsIdRef.current = loadLocal<string | null>(SCOPES.settingsId, uid, null);
    setHydratedUid(uid);

    if (!uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const expensesQuery = query(collection(db, "expenses"), where("user_id", "==", uid));
    const unsubExpenses = onSnapshot(
      expensesQuery,
      (snap) => {
        const remote = snap.docs.map((d) => d.data() as Expense);
        const tombstones = loadTombstones(SCOPES.expenses, uid);
        const local = loadLocal<Expense[]>(SCOPES.expenses, uid, []);
        setExpenses(mergeById(local, remote, tombstones));
        setIsLoading(false);
      },
      (err) => {
        console.error("[3am] Live sync for expenses interrupted; using cached data.", err);
        setIsLoading(false);
      },
    );

    const settingsQuery = query(collection(db, "settings"), where("user_id", "==", uid));
    const unsubSettings = onSnapshot(
      settingsQuery,
      (snap) => {
        if (snap.empty) return;
        const docSnap = snap.docs[0];
        settingsIdRef.current = docSnap.id;
        saveLocal(SCOPES.settingsId, uid, docSnap.id);

        const data = docSnap.data();
        if (data.budgets) setBudgets(data.budgets as Budgets);
        if (typeof data.income === "number") setIncomeState(data.income);
        if (data.plan) setPlan(data.plan as BudgetPlan);
      },
      (err) => console.error("[3am] Live sync for settings interrupted; using cached values.", err),
    );

    return () => {
      unsubExpenses();
      unsubSettings();
    };
  }, [uid]);

  /* ---------------------------------------------------------------- */
  /* Write-through mirror                                              */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (hydratedUid !== uid) return;
    saveLocal(SCOPES.expenses, uid, expenses);
  }, [expenses, uid, hydratedUid]);

  useEffect(() => {
    if (hydratedUid !== uid) return;
    saveLocal(SCOPES.budgets, uid, budgets);
  }, [budgets, uid, hydratedUid]);

  useEffect(() => {
    if (hydratedUid !== uid) return;
    saveLocal(SCOPES.income, uid, income);
  }, [income, uid, hydratedUid]);

  useEffect(() => {
    if (hydratedUid !== uid) return;
    saveLocal(SCOPES.plan, uid, plan);
  }, [plan, uid, hydratedUid]);

  /* ---------------------------------------------------------------- */
  /* Mutations                                                         */
  /* ---------------------------------------------------------------- */

  const writeSettings = useCallback((updates: { budgets?: Budgets; income?: number; plan?: BudgetPlan }) => {
    if (!uid) return;
    if (!settingsIdRef.current) {
      settingsIdRef.current = crypto.randomUUID();
      saveLocal(SCOPES.settingsId, uid, settingsIdRef.current);
    }
    const id = settingsIdRef.current;
    void track(() => setDoc(doc(db, "settings", id), { user_id: uid, ...updates }, { merge: true }));
  }, [track, uid]);

  const addExpense = useCallback((expense: Omit<Expense, "id">) => {
    const record: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      user_id: uid ?? "",
    };
    setExpenses((prev) => [record, ...prev]);
    if (uid) void track(() => setDoc(doc(db, "expenses", record.id), record, { merge: true }));
  }, [track, uid]);

  const removeExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    addTombstone(SCOPES.expenses, uid, id);
    if (uid) void track(() => deleteDoc(doc(db, "expenses", id)));
  }, [track, uid]);

  const setBudget = useCallback((category: ExpenseCategory, amount: number) => {
    setBudgets((prev) => {
      const next = { ...prev, [category]: amount };
      writeSettings({ budgets: next });
      return next;
    });
  }, [writeSettings]);

  const setBudgetsBulk = useCallback((next: Budgets) => {
    // Setting eight limits one at a time would queue eight document writes
    // and eight re-renders; the setup step changes them together.
    setBudgets(next);
    writeSettings({ budgets: next });
  }, [writeSettings]);

  const setIncome = useCallback((amount: number) => {
    setIncomeState(amount);
    writeSettings({ income: amount });
  }, [writeSettings]);

  const savePlan = useCallback((salary: number, monthlyBudget: number) => {
    const next: BudgetPlan = {
      salary: Math.max(salary, 0),
      monthlyBudget: Math.max(monthlyBudget, 0),
      month: toLocalMonthKey(),
      confirmedAt: new Date().toISOString(),
    };
    setPlan(next);
    setIncomeState(next.salary);
    // Salary is mirrored into `income` so older records and any other client
    // still reading that field keep working.
    writeSettings({ plan: next, income: next.salary });
  }, [writeSettings]);

  /* ---------------------------------------------------------------- */
  /* Derived                                                           */
  /* ---------------------------------------------------------------- */

  const expensesForMonth = useCallback(
    (monthKey: string) =>
      expenses
        .filter((e) => e.date?.startsWith(monthKey))
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [expenses],
  );

  const isPlanSetForMonth = plan !== null && plan.month === toLocalMonthKey();

  const derived = useMemo(() => {
    const currentMonth = toLocalMonthKey();
    const today = toLocalISODate();

    const monthExpenses = expenses.filter((e) => e.date?.startsWith(currentMonth));
    const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const todayTotal = expenses.filter((e) => e.date === today).reduce((s, e) => s + e.amount, 0);

    const byCategory: CategoryRollup[] = CATEGORIES.map((cat) => ({
      category: cat.name,
      total: monthExpenses.filter((e) => e.category === cat.name).reduce((s, e) => s + e.amount, 0),
      color: cat.color,
      budget: budgets[cat.name] ?? 0,
    }));

    const last7Days = lastNDates(7).map((iso) => ({
      iso,
      date: new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" }),
      total: expenses.filter((e) => e.date === iso).reduce((s, e) => s + e.amount, 0),
    }));

    const totalCategoryBudget = byCategory.reduce((sum, c) => sum + c.budget, 0);
    const spendingPool =
      plan && plan.monthlyBudget > 0 ? plan.monthlyBudget
      : income > 0 ? income
      : totalCategoryBudget;

    return { monthTotal, todayTotal, byCategory, last7Days, spendingPool };
  }, [expenses, budgets, plan, income]);

  const value = useMemo<ExpensesContextValue>(() => ({
    expenses,
    budgets,
    income,
    isLoading,
    addExpense,
    removeExpense,
    setBudget,
    setBudgets: setBudgetsBulk,
    setIncome,
    salary: plan?.salary ?? income,
    monthlyBudget: plan?.monthlyBudget ?? 0,
    isPlanSetForMonth,
    plan,
    savePlan,
    expensesForMonth,
    ...derived,
  }), [
    expenses, budgets, income, isLoading, addExpense, removeExpense, setBudget,
    setBudgetsBulk, setIncome, plan, isPlanSetForMonth, savePlan, expensesForMonth, derived,
  ]);

  return <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>;
};

export const useExpenses = () => {
  const ctx = useContext(ExpensesContext);
  if (!ctx) throw new Error("useExpenses must be used within ExpensesProvider");
  return ctx;
};
