import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useExpenses, CATEGORIES } from "@/lib/expenses-context";
import { useCurrency } from "@/lib/currency-context";
import { toast } from "sonner";

export const ExpenseList = () => {
  const { expenses, removeExpense } = useExpenses();
  const { formatAmount } = useCurrency();

  const handleDelete = (id: string) => {
    removeExpense(id);
    toast.success("Expense removed");
  };

  const getCategoryColor = (category: string) => {
    return CATEGORIES.find((c) => c.name === category)?.color ?? "hsl(0 0% 50%)";
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-[#121212] border border-white/5 rounded-sm shadow-sm overflow-hidden"
    >
      <div className="px-6 md:px-8 py-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#121212]/95 backdrop-blur z-10">
        <div>
          <h2 className="font-display text-xl">Transactions</h2>
          <p className="text-xs text-muted-foreground mt-1">Recent</p>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{expenses.length} entries</span>
      </div>

      <div className="max-h-[480px] overflow-y-auto">
        {expenses.length === 0 ? (
          <div className="px-6 md:px-8 py-12 text-center text-muted-foreground">
            No expenses yet. Add one above.
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-[73px] bg-[#121212]/95 backdrop-blur z-10">
              <tr className="text-xs text-muted-foreground border-b border-white/5">
                <th className="text-left px-6 md:px-8 py-4 font-normal">Category</th>
                <th className="text-left px-4 py-4 font-normal">Note</th>
                <th className="text-right px-4 py-4 font-normal">Date</th>
                <th className="text-right px-4 py-4 font-normal">Amount</th>
                <th className="text-right px-6 md:px-8 py-4 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense, i) => (
                <motion.tr
                  key={expense.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 * Math.min(i, 10) }}
                  className="border-t border-white/5 hover:bg-white/5 transition-colors group"
                >
                  <td className="px-6 md:px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: getCategoryColor(expense.category) }}
                      />
                      <span className="text-sm">{expense.category}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground truncate max-w-[200px]">
                    {expense.note || "—"}
                  </td>
                  <td className="text-right px-4 py-4 font-mono text-sm text-muted-foreground">
                    {formatDate(expense.date)}
                  </td>
                  <td className="text-right px-4 py-4 font-mono text-sm text-foreground">
                    {formatAmount(expense.amount, 2)}
                  </td>
                  <td className="text-right px-6 md:px-8 py-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove expense?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this {formatAmount(expense.amount, 2)} {expense.category} expense.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(expense.id)}>
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
};
