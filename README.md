# Arty-Party — AI Event Planner Dashboard

A single working tool for JP to plan the Arty-Party arts & culture series end to end —
from first idea through build-up, event day, and post-event reporting.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma + SQLite**,
**Zustand**, **Framer Motion**, **Recharts**, **pdf-lib**, and the **Anthropic Claude API**
(`claude-sonnet-4-6`).

## Features

- **Events** — create (3-step wizard), status lifecycle, progress rings, edit/delete
- **Activity builder** — 8 activity tiles that auto-fill editable materials checklists
- **Team** — planning / build-breakdown / media, with confirm-status tracking
- **Logistics & Run of Show** — time-stamped tasks + printable, PDF-exportable cue sheet
- **Artist CRM** — categories, profiles, performance history, collaboration notes
- **Meetings** — manual entry or **PDF transcript upload with AI extraction** of summary,
  decisions and action items
- **Partners & Guests** — rosters, event attachments, invite statuses, **AI-drafted emails**
- **Marketing** — backward-planning timeline + **AI campaign brief**
- **Budget** — estimated vs actual, variance, Recharts comparison
- **Media vault** — drag-and-drop photo/video upload, captions, tags, filters
- **Post-event analysis** — rating + reflection, **AI takeaways** (unlocks at wrap-up)
- **AI assistant** — slide-over chat that learns from past events (event memory)
- **Event report** — 11-section report, beautiful viewer + **PDF export**

## Getting started

```bash
# 1. Install
npm install

# 2. Environment — create .env.local
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY="sk-ant-..."   # optional: AI features degrade gracefully without it
NEXTAUTH_SECRET="any-random-string"

# 3. Database
npm run db:push      # create the SQLite schema
npm run db:seed      # seed 8 activities + a sample completed event

# 4. Run
npm run dev          # http://localhost:3000
```

> `.env` must also contain `DATABASE_URL` for the Prisma CLI (`db:push`, `db:seed`).

## AI features

Every AI call goes through `src/lib/ai.ts` and is wrapped in try/catch. Without an
`ANTHROPIC_API_KEY`, AI endpoints return a clear, friendly message instead of failing —
all non-AI features work fully. The assistant and the report/marketing/analysis generators
prepend **event memory** (a summary of past completed events) so suggestions improve over time.

## Notes

- SQLite doesn't support Prisma `enum` types, so enum-like fields are stored as `String`
  with values enforced in `src/lib/enums.ts`. The schema stays PostgreSQL-portable.
- Uploads are written to `public/uploads/` (git-ignored). For production, swap to object storage.

## Scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run db:push` | Sync the Prisma schema to SQLite |
| `npm run db:seed` | Seed activities + sample event |

---

*Built for JP — Arty-Party Arts Events · Dashboard v1.0*
