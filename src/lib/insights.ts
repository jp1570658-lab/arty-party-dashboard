// Community & trends insights — the daily read on what's happening in JP's
// space, and what to do about it.
//
// Observation and strategy only: nothing here posts anywhere. Sourced from
// Claude's server-side web search, which bills per search on top of tokens, so
// MAX_SEARCHES is a deliberate cost ceiling rather than a tuning knob.

import { prisma } from "./db";
import {
  AI_SYSTEM_BASE,
  askClaudeWithWebSearch,
  extractJson,
} from "./ai";
import { INSIGHT_KINDS, type InsightKind } from "./enums";
import { zonedDateKey, zonedToUtc } from "./timezone";

/** Hard ceiling per run. 3 searches ≈ $0.03 before tokens.
 *  Also a latency ceiling: each search adds seconds, and the whole run has to
 *  finish inside the serverless function limit. */
export const MAX_SEARCHES = 3;

/** Unsaved insights older than this are pruned on each daily run. */
export const RETAIN_DAYS = 30;

interface RawInsight {
  kind?: string;
  title?: string;
  body?: string;
  relevance?: string;
  url?: string;
  source?: string;
}

export interface InsightSeed {
  kind: InsightKind;
  title: string;
  body: string;
  relevance: string | null;
  url: string | null;
  source: string | null;
}

function text(v: unknown, max: number): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
}

/** Filters a model batch down to insights worth storing. */
export function parseInsights(raw: unknown): InsightSeed[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((r): r is RawInsight => !!r && typeof r === "object")
    .map((r) => {
      const kind = String(r.kind ?? "").toUpperCase();
      const title = text(r.title, 200);
      const body = text(r.body, 1200);
      if (!INSIGHT_KINDS.includes(kind as InsightKind) || !title || !body) {
        return null;
      }
      const url = text(r.url, 500);
      return {
        kind: kind as InsightKind,
        title,
        body,
        relevance: text(r.relevance, 600),
        // Only keep links we could actually open.
        url: url && /^https?:\/\//i.test(url) ? url : null,
        source: text(r.source, 120),
      };
    })
    .filter((r): r is InsightSeed => r !== null);
}

/** Context about JP's own events so the insights are specific, not generic. */
async function buildContext() {
  const [upcoming, recent] = await Promise.all([
    prisma.event.findMany({
      where: { date: { gte: new Date() } },
      orderBy: { date: "asc" },
      take: 3,
      select: { name: true, date: true, theme: true, location: true },
    }),
    prisma.event.findMany({
      where: { status: "COMPLETED" },
      orderBy: { date: "desc" },
      take: 3,
      include: { activities: { include: { activity: true } }, postAnalysis: true },
    }),
  ]);

  return {
    business:
      "Arty-Party — interactive live-painting events in Brussels: corporate, " +
      "institutional and private-event work, plus a recurring arts night with " +
      "poetry, DJ sets, exhibitions and pottery.",
    upcomingEvents: upcoming.map((e) => ({
      name: e.name,
      date: zonedDateKey(e.date),
      theme: e.theme,
      location: e.location,
    })),
    recentEvents: recent.map((e) => ({
      name: e.name,
      date: zonedDateKey(e.date),
      activities: e.activities.map((a) => a.activity.name),
      whatWentWell: e.postAnalysis?.whatWentWell ?? null,
      improvements: e.postAnalysis?.improvements ?? null,
    })),
  };
}

