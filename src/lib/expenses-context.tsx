import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { collection, doc, setDoc, getDocs, query, where, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useUser } from "./user-context";

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
  user_id?: string;
}

export type Budgets = Partial<Record<ExpenseCategory, number>>;

interface ExpensesContextValue {
  expenses: Expense[];
  budgets: Budgets;
  addExpense: (expense: Omit<Expense, "id">) => void;
  removeExpense: (id: string) => void;
  setBudget: (category: ExpenseCategory, amount: number) => void;
  income: number;
  setIncome: (amount: number) => void;
  monthTotal: number;
  todayTotal: number;
  byCategory: Array<{ category: ExpenseCategory; total: number; color: string; budget: number }>;
  last7Days: Array<{ date: string; total: number }>;
}

const ExpensesContext = createContext<ExpensesContextValue | null>(null);

const DEFAULT_BUDGETS: Budgets = {};

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const ExpensesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (!user) {
      setExpenses([]);
      return;
    }

    const fetchExpenses = async () => {
      try {
        const q = query(collection(db, "expenses"), where("user_id", "==", user.uid));
        const snap = await getDocs(q);
        setExpenses(snap.docs.map(doc => doc.data() as Expense));
      } catch (err) {
        console.error("Error fetching expenses:", err);
      }
    };
    fetchExpenses();
  }, [user]);

  const [budgets, setBudgets] = useState<Budgets>(() => {
    try {
      const saved = localStorage.getItem("north_budgets_v1");
      return saved ? JSON.parse(saved) : DEFAULT_BUDGETS;
    } catch {
      return DEFAULT_BUDGETS;
    }
  });

  const [income, setIncome] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("north_income_v1");
      return saved ? JSON.parse(saved) : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    localStorage.setItem("north_budgets_v1", JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem("north_income_v1", JSON.stringify(income));
  }, [income]);

  const addExpense = async (expense: Omit<Expense, "id">) => {
    const newExpense: Expense = { 
      ...expense, 
      id: crypto.randomUUID(),
      user_id: user?.uid 
    };
    setExpenses((prev) => [newExpense, ...prev]);
    
    if (user) {
      await setDoc(doc(db, "expenses", newExpense.id), newExpense);
    }
  };

  const removeExpense = async (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    
    if (user) {
      await deleteDoc(doc(db, "expenses", id));
    }
  };

  const setBudget = (category: ExpenseCategory, amount: number) => {
    setBudgets((prev) => ({ ...prev, [category]: amount }));
  };

  const derived = useMemo(() => {
    const currentMonth = getCurrentMonth();
    const today = getTodayString();

    const monthExpenses = expenses.filter((e) => e.date.startsWith(currentMonth));
    const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);

    const todayExpenses = expenses.filter((e) => e.date === today);
    const todayTotal = todayExpenses.reduce((s, e) => s + e.amount, 0);

    const byCategory = CATEGORIES.map((cat) => {
      const total = monthExpenses
        .filter((e) => e.category === cat.name)
        .reduce((s, e) => s + e.amount, 0);
      return {
        category: cat.name,
        total,
        color: cat.color,
        budget: budgets[cat.name] ?? 0,
      };
    });

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split("T")[0];
      const total = expenses
        .filter((e) => e.date === dateStr)
        .reduce((s, e) => s + e.amount, 0);
      return {
        date: d.toLocaleDateString("en-US", { weekday: "short" }),
        total,
      };
    });

    return { monthTotal, todayTotal, byCategory, last7Days };
  }, [expenses, budgets]);

  return (
    <ExpensesContext.Provider
      value={{
        expenses,
        budgets,
        income,
        addExpense,
        removeExpense,
        setBudget,
        setIncome,
        ...derived,
      }}
    >
      {children}
    </ExpensesContext.Provider>
  );
};

export const useExpenses = () => {
  const ctx = useContext(ExpensesContext);
  if (!ctx) throw new Error("useExpenses must be used within ExpensesProvider");
  return ctx;
};
