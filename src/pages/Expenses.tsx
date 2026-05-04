import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import GradualBlur from "@/components/GradualBlur";
import { SiteNav } from "@/components/SiteNav";
import heroBg from "@/assets/hero-bg.jpg";
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
  const { currency, setCurrency, formatAmount } = useCurrency();
  const { username } = useUser();

  return (
    <div className="min-h-screen bg-background">
      <section className="relative min-h-[50vh] flex flex-col overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover" width={1920} height={1280} />
          <div className="absolute inset-0 bg-gradient-hero" />
        </div>
        <SiteNav variant="hero" />

        <div className="relative z-10 flex-1 flex items-center justify-between px-6 md:px-12 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="display-font text-5xl md:text-7xl text-foreground">
              Welcome, {username}
            </h1>
          </motion.div>
          
          {/* Currency Switcher */}
          <div className="glass-card rounded-sm p-2 flex gap-2">
            <Button
              variant={currency === "INR" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrency("INR")}
              className="text-xs uppercase tracking-[0.15em]"
            >
              ₹ INR
            </Button>
            <Button
              variant={currency === "USD" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrency("USD")}
              className="text-xs uppercase tracking-[0.15em]"
            >
              $ USD
            </Button>
          </div>
        </div>
        <GradualBlur preset="bottom" strength={2.5} divCount={6} curve="ease-out" />
      </section>

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

      <footer className="border-t border-border px-6 md:px-12 py-10 mt-16">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs mono-font text-muted-foreground">
          <span>© 2026 NORTH — All amounts stored locally.</span>
          <span>SPEND CONSCIOUSLY · INVEST PATIENTLY</span>
        </div>
      </footer>

      {/* Page-level scroll blur effect */}
      <GradualBlur preset="page-footer" strength={2} divCount={6} animated="scroll" />
    </div>
  );
};

export default Expenses;
