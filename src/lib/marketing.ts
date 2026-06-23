import { subDays } from "date-fns";

export interface Milestone {
  offset: number; // days before event
  label: string;
  date: Date;
}

/** Backward-planning marketing milestones from the event date. */
export function backwardTimeline(eventDate: Date): Milestone[] {
  const make = (offset: number, label: string): Milestone => ({
    offset,
    label,
    date: subDays(eventDate, offset),
  });
  return [
    make(28, "Design deadline (posters + flyers)"),
    make(21, "Print deadline · posters go up"),
    make(14, "Flyer distribution · online campaign launch"),
    make(7, "Second wave posts"),
    make(3, "Final online reminder (story + feed)"),
    make(0, "Event day"),
  ];
}

/** Suggested values for the four editable deadline fields. */
export function suggestedDeadlines(eventDate: Date) {
  return {
    posterDeadline: subDays(eventDate, 28),
    flyerPrintDeadline: subDays(eventDate, 21),
    flyerDistributionDate: subDays(eventDate, 14),
    onlinePostStart: subDays(eventDate, 14),
  };
}