function systemPrompt(today: string) {
  return (
    AI_SYSTEM_BASE +
  "\n\nRight now you are the community and strategy analyst, not the event " +
  "producer. Your job is to help JP observe and grow their audience in and " +
  "around Brussels: what is happening in the local arts and live-painting " +
  "scene, which open calls and funding rounds are worth applying to, which " +
  "accounts and collectives are worth following and engaging with, and what " +
  "JP should actually do this week. " +
  "You do not post anything — JP posts manually. Suggest, never publish. " +
  "Be specific and current: name real events, organisations, venues, deadlines " +
  "and handles you actually found. A vague insight is worse than no insight. " +
    "If you cannot verify something, leave it out rather than inventing it." +
    `

Today is ${today} (Europe/Brussels). Search results skew towards older ` +
    "indexed pages, so check the date on everything you find. Never present a " +
    "past event as upcoming, and never include an open call, grant or deadline " +
    "that has already closed — if the deadline is before today, discard it and " +
    "look for the current edition instead. Prefer sources published within the " +
    "last three months."
  );
}

/**
 * Runs a search-backed insight batch. Returns the parsed insights without
 * writing them, so callers decide whether to persist.
 */
export async function generateInsights(): Promise<InsightSeed[]> {
  const context = await buildContext();

  const today = zonedDateKey(new Date());

  const user =
    `Today is ${today}. ` +
    "Research what is happening right now in the Brussels (and wider Belgian/EU) " +
    "arts and events scene that is relevant to this business, then return " +
    "actionable insights.\n\n" +
    `Business context:\n${JSON.stringify(context, null, 2)}\n\n` +
    "Cover a mix of these kinds:\n" +
    '- "TREND" — what is gaining traction in live art, events or the content around them\n' +
    '- "NEWS" — a development in the local arts/culture scene worth knowing\n' +
    '- "OPEN_CALL" — an open call, grant, residency, festival or funding deadline to apply for\n' +
    '- "ACCOUNT" — a specific creator, collective, venue or organisation worth following and engaging with\n' +
    '- "ACTION" — something concrete to do this week to build the community\n\n' +
    'Return ONLY a JSON array. Each element: {"kind":"TREND|NEWS|OPEN_CALL|ACCOUNT|ACTION",' +
    '"title":"short headline","body":"2-4 sentences of substance",' +
    '"relevance":"one sentence on why this matters to Arty-Party specifically",' +
    '"url":"source link or null","source":"publication or platform name or null"}. ' +
    "For anything with a date or deadline, put it in the title and make sure it " +
    `falls on or after ${today}. ` +
    "Return exactly 6 insights. Prioritise things with a date, a deadline, or a " +
    "name attached over general observations. Search efficiently — you have a " +
    "small search budget, so make each query count, and write the JSON as soon " +
    "as you have enough to go on.";

  const started = Date.now();
  const raw = await askClaudeWithWebSearch(systemPrompt(today), user, {
    maxTokens: 3500,
    maxSearches: MAX_SEARCHES,
  });
  const parsed = parseInsights(extractJson(raw));
  console.log(
    `[insights] ${Math.round((Date.now() - started) / 1000)}s, ` +
      `${raw.length} chars, ${parsed.length} parsed`
  );
  return parsed;
}

/** Generate and store a batch for today (Brussels). Replaces today's batch. */
export async function runDailyInsights() {
  const seeds = await generateInsights();
  if (seeds.length === 0) {
    return { created: 0, batchDate: null as Date | null };
  }

  // Anchor at Brussels noon so a batch belongs to one unambiguous day.
  const batchDate = zonedToUtc(zonedDateKey(new Date()), "12:00");

  // Replace today's batch, but never touch what JP saved. Deliberately not an
  // interactive transaction: the preceding AI call runs for minutes, which is
  // long enough for the pooled Postgres connection to be recycled underneath us.
  await prisma.insight.deleteMany({ where: { batchDate, saved: false } });
  const res = await prisma.insight.createMany({
    data: seeds.map((s) => ({ ...s, batchDate })),
  });

  // One batch a day accumulates fast, and a two-month-old "trend" is noise.
  // Saved insights are kept regardless — that's what saving is for.
  const cutoff = new Date(batchDate.getTime() - RETAIN_DAYS * 86_400_000);
  const pruned = await prisma.insight.deleteMany({
    where: { batchDate: { lt: cutoff }, saved: false },
  });

  return { created: res.count, pruned: pruned.count, batchDate };
}
