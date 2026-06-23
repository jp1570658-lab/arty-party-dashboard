// String-enum value sets + display labels.
// SQLite can't store Prisma enums, so these are the source of truth.

export const EVENT_STATUSES = [
  "CONCEPT",
  "PLANNING",
  "CONFIRMED",
  "BUILD_UP",
  "LIVE",
  "WRAP_UP",
  "COMPLETED",
  "ARCHIVED",
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  CONCEPT: "Concept",
  PLANNING: "Planning",
  CONFIRMED: "Confirmed",
  BUILD_UP: "Build-up",
  LIVE: "Live",
  WRAP_UP: "Wrap-up",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

// Tailwind classes for each status badge
export const EVENT_STATUS_STYLES: Record<EventStatus, string> = {
  CONCEPT: "bg-surface-2 text-ink-secondary",
  PLANNING: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  CONFIRMED: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  BUILD_UP: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  LIVE: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  WRAP_UP: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  ARCHIVED: "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export const ARTIST_CATEGORIES = [
  "POET",
  "PAINTER",
  "DANCER",
  "SINGER",
  "INSTRUMENTALIST",
  "PHOTOGRAPHER",
  "SCULPTOR",
  "VIDEOGRAPHER",
  "DJ",
  "OTHER",
] as const;
export type ArtistCategory = (typeof ARTIST_CATEGORIES)[number];

export const ARTIST_CATEGORY_LABELS: Record<ArtistCategory, string> = {
  POET: "Poet",
  PAINTER: "Painter",
  DANCER: "Dancer",
  SINGER: "Singer",
  INSTRUMENTALIST: "Instrumentalist",
  PHOTOGRAPHER: "Photographer",
  SCULPTOR: "Sculptor",
  VIDEOGRAPHER: "Videographer",
  DJ: "DJ",
  OTHER: "Other",
};

export const ARTIST_SUBCATEGORIES: Record<string, string[]> = {
  SINGER: ["Acapella", "Rap/Hip-Hop", "R&B", "Other"],
  INSTRUMENTALIST: [
    "Guitar",
    "Piano",
    "Violin",
    "Flute",
    "Trumpet",
    "Drums",
    "Bass",
    "Other",
  ],
  PHOTOGRAPHER: ["Event", "Portrait", "Fine Art"],
  VIDEOGRAPHER: ["Event", "Documentary", "Reel"],
};

export const TEAM_TYPES = [
  "PLANNING",
  "BUILD_BREAKDOWN",
  "MEDIA",
  "ARTIST",
] as const;
export type TeamType = (typeof TEAM_TYPES)[number];

export const TEAM_TYPE_LABELS: Record<TeamType, string> = {
  PLANNING: "Planning team",
  BUILD_BREAKDOWN: "Build-up & Breakdown",
  MEDIA: "Media team",
  ARTIST: "Artists",
};

export const TEAM_MEMBER_STATUSES = ["confirmed", "tentative", "not_asked"] as const;
export type TeamMemberStatus = (typeof TEAM_MEMBER_STATUSES)[number];

export const TEAM_STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  tentative: "Tentative",
  not_asked: "Not asked",
  pending: "Not asked",
};

export const TEAM_STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  tentative: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  not_asked: "bg-surface-2 text-ink-secondary",
  pending: "bg-surface-2 text-ink-secondary",
};

export const MEDIA_TYPES = ["PHOTO", "VIDEO", "DOCUMENT"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const INVITE_STATUSES = ["pending", "sent", "confirmed", "declined"] as const;
export const INVITE_STATUS_LABELS: Record<string, string> = {
  pending: "Not sent",
  sent: "Sent",
  confirmed: "Confirmed",
  declined: "Declined",
};

export const PARTNER_TYPES = ["sponsor", "venue", "brand", "media partner"] as const;

export const BUDGET_CATEGORIES = [
  "Venue",
  "Sound & Technical",
  "Artists/Performers",
  "Materials",
  "Printing",
  "Team",
  "Catering",
  "Photography/Video",
  "Miscellaneous",
] as const;
