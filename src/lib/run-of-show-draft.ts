// Turning the model's JSON into RunOfShowItem rows. Kept separate from the
// route because AI output is the least predictable input in the app — this is
// the part worth being strict about.

export interface DraftItem {
  time?: string; // "HH:MM"
  duration?: number | null;
  item?: string;
  owner?: string | null;
  location?: string | null;
  notes?: string | null;
}

export interface DraftRow {
  time: Date;
  duration: number | null;
  item: string;
  owner: string | null;
  location: string | null;
  notes: string | null;
  order: number;
}

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

function text(v: unknown, max: number): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
}

/**
 * Filters a model draft down to rows we can trust, on the given event day.
 * Anything without a valid 24-hour time or a non-empty item is dropped rather
 * than guessed at.
 */
export function draftToRows(draft: unknown, eventDay: string): DraftRow[] {
  if (!Array.isArray(draft)) return [];

  return draft
    .filter((d): d is DraftItem => !!d && typeof d === "object")
    .map((d) => {
      const time = typeof d.time === "string" ? d.time.trim() : "";
      const match = TIME_RE.exec(time);
      const item = text(d.item, 200);
      if (!match || !item) return null;

      const hh = match[1].padStart(2, "0");
      const parsed = new Date(`${eventDay}T${hh}:${match[2]}:00`);
      if (Number.isNaN(parsed.getTime())) return null;

      const duration =
        typeof d.duration === "number" && Number.isFinite(d.duration) && d.duration > 0
          ? Math.round(d.duration)
          : null;

      return {
        time: parsed,
        duration,
        item,
        owner: text(d.owner, 80),
        location: text(d.location, 80),
        notes: text(d.notes, 300),
      };
    })
    .filter((r): r is Omit<DraftRow, "order"> => r !== null)
    .sort((a, b) => a.time.getTime() - b.time.getTime())
    .map((r, i) => ({ ...r, order: i }));
}
