import { z } from "zod";
import { EVENT_STATUSES } from "./enums";

// Combine a yyyy-mm-dd date with an optional hh:mm time into an ISO string.
export function combineDateTime(date: string, time?: string): string {
  if (!date) return "";
  const t = time && time.length ? time : "00:00";
  return new Date(`${date}T${t}`).toISOString();
}

export const eventCreateSchema = z.object({
  name: z.string().min(2, "Give the event a name"),
  date: z.string().min(1, "Pick a date").refine((v) => !isNaN(Date.parse(v)), "Invalid date"),
  buildUpTime: z.string().optional().nullable(),
  breakdownTime: z.string().optional().nullable(),
  location: z.string().min(2, "Where is it happening?"),
  venueNotes: z.string().optional().nullable(),
  capacity: z.coerce.number().int().positive().optional().nullable(),
  theme: z.string().optional().nullable(),
  themeNotes: z.string().optional().nullable(),
});

export const eventUpdateSchema = eventCreateSchema.partial().extend({
  status: z.enum(EVENT_STATUSES).optional(),
  actualAttendees: z.coerce.number().int().nonnegative().optional().nullable(),
});

export type EventCreateInput = z.infer<typeof eventCreateSchema>;

// Wizard step schemas (client-side validation per step)
export const wizardStep1Schema = z.object({
  name: z.string().min(2, "Give the event a name"),
  dateOnly: z.string().min(1, "Pick a date"),
  startTime: z.string().optional(),
  buildUpTimeOnly: z.string().optional(),
  breakdownTimeOnly: z.string().optional(),
});

export const wizardStep2Schema = z.object({
  location: z.string().min(2, "Where is it happening?"),
  venueNotes: z.string().optional(),
  capacity: z.string().optional(),
});

export const wizardStep3Schema = z.object({
  theme: z.string().optional(),
  themeNotes: z.string().optional(),
});
