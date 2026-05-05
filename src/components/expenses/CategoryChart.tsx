import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useExpenses } from "@/lib/expenses-context";
import { useCurrency } from "@/lib/currency-context";

export const CategoryChart = () => {
  const { byCategory, monthTotal } = useExpenses();
  const { formatAmount } = useCurrency();

  const data = byCategory.filter((c) => c.total > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="bg-[#121212] border border-white/5 rounded-sm shadow-sm overflow-hidden"
    >
      <div className="px-6 md:px-8 py-6 border-b border-white/5">
        <h2 className="font-display text-xl">By Category</h2>
        <p className="text-xs text-muted-foreground mt-1">Distribution</p>
      </div>

      <div className="p-6 md:p-8">
        {data.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No expenses this month yet.
          </div>
        ) : (
          <>
            <div className="relative">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={2}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-3xl font-medium">{formatAmount(monthTotal, 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">Total</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {data.map((cat) => {
                const pct = monthTotal > 0 ? (cat.total / monthTotal) * 100 : 0;
                return (
                  <div key={cat.category} className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm text-muted-foreground truncate">
                      {cat.category}
                    </span>
                    <span className="text-xs mono-font text-muted-foreground ml-auto">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};
