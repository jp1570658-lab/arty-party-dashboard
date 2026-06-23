import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { RunOfShow } from "@/components/builder/RunOfShow";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RunOfShowPage({
  params,
}: {
  params: { id: string };
}) {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: { runOfShow: { orderBy: { order: "asc" } } },
  });
  if (!event) notFound();

  const eventDateOnly = event.date.toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      <div className="print:hidden">
        <Link
          href={`/events/${event.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to event
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-ink-primary">Run of Show</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          {event.name} · {formatDate(event.date)} · {event.location}
        </p>
      </div>
      <RunOfShow
        eventId={event.id}
        eventDateOnly={eventDateOnly}
        initial={event.runOfShow.map((r) => ({ ...r, time: r.time.toISOString() }))}
      />
    </div>
  );
}
