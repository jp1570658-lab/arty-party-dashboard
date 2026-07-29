import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { eventInclude } from "@/lib/event-include";
import { ensureDefaultActivities } from "@/lib/activities";
import { ensureRunSheet, parseKeyContacts } from "@/lib/run-sheet";
import { EventBuilder } from "@/components/events/EventBuilder";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await ensureDefaultActivities(prisma);

  const [event, activities, mediaArtists, allArtists, allPartners, allGuests] = await Promise.all([
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
    prisma.artist.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, category: true, email: true },
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

  const sheet = await ensureRunSheet(event.id);
  if (!sheet) notFound();

  return (
    <EventBuilder
      event={event}
      runSheet={{
        shareToken: sheet.shareToken,
        doorsTime: sheet.doorsTime ? sheet.doorsTime.toISOString() : null,
        address: sheet.address,
        parkingNotes: sheet.parkingNotes,
        keyContacts: parseKeyContacts(sheet.keyContacts),
        emergencyContact: sheet.emergencyContact,
        nearestHospital: sheet.nearestHospital,
        generalNotes: sheet.generalNotes,
      }}
      allActivities={activities}
      mediaArtists={mediaArtists}
      allArtists={allArtists}
      allPartners={allPartners}
      allGuests={allGuests}
    />
  );
}
