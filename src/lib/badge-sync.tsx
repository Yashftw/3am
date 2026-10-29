import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useExpenses } from "./expenses-context";
import { useDashboard, todosForDate } from "./dashboard-context";
import { toLocalISODate } from "./date-utils";
import {
  badgingSupported,
  clearBadge,
  ensureBadgePermission,
  isInstalled,
  loadBadgeMode,
  saveBadgeMode,
  setBadge,
  type BadgeMode,
} from "./app-badge";

interface BadgeContextValue {
  mode: BadgeMode;
  setMode: (mode: BadgeMode) => Promise<void>;
  supported: boolean;
  installed: boolean;
  /** What the icon is currently showing, for preview in Settings. */
  value: number | null;
}

const BadgeContext = createContext<BadgeContextValue | null>(null);

/**
 * Keeps the installed app's icon badge in step with live data.
 *
 * "budget" shows percent of the monthly pool consumed, which is the one
 * number that answers "how am I doing" without any context. "tasks" shows
 * today's outstanding items.
 */
export const BadgeProvider = ({ children }: { children: ReactNode }) => {
  const { monthTotal, spendingPool } = useExpenses();
  const { todos } = useDashboard();
  const [mode, setModeState] = useState<BadgeMode>(() => loadBadgeMode());

  const supported = badgingSupported();
  const installed = isInstalled();

  const pool = spendingPool;

  const value = useMemo(() => {
    if (mode === "off") return null;
    if (mode === "budget") {
      if (pool <= 0) return null;
      return Math.min(Math.round((monthTotal / pool) * 100), 999);
    }
    const open = todosForDate(todos, toLocalISODate()).filter((t) => !t.completed).length;
    return open > 0 ? open : null;
  }, [mode, pool, monthTotal, todos]);

  useEffect(() => {
    if (!supported) return;
    if (mode === "off") {
      void clearBadge();
      return;
    }
    void setBadge(value);
  }, [supported, mode, value]);

  const setMode = useCallback(async (next: BadgeMode) => {
    if (next !== "off") {
      const allowed = await ensureBadgePermission();
      if (!allowed) {
        // Without permission iOS silently drops the badge; better to stay off
        // than to show a toggle that claims to be on and does nothing.
        setModeState("off");
        saveBadgeMode("off");
        throw new Error("Notification permission is required for the icon badge.");
      }
    }
    setModeState(next);
    saveBadgeMode(next);
    if (next === "off") await clearBadge();
  }, []);

  const ctx = useMemo(
    () => ({ mode, setMode, supported, installed, value }),
    [mode, setMode, supported, installed, value],
  );

  return <BadgeContext.Provider value={ctx}>{children}</BadgeContext.Provider>;
};

export const useBadge = () => {
  const ctx = useContext(BadgeContext);
  if (!ctx) throw new Error("useBadge must be used within BadgeProvider");
  return ctx;
};
