import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from "recharts";
import { useExpenses } from "@/lib/expenses-context";
import { useCurrency } from "@/lib/currency-context";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { EASE_OUT, spring } from "@/lib/motion";

interface ActiveShapeProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
}

/** Hovered wedge pushes outward slightly instead of changing colour. */
const renderActiveShape = (props: unknown) => {
  const p = props as ActiveShapeProps;
  return (
    <g>
      <Sector
        cx={p.cx}
        cy={p.cy}
        innerRadius={p.innerRadius}
        outerRadius={p.outerRadius + 6}
        startAngle={p.startAngle}
        endAngle={p.endAngle}
        fill={p.fill}
        stroke="hsl(var(--background))"
        strokeWidth={2}
      />
    </g>
  );
};

export const CategoryChart = () => {
  const { byCategory, monthTotal } = useExpenses();
  const { formatAmount } = useCurrency();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const data = byCategory.filter((c) => c.total > 0).sort((a, b) => b.total - a.total);
  const focused = activeIndex !== null ? data[activeIndex] : null;

  return (
    <SpotlightCard className="h-full rounded-sm" reveal delay={0.15}>
      <div className="border-b border-white/5 px-6 py-6 md:px-8">
        <h2 className="font-display text-xl">By Category</h2>
        <p className="mt-1 text-xs text-muted-foreground">Distribution</p>
      </div>

      <div className="p-6 md:p-8">
        {data.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
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
                    outerRadius={108}
                    paddingAngle={2}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                    activeIndex={activeIndex ?? undefined}
                    activeShape={renderActiveShape}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    animationDuration={900}
                    animationEasing="ease-out"
                  >
                    {data.map((entry) => (
                      <Cell key={entry.category} fill={entry.color} style={{ cursor: "pointer", outline: "none" }} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={focused?.category ?? "total"}
                    initial={{ opacity: 0, y: 8, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={spring.snappy}
                    className="flex flex-col items-center"
                  >
                    <p className="text-2xl font-medium text-white">
                      {formatAmount(focused ? focused.total : monthTotal, 0)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {focused ? focused.category : "Total"}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2.5">
              {data.map((cat, i) => {
                const pct = monthTotal > 0 ? (cat.total / monthTotal) * 100 : 0;
                const dim = activeIndex !== null && activeIndex !== i;
                return (
                  <motion.button
                    key={cat.category}
                    type="button"
                    onMouseEnter={() => setActiveIndex(i)}
                    onMouseLeave={() => setActiveIndex(null)}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: dim ? 0.35 : 1, x: 0 }}
                    transition={{ duration: 0.4, ease: EASE_OUT, delay: i * 0.04 }}
                    className="flex items-center gap-2 text-left"
                  >
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-full transition-shadow"
                      style={{
                        backgroundColor: cat.color,
                        boxShadow: activeIndex === i ? `0 0 10px ${cat.color}` : "none",
                      }}
                    />
                    <span className="truncate text-sm text-muted-foreground">{cat.category}</span>
                    <span className="mono-font ml-auto text-xs tabular-nums text-muted-foreground">
                      <AnimatedNumber value={pct} decimals={0} suffix="%" />
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </SpotlightCard>
  );
};
