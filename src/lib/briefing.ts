// Artist Briefing — data assembly only.
//
// This layer turns (event + one call sheet submission) into a plain structured
// object. Nothing here knows about React, PDF or email: the web view
// (src/app/events/[id]/briefing/[submissionId]) and the PDF route both render
// from `BriefingData`, so a third output (plain-text email) is a new renderer,
// not a rewrite.

import type { CallSheetSubmission, Event } from "@prisma/client";
import { formatDate, formatTime } from "./utils";

export interface BriefingLine {
  label: string;
  value: string;
}

export interface BriefingSection {
  heading: string;
  lines: BriefingLine[];
  /** Long-form blocks rendered as paragraphs rather than label/value rows. */
  blocks?: { label: string; text: string }[];
}

export interface BriefingData {
  /** `Arty-Party — [Event Name] — Artist Briefing` */
  title: string;
  artistName: string;
  contactName: string;
  email: string;
  eventName: string;
  sections: BriefingSection[];
  /** Links the artist supplied — surfaced separately so renderers can anchor them. */
  links: { label: string; href: string }[];
  generatedAt: Date;
}

const DASH = "—";

function line(label: string, value: string | null | undefined): BriefingLine | null {
  const v = (value ?? "").toString().trim();
  return v ? { label, value: v } : null;
}

function compact(items: (BriefingLine | null)[]): BriefingLine[] {
  return items.filter((i): i is BriefingLine => i !== null);
}

export function buildBriefing(
  event: Pick<
    Event,
    "name" | "date" | "location" | "venueNotes" | "theme" | "themeNotes" | "buildUpTime" | "breakdownTime"
  >,
  submission: CallSheetSubmission
): BriefingData {
  const eventSection: BriefingSection = {
    heading: "The event",
    lines: compact([
      line("Event", event.name),
      line("Date", formatDate(event.date)),
      line("Doors / start", formatTime(event.date)),
      line("Location", event.location),
      line("Build-up from", event.buildUpTime ? formatTime(event.buildUpTime) : null),
      line("Breakdown from", event.breakdownTime ? formatTime(event.breakdownTime) : null),
      line("Theme", event.theme),
    ]),
    blocks: compact([
      line("Venue notes", event.venueNotes),
      line("About the theme", event.themeNotes),
    ]).map((l) => ({ label: l.label, text: l.value })),
  };

  const callSection: BriefingSection = {
    heading: "Your call",
    lines: compact([
      line("Artist", submission.artistName),
      line("Arrival time", submission.arrivalTime),
      line("Sound check", submission.soundCheckDuration),
    ]),
    blocks: compact([line("Your requirements", submission.requirements)]).map((l) => ({
      label: l.label,
      text: l.value,
    })),
  };

  const youSection: BriefingSection = {
    heading: "As we have you on file",
    lines: compact([
      line("Name", submission.name),
      line("Email", submission.email),
      line("Socials", submission.socialHandles),
    ]),
    blocks: compact([line("Bio", submission.bio)]).map((l) => ({
      label: l.label,
      text: l.value,
    })),
  };

  const links: { label: string; href: string }[] = [];
  if (submission.promoMediaUrl) {
    links.push({
      label: submission.promoMediaFilename ?? "Promo media (uploaded)",
      href: submission.promoMediaUrl,
    });
  }
  if (submission.promoMediaLink) {
    links.push({ label: "Promo media (link)", href: submission.promoMediaLink });
  }
  if (submission.materialsUrl) {
    links.push({
      label: submission.materialsFilename ?? "Materials (uploaded)",
      href: submission.materialsUrl,
    });
  }
  if (submission.materialsLink) {
    links.push({ label: "Materials (link)", href: submission.materialsLink });
  }

  return {
    title: `Arty Party — ${event.name} — Artist Briefing`,
    artistName: submission.artistName,
    contactName: submission.name,
    email: submission.email,
    eventName: event.name,
    sections: [eventSection, callSection, youSection].filter(
      (s) => s.lines.length > 0 || (s.blocks?.length ?? 0) > 0
    ),
    links,
    generatedAt: new Date(),
  };
}

/** Plain-text rendering — used for copy-to-clipboard and ready for email. */
export function briefingToText(b: BriefingData): string {
  const out: string[] = [b.title, "=".repeat(b.title.length), ""];
  for (const section of b.sections) {
    out.push(section.heading.toUpperCase());
    for (const l of section.lines) out.push(`  ${l.label}: ${l.value || DASH}`);
    for (const block of section.blocks ?? []) {
      out.push(`  ${block.label}:`);
      out.push(`    ${block.text.replace(/\n/g, "\n    ")}`);
    }
    out.push("");
  }
  if (b.links.length) {
    out.push("FILES & LINKS");
    for (const l of b.links) out.push(`  ${l.label}: ${l.href}`);
    out.push("");
  }
  return out.join("\n");
}
