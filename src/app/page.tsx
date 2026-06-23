import Link from "next/link";
import { CalendarDays, Users, Handshake, ArrowRight, Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/primitives";
import { EVENT_STATUS_LABELS, type EventStatus } from "@/lib/enums";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getStats() {
  const [events, artists, partners, upcoming] = await Promise.all([
    prisma.event.count(),
    prisma.artist.count(),
    prisma.partner.count(),
    prisma.event.findMany({
      where: { date: { gte: new Date() }, status: { not: "ARCHIVED" } },
      orderBy: { date: "asc" },
      take: 4,
    }),
  ]);
  return { events, artists, partners, upcoming };
}

export default async function HomePage() {
  const { events, artists, partners, upcoming } = await getStats();

  const stats = [
    { label: "Events", value: events, href: "/events", icon: CalendarDays },
    { label: "Artists", value: artists, href: "/artists", icon: Users },
    { label: "Partners", value: partners, href: "/partners", icon: Handshake },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink-primary">
          Welcome back, JP 👋
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Your command center for every Arty-Party event.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}>
              <Card className="transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="section-label">{s.label}</div>
                    <div className="text-3xl font-semibold text-ink-primary">
                      {s.value}
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-purple-light text-brand-purple">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-primary">
            Upcoming events
          </h2>
          <Link href="/events/new" className="btn-primary px-3 py-1.5 text-sm">
            <Plus className="h-4 w-4" />
            New event
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <Card className="text-center text-sm text-ink-secondary">
            No upcoming events.{" "}
            <Link href="/events/new" className="font-medium text-brand-purple">
              Create your first one
            </Link>
            .
          </Card>
        ) : (
          <div className="space-y-3">
            {upcoming.map((e) => (
              <Link key={e.id} href={`/events/${e.id}`}>
                <Card className="flex items-center justify-between transition-shadow hover:shadow-md">
                  <div>
                    <div className="font-medium text-ink-primary">{e.name}</div>
                    <div className="text-sm text-ink-secondary">
                      {formatDate(e.date)} · {e.location}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-ink-muted">
                      {EVENT_STATUS_LABELS[e.status as EventStatus]}
                    </span>
                    <ArrowRight className="h-4 w-4 text-ink-muted" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
