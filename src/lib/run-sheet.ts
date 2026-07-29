// Internal event call sheet ("run sheet") — the operational who/what/when
// document JP and the crew work from, shared read-only with venue and vendors.
//
// Structure follows the film/TV call sheet standard, trimmed to live events:
// header block (event, date, venue, key times) → schedule grid → key contacts
// → location/address → emergency line. No scene breakdowns or walkie channels.

import { randomUUID } from "crypto";
import { prisma } from "./db";

export interface KeyContact {
  name: string;
  role: string;
  phone: string;
}

export function parseKeyContacts(value: unknown): KeyContact[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
    .map((c) => ({
      name: String(c.name ?? ""),
      role: String(c.role ?? ""),
      phone: String(c.phone ?? ""),
    }))
    .filter((c) => c.name || c.role || c.phone);
}

/** Fetch the event's call sheet, creating it (and its share token) on demand. */
export async function ensureRunSheet(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, location: true },
  });
  if (!event) return null;

  const existing = await prisma.eventCallSheet.findUnique({ where: { eventId } });
  if (existing) return existing;

  return prisma.eventCallSheet.create({
    data: {
      eventId,
      shareToken: randomUUID(),
      // Seed the address from the venue so the sheet is useful immediately.
      address: event.location,
    },
  });
}

export function runSheetPath(shareToken: string): string {
  return `/run-sheet/${shareToken}`;
}
