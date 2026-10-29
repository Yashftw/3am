import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Trash2, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useExpenses, CATEGORIES, type Expense } from "@/lib/expenses-context";
import { useCurrency } from "@/lib/currency-context";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { relativeTime, toLocalISODate } from "@/lib/date-utils";
import { spring, tap } from "@/lib/motion";
import { toast } from "sonner";

const categoryColor = (name: string) =>
  CATEGORIES.find((c) => c.name === name)?.color ?? "hsl(0 0% 50%)";

/** "Today" / "Yesterday" / "Mon, Sep 15" — a date you can read at a glance. */
function dayHeading(iso: string): string {
  const today = toLocalISODate();
  if (iso === today) return "Today";

  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (iso === toLocalISODate(y)) return "Yesterday";

  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

interface DayGroup {
  date: string;
  heading: string;
  total: number;
  rows: Expense[];
}

export const ExpenseList = () => {
  const { expenses, removeExpense } = useExpenses();
  const { formatAmount } = useCurrency();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { groups, matchCount } = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = expenses.filter((e) => {
      if (activeCategory && e.category !== activeCategory) return false;
      if (!q) return true;
      return (
        e.category.toLowerCase().includes(q) ||
        (e.note ?? "").toLowerCase().includes(q) ||
        String(e.amount).includes(q)
      );
    });

    // Newest day first; within a day, largest first so the damage is obvious.
    const byDay = new Map<string, Expense[]>();
    for (const e of filtered) {
      const list = byDay.get(e.date);
      if (list) list.push(e);
      else byDay.set(e.date, [e]);
    }

    const out: DayGroup[] = Array.from(byDay.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, rows]) => ({
        date,
        heading: dayHeading(date),
        total: rows.reduce((s, e) => s + e.amount, 0),
        rows: [...rows].sort((a, b) => b.amount - a.amount),
      }));

    return { groups: out, matchCount: filtered.length };
  }, [expenses, search, activeCategory]);

  const handleDelete = (e: Expense) => {
    removeExpense(e.id);
    toast.success("Expense removed", { description: `${formatAmount(e.amount, 0)} · ${e.category}` });
  };

  const filtering = Boolean(search.trim() || activeCategory);
  const usedCategories = useMemo(
    () => CATEGORIES.filter((c) => expenses.some((e) => e.category === c.name)),
    [expenses],
  );

  return (
    <SpotlightCard className="h-full rounded-sm" reveal delay={0.1}>
      <div className="space-y-4 border-b border-white/5 px-6 py-5 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-xl">Transactions</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {filtering ? `${matchCount} of ${expenses.length}` : `${expenses.length}`} entries
            </p>
          </div>

          <div className="relative w-full md:w-60">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="hud-input h-9 w-full pl-9 pr-8 text-sm"
              aria-label="Search transactions"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground transition-colors hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Category filter */}
        {usedCategories.length > 1 && (
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 border px-2.5 py-1 text-[11px] transition-colors ${
                activeCategory === null
                  ? "border-white/40 bg-white/[0.08] text-white"
                  : "border-white/10 text-muted-foreground hover:border-white/25 hover:text-white"
              }`}
            >
              All
            </button>
            {usedCategories.map((cat) => {
              const selected = activeCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setActiveCategory(selected ? null : cat.name)}
                  className={`flex shrink-0 items-center gap-1.5 border px-2.5 py-1 text-[11px] transition-colors ${
                    selected
                      ? "border-white/40 bg-white/[0.08] text-white"
                      : "border-white/10 text-muted-foreground hover:border-white/25 hover:text-white"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="max-h-[560px] overflow-y-auto">
        {groups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-6 py-16 text-center md:px-8"
          >
            <p className="text-sm text-muted-foreground">
              {expenses.length === 0 ? "Nothing logged yet." : "Nothing matches that filter."}
            </p>
            {expenses.length === 0 && (
              <p className="mono-font mt-2 text-[11px] uppercase tracking-wider text-white/25">
                Press N to add your first
              </p>
            )}
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {groups.map((group) => (
              <motion.section
                key={group.date}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                transition={spring.gentle}
              >
                {/* Day header with its subtotal */}
                <div className="sticky top-0 z-10 flex items-baseline justify-between border-y border-white/5 bg-[#0d0d0d]/94 px-6 py-2 backdrop-blur-md md:px-8">
                  <span className="mono-font text-[10px] uppercase tracking-[0.18em] text-white/70">
                    {group.heading}
                  </span>
                  <span className="mono-font text-[11px] tabular-nums text-muted-foreground">
                    {formatAmount(group.total, 0)}
                  </span>
                </div>

                <AnimatePresence initial={false}>
                  {group.rows.map((expense) => (
                    <motion.div
                      key={expense.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 28, height: 0, transition: { duration: 0.2 } }}
                      transition={spring.gentle}
                      className="group flex items-center gap-3 border-b border-white/[0.04] px-6 py-3 transition-colors hover:bg-white/[0.035] md:px-8"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full transition-shadow group-hover:shadow-[0_0_10px_currentColor]"
                        style={{
                          backgroundColor: categoryColor(expense.category),
                          color: categoryColor(expense.category),
                        }}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-white">
                          {expense.note || expense.category}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {expense.note ? expense.category : "No note"}
                          {expense.createdAt && ` · ${relativeTime(expense.createdAt)}`}
                        </p>
                      </div>

                      <span className="mono-font shrink-0 text-sm tabular-nums text-white">
                        {formatAmount(expense.amount, 0)}
                      </span>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <motion.button
                            type="button"
                            whileTap={tap}
                            aria-label={`Remove ${expense.category} expense`}
                            className="shrink-0 p-1.5 text-white/25 opacity-0 transition-all hover:bg-white/10 hover:text-white focus-visible:opacity-100 group-hover:opacity-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </motion.button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove this expense?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {formatAmount(expense.amount, 2)} · {expense.category}
                              {expense.note ? ` · ${expense.note}` : ""} on {group.heading.toLowerCase()}.
                              This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(expense)}>
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.section>
            ))}
          </AnimatePresence>
        )}
      </div>
    </SpotlightCard>
  );
};
