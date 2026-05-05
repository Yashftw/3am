import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useExpenses } from "@/lib/expenses-context";
import { useCurrency } from "@/lib/currency-context";

export const BudgetPanel = () => {
  const { byCategory, setBudget } = useExpenses();
  const { formatAmount } = useCurrency();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="bg-[#121212] border border-white/5 rounded-sm shadow-sm overflow-hidden"
    >
      <div className="px-6 md:px-8 py-6 border-b border-white/5">
        <h2 className="font-display text-xl">Monthly Budgets</h2>
        <p className="text-xs text-muted-foreground mt-1">Limits</p>
      </div>

      <div className="p-6 md:p-8 space-y-4">
        {byCategory.map((cat) => {
          const pct = cat.budget > 0 ? (cat.total / cat.budget) * 100 : 0;
          const overBudget = cat.total > cat.budget && cat.budget > 0;

          return (
            <div key={cat.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm font-medium">{cat.category}</span>
                </div>
                <div className="flex items-center gap-1 mono-font text-sm">
                  <span className={overBudget ? "text-destructive" : "text-muted-foreground"}>
                    {formatAmount(cat.total, 0)}
                  </span>
                  <span className="text-muted-foreground">/</span>
                  <Input
                    type="number"
                    value={cat.budget || ""}
                    placeholder="0"
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val >= 0) {
                        setBudget(cat.category, val);
                      } else if (e.target.value === "") {
                        setBudget(cat.category, 0);
                      }
                    }}
                    className="w-20 h-6 px-2 py-0 text-xs font-mono text-right bg-[#1a1a1a] border-white/10"
                  />
                </div>
              </div>
              {cat.budget > 0 && (
                <div className="w-full h-1 bg-white/5 overflow-hidden rounded-full">
                  <div
                    className="h-full transition-all duration-700"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: overBudget ? "hsl(var(--destructive))" : cat.color,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
