import { AnimatePresence, motion } from "framer-motion";
import { Check, CloudOff, Loader2, RefreshCcw } from "lucide-react";
import { useSync } from "@/lib/sync-status";
import { relativeTime } from "@/lib/date-utils";
import { spring } from "@/lib/motion";

const COPY = {
  synced: { label: "Saved", Icon: Check },
  saving: { label: "Saving", Icon: Loader2 },
  offline: { label: "Offline", Icon: CloudOff },
  error: { label: "Retrying", Icon: RefreshCcw },
} as const;

/**
 * Quiet confirmation that a log is safe.
 *
 * Offline and error both read as reassurance rather than alarm, because they
 * are: the write is already in the local cache and IndexedDB queue, and
 * Firestore replays it when the connection returns.
 */
export const SyncBadge = () => {
  const { state, lastSyncedAt } = useSync();
  const { label, Icon } = COPY[state];

  const title =
    state === "offline"
      ? "Offline — your entries are saved on this device and will sync automatically."
      : state === "error"
        ? "Couldn't reach the server. Your entries are saved locally and will retry."
        : lastSyncedAt
          ? `Last synced ${relativeTime(new Date(lastSyncedAt).toISOString())}`
          : "Everything is saved.";

  return (
    <div
      title={title}
      className="flex h-7 items-center gap-1.5 rounded-sm border border-white/10 bg-white/[0.03] px-2.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground backdrop-blur-sm transition-colors hover:border-white/20 hover:text-foreground"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={state}
          initial={{ opacity: 0, scale: 0.6, rotate: -25 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.6, rotate: 25 }}
          transition={spring.snappy}
          className="flex items-center"
        >
          <Icon className={`h-3 w-3 ${state === "saving" ? "animate-spin" : ""}`} />
        </motion.span>
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={label}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.18 }}
          className="mono-font hidden sm:inline"
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};
