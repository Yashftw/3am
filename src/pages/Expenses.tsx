import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { SiteNav } from "@/components/SiteNav";
import { ExpenseSummary } from "@/components/expenses/ExpenseSummary";
import { AddExpenseForm } from "@/components/expenses/AddExpenseForm";
import { WeeklyChart } from "@/components/expenses/WeeklyChart";
import { CategoryChart } from "@/components/expenses/CategoryChart";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { BudgetPanel } from "@/components/expenses/BudgetPanel";
import { useCurrency } from "@/lib/currency-context";
import { useUser } from "@/lib/user-context";
import { Button } from "@/components/ui/button";

const Expenses = () => {
  const { currency, setCurrency } = useCurrency();
  const { username } = useUser();

  return (
    <div className="flex-1 flex flex-col relative z-10 bg-[#0a0a0a]">
      <div className="relative z-10 px-6 md:px-12 py-8 max-w-[1600px] w-full mx-auto flex items-end justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="font-display text-4xl md:text-5xl text-foreground font-light tracking-tight">
            Hello, {username}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Manage your finances</p>
        </motion.div>
        
        {/* Currency Switcher */}
        <div className="flex gap-2">
          <Button
            variant={currency === "INR" ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrency("INR")}
            className="text-xs rounded-sm h-8"
          >
            ₹ INR
          </Button>
          <Button
            variant={currency === "USD" ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrency("USD")}
            className="text-xs rounded-sm h-8"
          >
            $ USD
          </Button>
        </div>
      </div>

      <main className="relative px-6 md:px-12 py-8 md:py-12 max-w-[1600px] mx-auto space-y-8 z-10">
        <ExpenseSummary />
        
        <AddExpenseForm />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <WeeklyChart />
          </div>
          <CategoryChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ExpenseList />
          </div>
          <BudgetPanel />
        </div>

      </main>

      <footer className="border-t border-white/5 px-6 md:px-12 py-10 mt-16 bg-[#0a0a0a]">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-sans text-muted-foreground">
          <span>© 2026 NORTH — All amounts stored locally.</span>
          <span>SPEND CONSCIOUSLY · INVEST PATIENTLY</span>
        </div>
      </footer>
    </div>
  );
};

export default Expenses;
