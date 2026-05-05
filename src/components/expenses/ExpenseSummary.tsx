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
      className="bg-[#121212] border border-white/5 rounded-sm p-8 md:p-10 shadow-sm relative overflow-hidden"
    >

      <div className="flex items-center gap-3 mb-8 relative">
        <div className="h-10 w-10 rounded-sm bg-primary/10 flex items-center justify-center">
          <Wallet className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-display text-white">This Month</h2>
          <p className="text-xs text-muted-foreground">{monthExpenses.length} transactions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 relative">
        <div className="bg-[#1a1a1a] p-4 rounded-sm border border-white/5">
          <p className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
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
              className="text-2xl md:text-3xl font-medium h-14 bg-[#121212] border-2 border-white/5 focus-visible:border-white/20 focus-visible:ring-0 w-full shadow-sm rounded-sm px-4 transition-colors"
            />
          </div>
          <div className="mt-3 text-xs text-muted-foreground/70 leading-relaxed">
            Set this to track how much of your total funds remain.
          </div>
        </div>

        <div className="sm:border-l sm:border-white/5 sm:pl-6 lg:pl-8 py-2">
          <p className="text-xs text-muted-foreground mb-3">Spent</p>
          <p className="font-display text-4xl md:text-5xl text-foreground">
            {formatAmount(monthTotal, 0)}
          </p>
          <div className="mt-4 space-y-2">
            <div className="w-full h-1 bg-white/5 overflow-hidden rounded-full">
              <div
                className="h-full bg-white transition-all duration-700"
                style={{ width: `${Math.min(spentPct, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {spentPct.toFixed(1)}% of {formatAmount(totalAvailable, 0)} {income > 0 ? "funds" : "budget"}
            </p>
          </div>
        </div>

        <div className="lg:border-l lg:border-white/5 lg:pl-8 py-2 border-t sm:border-t-0 border-white/5 pt-6 sm:pt-2">
          <p className="text-xs text-muted-foreground mb-3">Remaining</p>
          <div className="flex items-baseline gap-3">
            <p className="text-3xl md:text-4xl font-medium text-emerald-400">
              {formatAmount(remaining, 0)}
            </p>
          </div>
          <div className="inline-flex items-center gap-1 mt-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Through month end
          </div>
        </div>

        <div className="sm:border-l sm:border-white/5 sm:pl-6 lg:pl-8 py-2 border-t sm:border-t-0 border-white/5 pt-6 sm:pt-2">
          <p className="text-xs text-muted-foreground mb-3">Today</p>
          <div className="flex items-baseline gap-3">
            <p className="text-3xl md:text-4xl font-medium text-red-400">
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
