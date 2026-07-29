// Artist call sheet — shared constants between the public form, the API and
// the dashboard. One shared link per event; artists are told apart by name.

/** Hard limit for both Promo Media and Materials uploads. */
export const MAX_UPLOAD_BYTES = 65 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = "65MB";

/** Promo media: images, video, audio. */
export const PROMO_MEDIA_ACCEPT = "image/*,video/*,audio/*";
/** Materials: songs, poems, sound files, briefs. */
export const MATERIALS_ACCEPT =
  "audio/*,application/pdf,.doc,.docx,.txt,.rtf,image/*,video/*";

const DOC_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/rtf",
  "application/rtf",
];

function isMediaMime(mime: string) {
  return (
    mime.startsWith("image/") || mime.startsWith("video/") || mime.startsWith("audio/")
  );
}

/** Server-side type gate. `kind` mirrors the two upload fields on the form. */
export function isAllowedUpload(kind: "promo" | "materials", mime: string): boolean {
  if (kind === "promo") return isMediaMime(mime);
  return isMediaMime(mime) || DOC_MIMES.includes(mime);
}

/* ---------- Theme palettes ---------- */

export interface CallSheetPalette {
  key: string;
  label: string;
  /** Accent used for headings, buttons and rules. */
  accent: string;
  /** Tint behind the page — pairs with `accent`. */
  tint: string;
  /** Ink colour on top of `accent`. */
  onAccent: string;
}

export const CALL_SHEET_PALETTES: CallSheetPalette[] = [
  { key: "brand", label: "Arty-Party purple", accent: "#7C3AED", tint: "#F5F3FF", onAccent: "#FFFFFF" },
  { key: "sunset", label: "Sunset orange", accent: "#D85A30", tint: "#FFF4ED", onAccent: "#FFFFFF" },
  { key: "bloom", label: "Bloom pink", accent: "#D4537E", tint: "#FEF1F5", onAccent: "#FFFFFF" },
  { key: "forest", label: "Forest green", accent: "#059669", tint: "#ECFDF5", onAccent: "#FFFFFF" },
  { key: "midnight", label: "Midnight blue", accent: "#1D4ED8", tint: "#EFF4FF", onAccent: "#FFFFFF" },
  { key: "clay", label: "Clay amber", accent: "#B45309", tint: "#FFFBEB", onAccent: "#FFFFFF" },
  { key: "ink", label: "Ink charcoal", accent: "#374151", tint: "#F5F6F7", onAccent: "#FFFFFF" },
];

export const DEFAULT_PALETTE = CALL_SHEET_PALETTES[0];

export function resolvePalette(key: string | null | undefined): CallSheetPalette {
  return CALL_SHEET_PALETTES.find((p) => p.key === key) ?? DEFAULT_PALETTE;
}

export const CALL_SHEET_PALETTE_KEYS = CALL_SHEET_PALETTES.map((p) => p.key);

/* ---------- Identity ---------- */

/** Match key for "latest wins" — same artist name, case/spacing insensitive. */
export function artistNameKey(artistName: string): string {
  return artistName.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Public URL of the shared call sheet link for an event. */
export function callSheetPath(eventId: string): string {
  return `/call-sheet/${eventId}`;
}
