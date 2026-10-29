import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type SyncState = "synced" | "saving" | "offline" | "error";

interface SyncContextValue {
  state: SyncState;
  pending: number;
  lastSyncedAt: number | null;
  isOnline: boolean;
  /**
   * Wraps a remote write so the UI can show it in flight and, crucially, so a
   * failure is surfaced instead of vanishing into console.error. The local
   * copy has already been written by the time this runs, so a rejection here
   * means "not yet in the cloud", never "lost".
   */
  track: <T>(op: () => Promise<T>) => Promise<T | undefined>;
  noteSynced: () => void;
}

const SyncContext = createContext<SyncContextValue | null>(null);

const LAST_SYNC_KEY = "3am:v1:lastSyncedAt";

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const [pending, setPending] = useState(0);
  const [errored, setErrored] = useState(false);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(() => {
    const raw = typeof window === "undefined" ? null : window.localStorage.getItem(LAST_SYNC_KEY);
    return raw ? Number(raw) : null;
  });

  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  useEffect(() => {
    const goOnline = () => { setIsOnline(true); setErrored(false); };
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const noteSynced = useCallback(() => {
    const now = Date.now();
    setLastSyncedAt(now);
    setErrored(false);
    try { window.localStorage.setItem(LAST_SYNC_KEY, String(now)); } catch { /* ignore */ }
  }, []);

  const track = useCallback(async <T,>(op: () => Promise<T>): Promise<T | undefined> => {
    setPending((n) => n + 1);
    try {
      const result = await op();
      if (mounted.current) noteSynced();
      return result;
    } catch (err) {
      console.error("[3am] Remote write failed; change is kept locally and will retry.", err);
      if (mounted.current) setErrored(true);
      return undefined;
    } finally {
      if (mounted.current) setPending((n) => Math.max(0, n - 1));
    }
  }, [noteSynced]);

  const state: SyncState = !isOnline ? "offline" : pending > 0 ? "saving" : errored ? "error" : "synced";

  const value = useMemo(
    () => ({ state, pending, lastSyncedAt, isOnline, track, noteSynced }),
    [state, pending, lastSyncedAt, isOnline, track, noteSynced],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

export const useSync = () => {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used within SyncProvider");
  return ctx;
};
