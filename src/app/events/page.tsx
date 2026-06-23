import Link from "next/link";
import { Plus, CalendarDays } from "lucide-react";
import { prisma } from "@/lib/db";
import { EventCard, type EventCardData } from "@/components/events/EventCard";
import { EmptyState } from "@/components/ui/primitives";
import { flagsFromEvent } from "@/lib/progress";

export const dynamic = "force-dynamic";

async function getEvents(): Promise<EventCardData[]> {
  const events = await prisma.event.findMany({
    orderBy: { date: "desc" },
    include: {
      _count: {
        select: {
          activities: true,
          teamMembers: true,
          logistics: true,
          runOfShow: true,
          mediaFiles: true,
        },
      },
      budget: { include: { items: true } },
      marketingPlan: { select: { id: true } },
      postAnalysis: { select: { id: true } },
    },
  });
  return events.map((e) => ({
    id: e.id,
    name: e.name,
    date: e.date.toISOString(),
    location: e.location,
    status: e.status,
    capacity: e.capacity,
    progress: flagsFromEvent(e),
  }));
}

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-primary">Events</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Every Arty-Party from concept to wrap-up.
          </p>
        </div>
        <Link href="/events/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          New event
        </Link>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events yet"
          description="Create your first event to start building the run of show, team, budget and more."
          action={
            <Link href="/events/new" className="btn-primary">
              <Plus className="h-4 w-4" />
              Create your first event
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e, i) => (
            <EventCard key={e.id} event={e} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
