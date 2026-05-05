import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useExpenses, CATEGORIES } from "@/lib/expenses-context";
import { toast } from "sonner";

export const AddExpenseForm = () => {
  const { addExpense } = useExpenses();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    addExpense({
      amount: amountNum,
      category,
      note,
      date,
    });

    toast.success("Expense added");
    setAmount("");
    setNote("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="bg-[#121212] border border-white/5 rounded-sm shadow-sm overflow-hidden"
    >
      <div className="px-6 md:px-8 py-6 border-b border-white/5">
        <h2 className="font-display text-xl">New Expense</h2>
        <p className="text-xs text-muted-foreground mt-1">Quick Add</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 sm:col-span-2">
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono bg-[#1a1a1a] border-white/10 h-10"
              required
            />
          </div>

          <div className="col-span-12 sm:col-span-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="flex h-10 w-full rounded-sm border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-white/20 text-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-12 sm:col-span-4">
            <Input
              type="text"
              placeholder="Note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-[#1a1a1a] border-white/10 h-10"
            />
          </div>

          <div className="col-span-12 sm:col-span-2">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="font-mono bg-[#1a1a1a] border-white/10 h-10"
              required
            />
          </div>

          <div className="col-span-12 sm:col-span-1">
            <Button type="submit" className="w-full gap-2">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  );
};
