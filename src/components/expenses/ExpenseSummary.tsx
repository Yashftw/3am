import { motion } from "framer-motion";
import { Wallet, Calendar, TrendingDown, DollarSign } from "lucide-react";
import { useExpenses } from "@/lib/expenses-context";
import { useCurrency } from "@/lib/currency-context";
import { Input } from "@/components/ui/input";

export const ExpenseSummary = () => {
  const { monthTotal, todayTotal, byCategory, expenses, income, setIncome } = useExpenses();
  const { formatAmount } = useCurrency();

  const totalBudget = byCategory.reduce((s, c) => s + c.budget, 0);
  const totalAvailable = income > 0 ? income : totalBudget;
  const spentPct = totalAvailable > 0 ? (monthTotal / totalAvailable) * 100 : 0;
  const remaining = Math.max(totalAvailable - monthTotal, 0);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthExpenses = expenses.filter((e) => e.date.startsWith(currentMonth));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass-card rounded-sm p-8 md:p-10 shadow-elegant relative overflow-hidden"
    >
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-primary opacity-10 blur-3xl rounded-full" />

      <div className="flex items-center gap-3 mb-8 relative">
        <div className="h-10 w-10 rounded-sm bg-gradient-primary flex items-center justify-center">
          <Wallet className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">This Month</p>
          <p className="text-xs text-muted-foreground/70 mono-font">{monthExpenses.length} transactions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 relative">
        <div className="bg-background/40 p-4 rounded-lg border border-border/50">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Total Funds
          </p>
          <div className="flex items-center">
            <Input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={income || ""}
              placeholder="Enter monthly pool..."
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setIncome(isNaN(val) ? 0 : val);
              }}
              className="text-2xl md:text-3xl font-bold mono-font h-14 bg-background/50 border-2 border-border/50 hover:border-border focus-visible:border-primary focus-visible:ring-0 w-full shadow-sm rounded-md px-4 transition-colors"
            />
          </div>
          <div className="mt-3 text-xs text-muted-foreground/70 leading-relaxed">
            Set this to track how much of your total funds remain.
          </div>
        </div>

        <div className="sm:border-l sm:border-border sm:pl-6 lg:pl-8 py-2">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">Spent</p>
          <p className="display-font text-4xl md:text-5xl text-foreground mono-font">
            {formatAmount(monthTotal, 0)}
          </p>
          <div className="mt-4 space-y-2">
            <div className="w-full h-px bg-border overflow-hidden">
              <div
                className="h-full bg-gradient-primary transition-all duration-700"
                style={{ width: `${Math.min(spentPct, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mono-font">
              {spentPct.toFixed(1)}% of {formatAmount(totalAvailable, 0)} {income > 0 ? "funds" : "budget"}
            </p>
          </div>
        </div>

        <div className="lg:border-l lg:border-border lg:pl-8 py-2 border-t sm:border-t-0 border-border pt-6 sm:pt-2">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">Remaining</p>
          <div className="flex items-baseline gap-3">
            <p className="text-3xl md:text-4xl font-bold mono-font text-success">
              {formatAmount(remaining, 0)}
            </p>
          </div>
          <div className="inline-flex items-center gap-1 mt-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Through month end
          </div>
        </div>

        <div className="sm:border-l sm:border-border sm:pl-6 lg:pl-8 py-2 border-t sm:border-t-0 border-border pt-6 sm:pt-2">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">Today</p>
          <div className="flex items-baseline gap-3">
            <p className="text-3xl md:text-4xl font-bold mono-font text-destructive">
              {formatAmount(todayTotal, 0)}
            </p>
          </div>
          <div className="inline-flex items-center gap-1 mt-2 text-sm text-muted-foreground">
            <TrendingDown className="h-4 w-4" />
            Tracked today
          </div>
        </div>
      </div>
    </motion.div>
  );
};
