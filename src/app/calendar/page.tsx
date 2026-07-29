import { prisma } from "@/lib/db";
import { CalendarClient } from "@/components/calendar/CalendarClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Calendar — Arty-Party" };

export default async function CalendarPage() {
  const [events, tasks] = await Promise.all([
    prisma.event.findMany({
      orderBy: { date: "asc" },
      select: { id: true, name: true, date: true, status: true },
    }),
    prisma.plannerTask.findMany({
      orderBy: { date: "asc" },
      include: { event: { select: { name: true } } },
    }),
  ]);

  return (
    <CalendarClient
      events={events.map((e) => ({
        id: e.id,
        name: e.name,
        date: e.date.toISOString(),
        status: e.status,
      }))}
      initialTasks={tasks.map((t) => ({
        id: t.id,
        title: t.title,
        date: t.date.toISOString(),
        kind: t.kind,
        notes: t.notes,
        done: t.done,
        eventId: t.eventId,
        eventName: t.event?.name ?? null,
      }))}
    />
  );
}
