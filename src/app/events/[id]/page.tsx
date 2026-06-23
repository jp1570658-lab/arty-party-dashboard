import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { eventInclude } from "@/lib/event-include";
import { EventBuilder } from "@/components/events/EventBuilder";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: eventInclude,
  });

  if (!event) notFound();

  return <EventBuilder event={event} />;
}
