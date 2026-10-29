/**
 * Date helpers.
 *
 * The app previously mixed `new Date().toISOString().split("T")[0]` (UTC) with
 * a timezone-corrected local variant. For anyone east of UTC that meant tasks
 * logged in the evening were filed under tomorrow, and "today" disagreed
 * between the dashboard and the expense page. Everything now goes through
 * these helpers so a day boundary means the same thing everywhere.
 */

/** Local calendar date as YYYY-MM-DD. */
export function toLocalISODate(d: Date = new Date()): string {
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split("T")[0];
}

/** Local calendar month as YYYY-MM. */
export function toLocalMonthKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Turn an ISO timestamp (or date) into its local YYYY-MM-DD. */
export function isoToLocalDate(iso: string): string {
  if (!iso) return "";
  // Bare dates are already calendar dates — reparsing them as UTC shifts them.
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : toLocalISODate(d);
}

/** True if an ISO timestamp falls on the given local calendar date. */
export function isOnLocalDate(iso: string | undefined, date: string): boolean {
  if (!iso) return false;
  return isoToLocalDate(iso) === date;
}

/** The last `count` local dates, oldest first, ending today. */
export function lastNDates(count: number, from: Date = new Date()): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(from);
    d.setDate(d.getDate() - (count - 1 - i));
    return toLocalISODate(d);
  });
}

/** Previous month key relative to `d`, e.g. 2026-09 -> 2026-08. */
export function previousMonthKey(d: Date = new Date()): string {
  const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return toLocalMonthKey(prev);
}

/** Shift a YYYY-MM key by `delta` months. */
export function shiftMonthKey(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  return toLocalMonthKey(new Date(y, m - 1 + delta, 1));
}

/** "September 2026" from "2026-09". */
export function formatMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return monthKey;
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** Number of days in the month described by a YYYY-MM key. */
export function daysInMonthKey(monthKey: string): number {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

/** Every local date inside a YYYY-MM key, oldest first. */
export function datesInMonth(monthKey: string): string[] {
  const total = daysInMonthKey(monthKey);
  return Array.from({ length: total }, (_, i) => `${monthKey}-${String(i + 1).padStart(2, "0")}`);
}

/** Days elapsed in the month so far (the full month if it is already past). */
export function daysElapsedInMonth(monthKey: string, now: Date = new Date()): number {
  const current = toLocalMonthKey(now);
  if (monthKey < current) return daysInMonthKey(monthKey);
  if (monthKey > current) return 0;
  return now.getDate();
}

/** "just now" / "12m ago" / "3h ago" / "Sep 04". */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.floor((Date.now() - then) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}
