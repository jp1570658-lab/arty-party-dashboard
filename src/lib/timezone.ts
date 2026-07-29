import { TZDate } from "@date-fns/tz";

/**
 * Arty-Party runs in Brussels. Timestamps are stored as UTC instants, but every
 * date and time a human types or reads is Brussels wall-clock time.
 *
 * This matters in two places that were previously wrong:
 *  - The server runs in UTC on Vercel, so `toISOString().slice(0,10)` gave the
 *    UTC day. For anything starting after ~22:00 Brussels time in summer that
 *    is the *previous* day, so run-of-show and logistics rows landed a day off.
 *  - Formatting fell back to the viewer's own timezone, so the same event
 *    showed different times to someone travelling.
 *
 * Everything that pairs a "yyyy-mm-dd" with an "HH:MM" must go through here.
 */
export const EVENT_TZ = "Europe/Brussels";

/** yyyy-mm-dd of an instant, in Brussels. */
export function zonedDateKey(date: Date | string): string {
  const d = new TZDate(new Date(date), EVENT_TZ);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** HH:MM of an instant, in Brussels — for populating <input type="time">. */
export function zonedTimeKey(date: Date | string): string {
  const d = new TZDate(new Date(date), EVENT_TZ);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * A Brussels wall-clock date + time → the UTC instant it refers to.
 * DST-correct: 02:30 on a spring-forward day resolves the way TZDate does.
 */
export function zonedToUtc(dateKey: string, timeKey?: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [hh, mm] = (timeKey && timeKey.length ? timeKey : "00:00").split(":").map(Number);
  return new Date(
    new TZDate(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0, EVENT_TZ).getTime()
  );
}

/** Same, returning an ISO string — the common case for API payloads. */
export function zonedToIso(dateKey: string, timeKey?: string): string {
  return zonedToUtc(dateKey, timeKey).toISOString();
}

/** Shift an instant by whole days, keeping the Brussels wall-clock time. */
export function addZonedDays(date: Date, days: number): Date {
  const d = new TZDate(new Date(date), EVENT_TZ);
  d.setDate(d.getDate() + days);
  return new Date(d.getTime());
}
