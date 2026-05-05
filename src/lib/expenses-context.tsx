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
  const [budgets, setBudgets] = useState<Budgets>(DEFAULT_BUDGETS);
  const [income, setIncome] = useState<number>(0);

  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setBudgets(DEFAULT_BUDGETS);
      setIncome(0);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch Expenses
        const q = query(collection(db, "expenses"), where("user_id", "==", user.uid));
        const snap = await getDocs(q);
        setExpenses(snap.docs.map(doc => doc.data() as Expense));

        // Fetch Settings
        const settingsSnap = await getDocs(query(collection(db, "settings"), where("user_id", "==", user.uid)));
        if (!settingsSnap.empty) {
          const data = settingsSnap.docs[0].data();
          if (data.budgets) setBudgets(data.budgets);
          if (data.income !== undefined) setIncome(data.income);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, [user]);

  const updateSettings = async (updates: { budgets?: Budgets, income?: number }) => {
    if (!user) return;
    try {
      const q = query(collection(db, "settings"), where("user_id", "==", user.uid));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        const newSettings = { id: crypto.randomUUID(), user_id: user.uid, budgets, income, ...updates };
        await setDoc(doc(db, "settings", newSettings.id), newSettings);
      } else {
        const docRef = snap.docs[0].ref;
        await setDoc(docRef, updates, { merge: true });
      }
    } catch (err) {
      console.error("Error updating settings:", err);
    }
  };

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
    setBudgets((prev) => {
      const next = { ...prev, [category]: amount };
      updateSettings({ budgets: next });
      return next;
    });
  };

  const setIncomeWithSync = (amount: number) => {
    setIncome(amount);
    updateSettings({ income: amount });
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
        setIncome: setIncomeWithSync,
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
