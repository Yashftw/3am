/**
 * App icon badge.
 *
 * The Badging API is the only home-screen surface a web app can actually
 * write to. On an installed PWA it puts a number on the launcher icon, so
 * "how much of my budget is gone" is readable without opening anything.
 *
 * Support is uneven and worth stating plainly:
 *   - iOS 16.4+  : works, but only for an installed PWA *and* only after
 *                  notification permission has been granted.
 *   - Windows    : works for an installed PWA.
 *   - Android    : Chromium does not implement it. Android derives a badge
 *                  from unread notifications instead, so nothing we call
 *                  here has any effect.
 *   - Desktop    : works in Chrome/Edge for installed apps.
 *
 * Everything below degrades to a no-op rather than throwing.
 */

const PREF_KEY = "3am:v1:badge";

export type BadgeMode = "off" | "budget" | "tasks";

/**
 * True when the browser exposes the API at all.
 *
 * The DOM lib declares setAppBadge as always present, which is wrong at
 * runtime, so the check is a property probe rather than a type guard.
 */
export function badgingSupported(): boolean {
  if (typeof navigator === "undefined") return false;
  return "setAppBadge" in navigator && typeof navigator.setAppBadge === "function";
}

/** True when the page is running as an installed app rather than a tab. */
export function isInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    // iOS Safari's own flag, which predates display-mode.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function loadBadgeMode(): BadgeMode {
  try {
    const raw = window.localStorage.getItem(PREF_KEY);
    return raw === "budget" || raw === "tasks" || raw === "off" ? raw : "off";
  } catch {
    return "off";
  }
}

export function saveBadgeMode(mode: BadgeMode) {
  try {
    window.localStorage.setItem(PREF_KEY, mode);
  } catch {
    /* storage blocked */
  }
}

/**
 * iOS gates the badge behind notification permission. Returns true when the
 * badge is allowed to show.
 */
export async function ensureBadgePermission(): Promise<boolean> {
  if (typeof Notification === "undefined") return badgingSupported();
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

export async function setBadge(count: number | null) {
  if (!badgingSupported()) return;
  try {
    if (count === null || count <= 0) {
      await navigator.clearAppBadge();
    } else {
      // Badges are integers; anything else is silently coerced by the UA.
      await navigator.setAppBadge(Math.round(count));
    }
  } catch {
    // Permission revoked mid-session, or the UA changed its mind. A badge is
    // never important enough to surface an error for.
  }
}

export async function clearBadge() {
  if (!badgingSupported()) return;
  try {
    await navigator.clearAppBadge();
  } catch {
    /* no-op */
  }
}
