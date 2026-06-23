import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ArtistProfile } from "@/components/artists/ArtistProfile";

export const dynamic = "force-dynamic";

export default async function ArtistProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const artist = await prisma.artist.findUnique({
    where: { id: params.id },
    include: {
      events: { include: { event: { select: { id: true, name: true, date: true } } } },
      collaborations: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!artist) notFound();

  const serialized = {
    ...artist,
    events: artist.events.map((e) => ({
      id: e.id,
      role: e.role,
      event: {
        id: e.event.id,
        name: e.event.name,
        date: e.event.date.toISOString(),
      },
    })),
    collaborations: artist.collaborations.map((c) => ({
      id: c.id,
      type: c.type,
      notes: c.notes,
      status: c.status,
    })),
  };

  return <ArtistProfile artist={serialized} />;
}
