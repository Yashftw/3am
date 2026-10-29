/**
 * Offline-first mirror for everything the user logs.
 *
 * Firestore is the source of truth across devices, but it is never the only
 * copy. Every mutation is written to localStorage synchronously in the same
 * tick, and every context hydrates from localStorage *before* it ever touches
 * the network. A dead connection, an expired session, a cold PWA start or a
 * Firestore outage can no longer produce an empty dashboard.
 *
 * Deletes are recorded as tombstones so a document that was removed while
 * offline cannot be resurrected by a later snapshot from another tab.
 */

const NAMESPACE = "3am:v1";
const TOMBSTONE_TTL_MS = 120 * 24 * 60 * 60 * 1000; // 120 days

type Scope = string;

const memoryFallback = new Map<string, string>();

/** Safari private mode and locked-down browsers throw on localStorage access. */
function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memoryFallback.get(key) ?? null;
  }
}

function writeRaw(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Quota exceeded or storage blocked — keep the session alive in memory.
    memoryFallback.set(key, value);
  }
}

function keyFor(scope: Scope, uid?: string | null) {
  return `${NAMESPACE}:${uid || "anon"}:${scope}`;
}

export function loadLocal<T>(scope: Scope, uid: string | null | undefined, fallback: T): T {
  const raw = readRaw(keyFor(scope, uid));
  if (raw === null) return fallback;
  try {
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function saveLocal<T>(scope: Scope, uid: string | null | undefined, value: T) {
  try {
    writeRaw(keyFor(scope, uid), JSON.stringify(value));
  } catch {
    /* value could not be serialised — nothing useful to do */
  }
}

/* ------------------------------------------------------------------ */
/* Tombstones                                                          */
/* ------------------------------------------------------------------ */

type Tombstones = Record<string, number>;

function tombstoneScope(scope: Scope) {
  return `${scope}::deleted`;
}

export function loadTombstones(scope: Scope, uid: string | null | undefined): Tombstones {
  const all = loadLocal<Tombstones>(tombstoneScope(scope), uid, {});
  const cutoff = Date.now() - TOMBSTONE_TTL_MS;
  let pruned = false;
  for (const id of Object.keys(all)) {
    if (all[id] < cutoff) {
      delete all[id];
      pruned = true;
    }
  }
  if (pruned) saveLocal(tombstoneScope(scope), uid, all);
  return all;
}

export function addTombstone(scope: Scope, uid: string | null | undefined, id: string) {
  const all = loadTombstones(scope, uid);
  all[id] = Date.now();
  saveLocal(tombstoneScope(scope), uid, all);
}

/* ------------------------------------------------------------------ */
/* Merging                                                             */
/* ------------------------------------------------------------------ */

export interface Identified {
  id: string;
}

/**
 * Union a remote snapshot with whatever is cached locally.
 *
 * Remote wins for any document both sides know about. Local-only documents are
 * kept — they are almost always writes that have not round-tripped yet, and
 * dropping them is exactly the data loss this module exists to prevent.
 * Anything tombstoned is excluded from both sides.
 */
export function mergeById<T extends Identified>(
  local: T[],
  remote: T[],
  tombstones: Tombstones,
): T[] {
  const byId = new Map<string, T>();
  for (const item of local) {
    if (!item?.id || tombstones[item.id]) continue;
    byId.set(item.id, item);
  }
  for (const item of remote) {
    if (!item?.id || tombstones[item.id]) continue;
    byId.set(item.id, item);
  }
  return Array.from(byId.values());
}

/** Clear every cached collection for a user (used on explicit sign-out). */
export function clearLocalScope(uid: string | null | undefined) {
  const prefix = `${NAMESPACE}:${uid || "anon"}:`;
  try {
    const doomed: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(prefix)) doomed.push(key);
    }
    doomed.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* storage unavailable */
  }
}
