import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { EVENT_TZ } from "./timezone";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Dates and times always read in Brussels time, never the viewer's own zone.
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: EVENT_TZ,
  });
}

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: EVENT_TZ,
  });
}

export function formatMoney(n: number | null | undefined): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
  }).format(n ?? 0);
}
