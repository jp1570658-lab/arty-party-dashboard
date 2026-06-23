import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { eventInclude } from "@/lib/event-include";
import { ensureDefaultActivities } from "@/lib/activities";
import { EventBuilder } from "@/components/events/EventBuilder";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await ensureDefaultActivities(prisma);

  const [event, activities, mediaArtists, allPartners, allGuests] = await Promise.all([
    prisma.event.findUnique({
      where: { id: params.id },
      include: eventInclude,
    }),
    prisma.activity.findMany({ orderBy: { name: "asc" } }),
    prisma.artist.findMany({
      where: { category: { in: ["PHOTOGRAPHER", "VIDEOGRAPHER"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, category: true },
    }),
    prisma.partner.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, type: true },
    }),
    prisma.guest.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true },
    }),
  ]);

  if (!event) notFound();

  return (
    <EventBuilder
      event={event}
      allActivities={activities}
      mediaArtists={mediaArtists}
      allPartners={allPartners}
      allGuests={allGuests}
    />
  );
}
