import { prisma } from "@/lib/db";
import { ArtistsClient } from "@/components/artists/ArtistsClient";
import type { ArtistCardData } from "@/components/artists/ArtistCard";

export const dynamic = "force-dynamic";

async function getArtists(): Promise<ArtistCardData[]> {
  const artists = await prisma.artist.findMany({
    orderBy: { name: "asc" },
    include: {
      events: {
        include: { event: { select: { date: true } } },
      },
    },
  });
  return artists.map((a) => {
    const dates = a.events
      .map((e) => e.event.date)
      .sort((x, y) => +new Date(y) - +new Date(x));
    return {
      id: a.id,
      name: a.name,
      category: a.category,
      subcategory: a.subcategory,
      eventCount: a.events.length,
      lastEvent: dates[0] ? new Date(dates[0]).toISOString() : null,
    };
  });
}

export default async function ArtistsPage() {
  const artists = await getArtists();
  return <ArtistsClient artists={artists} />;
}
