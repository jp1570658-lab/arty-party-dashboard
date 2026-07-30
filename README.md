# Arty-Party — AI Event Planner Dashboard

**Live:** https://arty-party-dashboard.vercel.app

A single working tool for JP to plan the Arty-Party arts & culture series end to end —
from first idea through build-up, event day, and post-event reporting.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**,
**Prisma + PostgreSQL**, **Zustand**, **Framer Motion**, **Recharts**, **pdf-lib**,
the **Anthropic Claude API** (`claude-sonnet-4-6`), **Resend** for email, and
**Metricool** for social analytics.

All dates and times are **Brussels** wall-clock time — see [Timezone](#timezone).

## Features

### Planning
- **Events** — create (3-step wizard), status lifecycle, progress rings, edit/delete
- **Activity builder** — 8 activity tiles that auto-fill one scannable materials
  checklist, with an outstanding-only filter
- **Artist lineup** — build the bill incrementally from the artist CRM or inline, and
  see at a glance who has returned their call sheet
- **Team** — planning / build-breakdown / media, with confirm-status tracking
- **Calendar** — month view of event dates plus planning and content tasks
- **Budget** — estimated vs actual, variance, Recharts comparison
- **Meetings** — manual entry or **PDF transcript upload with AI extraction**

### Artist-facing
- **Artist call sheet** — one shared public link per event (`/call-sheet/[eventId]`),
  themed by the event's accent palette. Each artist's submission is its own entry;
  resubmitting updates theirs and archives the previous version. Uploads capped at
  65MB, enforced client- *and* server-side.
- **Send from the app** — email the call sheet link to selected artists via Resend,
  or share it over WhatsApp with a pre-filled deep link (no service needed).
- **Artist briefing** — per-artist briefing assembled from the event plus their own
  call sheet, as a styled page and a PDF. Assembly (`src/lib/briefing.ts`) is kept
  separate from rendering, so plain-text/email output is a renderer, not a rewrite.

### Event day
- **Logistics & call sheet** — the operational who/what/when grid plus a header block
  (key times, contacts, address, parking, emergency, nearest hospital), following the
  film/TV call sheet standard trimmed to live events. Shared read-only with venue and
  vendors by link (`/run-sheet/[token]`), plus PDF.
- **Run of Show** — **AI-drafted** from artist arrival times and sound-check durations
  plus the logistics grid, into rows that stay editable inline. Printable, PDF export.

### Audience & community
- **Guests & RSVPs** — emailed invitations with a per-guest RSVP link
  (`/rsvp/[token]`), party sizes, and a confirmed head count on the event
- **Community** — daily AI research on trends, local news, open calls, accounts worth
  following, and concrete actions. Analysis only: nothing posts anywhere.
- **Social performance** — follower growth per network via Metricool

### Reporting
- **Media vault** — drag-and-drop photo/video upload, captions, tags, filters
- **Post-event analysis** — rating + reflection, **AI takeaways** (unlocks at wrap-up)
- **AI assistant** — slide-over chat that learns from past events (event memory)
- **Event report** — 11-section report, viewer + **PDF export**

## Getting started

```bash
npm install
npm run db:push      # sync the Prisma schema
npm run db:seed      # seed 8 activities + a sample completed event
npm run dev          # http://localhost:3000
```

## Environment

Create `.env.local` (and keep the Postgres pair in `.env` too, for the Prisma CLI).
Every integration **degrades gracefully**: without a key the relevant routes return a
clear message and everything else keeps working.

| Variable | Required for | Notes |
|---|---|---|
| `POSTGRES_PRISMA_URL` | everything | Pooled connection (Vercel Postgres / Neon) |
| `POSTGRES_URL_NON_POOLING` | migrations | Used by `db:push` and `db:seed` |
| `ANTHROPIC_API_KEY` | all AI features | Run of show, insights, reports, assistant, PDF extraction |
| `BLOB_READ_WRITE_TOKEN` | uploads in production | Vercel Blob, **public** store. Falls back to `public/` locally |
| `RESEND_API_KEY` | sending call sheets and invitations | WhatsApp share works without it |
| `EMAIL_FROM` | branded sender | Defaults to Resend's onboarding address |
| `CRON_SECRET` | the daily insights run | Without it the cron route stays **closed**, not open |
| `METRICOOL_API_TOKEN` | social performance | Metricool → Account Settings → Access → API |
| `METRICOOL_USER_ID` | social performance | Numeric account id |
| `METRICOOL_BLOG_ID` | social performance | The brand whose networks to read |
| `NEXT_PUBLIC_APP_URL` | absolute links in emails | Inferred from Vercel env otherwise |

### Metricool

Metricool holds the OAuth relationship with Instagram / Facebook / TikTok, so this app
needs **no per-platform developer apps or tokens**. Connect the accounts inside
Metricool first — an unconnected network simply doesn't report. API access requires
Metricool's **Advanced plan or higher**; free and Starter tiers have no API.

Nothing in this app posts to social media. It reads and advises only.

## Scheduled jobs

`vercel.json` registers one cron:

| Path | Schedule | What it does |
|---|---|---|
| `/api/cron/insights` | `0 6 * * *` | One community-insight batch per day |

The route requires `Authorization: Bearer $CRON_SECRET` — Vercel sends this
automatically. It costs money to run (one AI call plus up to 3 web searches, about
$0.03 plus tokens), which is why it refuses unauthenticated callers and stays disabled
when no secret is configured.

## Timezone

Arty-Party runs in Brussels, and `src/lib/timezone.ts` (`EVENT_TZ`) is the single
source of truth. Timestamps are stored as UTC instants, but every date and time a
human types or reads is Brussels wall-clock time.

This matters because Vercel runs the server in UTC: `toISOString().slice(0, 10)`
yields the *UTC* day, which for anything starting after ~22:00 Brussels in summer is
the previous day. Anything pairing a `yyyy-mm-dd` with an `HH:MM` must go through
`zonedDateKey` / `zonedTimeKey` / `zonedToIso`.

## AI features

Every AI call goes through `src/lib/ai.ts` and is wrapped in try/catch. Failures are
mapped to actionable messages rather than a generic 500 — an exhausted credit balance,
a rejected key and a rate limit each say so specifically.

Two things worth knowing about the search-backed insights:

- **Prompts state today's date explicitly.** Web search skews towards older indexed
  pages; without the anchor the first live run returned exclusively *expired* open
  calls. A passed deadline is now a hard discard.
- **The basic `web_search_20250305` variant is used deliberately.** The newer
  `_20260209` version adds dynamic filtering, which runs code execution under the
  hood and took 253s against 48s for the same job — past the serverless ceiling.

## Notes

- Enum-like fields are stored as `String` with values enforced in `src/lib/enums.ts`
  (a legacy of the SQLite origin, and portable).
- Prisma is pinned to **v6**: v7 drops `url = env(...)` in the schema.
- Deleting a call sheet submission or media file removes the database row but leaves
  the uploaded file in Blob storage.

## Scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run db:push` | Sync the Prisma schema |
| `npm run db:seed` | Seed activities + sample event |

---

*Built for JP — Arty-Party Arts Events · Dashboard v1.0*
