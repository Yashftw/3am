import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useExpenses } from "@/lib/expenses-context";
import { useCurrency } from "@/lib/currency-context";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";

interface TooltipPayload {
  active?: boolean;
  payload?: Array<{ value: number; payload: { date: string } }>;
}

/** Matches the app's surfaces instead of recharts' default white box. */
const ChartTooltip = ({ active, payload, format }: TooltipPayload & { format: (n: number) => string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-white/15 bg-[#0d0d0d]/95 px-3 py-2 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.9)] backdrop-blur-md">
      <p className="mono-font text-[10px] uppercase tracking-wider text-muted-foreground">
        {payload[0].payload.date}
      </p>
      <p className="mt-0.5 text-sm font-medium text-white">{format(payload[0].value)}</p>
    </div>
  );
};

export const WeeklyChart = () => {
  const { last7Days } = useExpenses();
  const { formatAmount, currency } = useCurrency();

  const maxValue = Math.max(...last7Days.map((d) => d.total), 1);
  const weekTotal = last7Days.reduce((s, d) => s + d.total, 0);

  return (
    <SpotlightCard className="h-full rounded-sm" reveal delay={0.1}>
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-6 md:px-8">
        <div>
          <h2 className="font-display text-xl">Daily Spending</h2>
          <p className="mt-1 text-xs text-muted-foreground">Last 7 days</p>
        </div>
        <div className="text-right">
          <p className="hud-label">Week total</p>
          <p className="text-sm font-medium text-white">
            <AnimatedNumber value={weekTotal} format={(n) => formatAmount(n, 0)} />
          </p>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={last7Days} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.35} />
                <stop offset="70%" stopColor="#ffffff" stopOpacity={0.04} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={52}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickFormatter={(v) => `${currency === "INR" ? "₹" : "$"}${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
              domain={[0, Math.ceil(maxValue * 1.15)]}
            />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.18)", strokeWidth: 1, strokeDasharray: "3 3" }}
              content={<ChartTooltip format={(n) => formatAmount(n, 0)} />}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#ffffff"
              strokeWidth={1.75}
              fill="url(#spendFill)"
              animationDuration={1000}
              animationEasing="ease-out"
              dot={{ r: 0 }}
              activeDot={{
                r: 4,
                fill: "#ffffff",
                stroke: "#0a0a0a",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </SpotlightCard>
  );
};
