import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AI_SYSTEM_BASE, aiErrorResponse, askClaude, extractJson } from "@/lib/ai";
import { parseKeyContacts } from "@/lib/run-sheet";
import { draftToRows } from "@/lib/run-of-show-draft";
import { formatTime } from "@/lib/utils";
import { zonedDateKey } from "@/lib/timezone";

/**
 * Drafts a full-day run of show from the artist call sheets (arrival times,
 * sound check durations) and the logistics who/what/when grid, then writes it
 * into editable RunOfShowItem rows. Never auto-locks: `replace: false` appends,
 * and every row stays editable and deletable in the UI.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { replace = true } = await req.json().catch(() => ({}));

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        logistics: { orderBy: { time: "asc" } },
        callSheets: { orderBy: { createdAt: "asc" } },
        activities: { include: { activity: true } },
        eventCallSheet: true,
        teamMembers: { include: { artist: true, teamMember: true } },
      },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Brussels calendar day — matches the logistics and run-of-show editors.
    const eventDay = zonedDateKey(event.date);

    const context = {
      event: {
        name: event.name,
        date: eventDay,
        startTime: formatTime(event.date),
        doorsTime: event.eventCallSheet?.doorsTime
          ? formatTime(event.eventCallSheet.doorsTime)
          : formatTime(event.date),
        buildUpTime: event.buildUpTime ? formatTime(event.buildUpTime) : null,
        breakdownTime: event.breakdownTime ? formatTime(event.breakdownTime) : null,
        location: event.location,
        theme: event.theme,
        capacity: event.capacity,
      },
      activities: event.activities.map((a) => ({
        name: a.activity.name,
        team: a.activity.defaultTeam,
        notes: a.notes,
      })),
      artistCallSheets: event.callSheets.map((c) => ({
        artistName: c.artistName,
        arrivalTime: c.arrivalTime,
        soundCheckDuration: c.soundCheckDuration,
        requirements: c.requirements,
      })),
      bookedArtistsWithoutCallSheet: event.teamMembers
        .filter((m) => m.teamType === "ARTIST")
        .map((m) => m.artist?.name ?? m.teamMember?.name)
        .filter(
          (name): name is string =>
            !!name &&
            !event.callSheets.some(
              (c) => c.artistName.toLowerCase() === name.toLowerCase()
            )
        ),
      logistics: event.logistics.map((l) => ({
        when: formatTime(l.time),
        what: l.task,
        who: l.owner,
        where: l.location,
      })),
      keyContacts: parseKeyContacts(event.eventCallSheet?.keyContacts),
    };

    const system =
      AI_SYSTEM_BASE +
      "\n\nYou are drafting a run of show: the timestamped master document for " +
      "event day, from crew arrival to the last person leaving. Respect every " +
      "arrival time and sound check duration the artists gave you — those are " +
      "commitments, not suggestions. Sequence sound checks so they do not " +
      "collide, leave changeover gaps between performances, and put setup " +
      "before doors. Fold in the logistics tasks at their stated times rather " +
      "than inventing new times for them.";

    const user =
      "Draft the run of show for this event.\n\n" +
      `${JSON.stringify(context, null, 2)}\n\n` +
      'Return ONLY a JSON array, each element: {"time":"HH:MM","duration":<minutes or null>,' +
      '"item":"short description","owner":"person or team or null","location":"or null",' +
      '"notes":"short note or null"}. ' +
      "Order chronologically. Use 24-hour times on the event day. " +
      "Cover build-up, sound checks, doors, the programme itself, and breakdown. " +
      "Aim for 12-25 rows — enough detail to run the day, not a minute-by-minute script.";

    const raw = await askClaude(system, user, 3000);
    const draft = extractJson(raw);

    const rows = draftToRows(draft, eventDay).map((r) => ({ ...r, eventId: params.id }));

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "The AI's timeline had no valid rows. Try again." },
        { status: 502 }
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      if (replace) {
        await tx.runOfShowItem.deleteMany({ where: { eventId: params.id } });
      } else {
        const last = await tx.runOfShowItem.findFirst({
          where: { eventId: params.id },
          orderBy: { order: "desc" },
        });
        const offset = (last?.order ?? -1) + 1;
        rows.forEach((r, i) => (r.order = offset + i));
      }
      await tx.runOfShowItem.createMany({ data: rows });
      return tx.runOfShowItem.findMany({
        where: { eventId: params.id },
        orderBy: { order: "asc" },
      });
    });

    return NextResponse.json({ items: created, generated: rows.length });
  } catch (err) {
    const mapped = aiErrorResponse(err);
    if (mapped) return mapped;
    console.error("POST run-of-show/generate", err);
    return NextResponse.json({ error: "Failed to draft the run of show" }, { status: 500 });
  }
}
