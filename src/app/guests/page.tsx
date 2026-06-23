import { prisma } from "@/lib/db";
import { GuestsClient } from "@/components/guests/GuestsClient";

export const dynamic = "force-dynamic";

export default async function GuestsPage() {
  const guests = await prisma.guest.findMany({ orderBy: { name: "asc" } });
  return <GuestsClient guests={guests} />;
}
