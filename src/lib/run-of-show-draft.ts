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

const NOON = 12 * 60;

/**
 * Filters a model draft down to rows we can trust, anchored to the event day.
 * Anything without a valid 24-hour time or a non-empty item is dropped rather
 * than guessed at.
 *
 * These events run past midnight, so a bare "02:00" belongs to the *end* of the
 * night, not the start of it. Walking the model's own ordering and rolling onto
 * the next calendar day whenever the clock wraps (evening → early morning)
 * keeps breakdown after doors instead of sorting it to the top. A backwards
 * step that isn't a wrap — 20:00 listed after 21:00 — is treated as the model
 * mis-ordering itself and is simply re-sorted.
 */
export function draftToRows(draft: unknown, eventDay: string): DraftRow[] {
  if (!Array.isArray(draft)) return [];

  const parsed = draft
    .filter((d): d is DraftItem => !!d && typeof d === "object")
    .map((d) => {
      const time = typeof d.time === "string" ? d.time.trim() : "";
      const match = TIME_RE.exec(time);
      const item = text(d.item, 200);
      if (!match || !item) return null;

      const hours = Number(match[1]);
      const minutes = Number(match[2]);
      const duration =
        typeof d.duration === "number" && Number.isFinite(d.duration) && d.duration > 0
          ? Math.round(d.duration)
          : null;

      return {
        minutesOfDay: hours * 60 + minutes,
        hours,
        minutes,
        duration,
        item,
        owner: text(d.owner, 80),
        location: text(d.location, 80),
        notes: text(d.notes, 300),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  let dayOffset = 0;
  let previous = -1;

  const dated = parsed.map((p) => {
    if (previous >= NOON && p.minutesOfDay < NOON && p.minutesOfDay < previous) {
      dayOffset += 1;
    }
    previous = p.minutesOfDay;

    const time = new Date(
      `${eventDay}T${String(p.hours).padStart(2, "0")}:${String(p.minutes).padStart(2, "0")}:00`
    );
    if (Number.isNaN(time.getTime())) return null;
    time.setDate(time.getDate() + dayOffset);

    return {
      time,
      duration: p.duration,
      item: p.item,
      owner: p.owner,
      location: p.location,
      notes: p.notes,
    };
  });

  return dated
    .filter((r): r is Omit<DraftRow, "order"> => r !== null)
    .sort((a, b) => a.time.getTime() - b.time.getTime())
    .map((r, i) => ({ ...r, order: i }));
}
