import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { resolvePalette } from "@/lib/call-sheet";
import { formatDate, formatTime } from "@/lib/utils";
import { CallSheetForm } from "@/components/call-sheet/CallSheetForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { eventId: string };
}): Promise<Metadata> {
  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    select: { name: true },
  });
  return {
    title: event ? `${event.name} — Artist Call Sheet` : "Artist Call Sheet",
    description: "Submit your details for the event.",
  };
}

export default async function CallSheetPage({
  params,
}: {
  params: { eventId: string };
}) {
  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    select: {
      id: true,
      name: true,
      date: true,
      location: true,
      theme: true,
      themeNotes: true,
      callSheetPalette: true,
    },
  });

  if (!event) notFound();

  const palette = resolvePalette(event.callSheetPalette);

  return (
    <div
      className="min-h-screen px-4 py-10 sm:py-16"
      style={{ backgroundColor: palette.tint }}
    >
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-8">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: palette.accent }}
          >
            Arty Party
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900 sm:text-4xl">
            {event.name}
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            {formatDate(event.date)} · {formatTime(event.date)} · {event.location}
          </p>
          {event.theme && (
            <p className="mt-1 text-sm text-gray-600">
              Theme: <span className="font-medium text-gray-900">{event.theme}</span>
            </p>
          )}
          {event.themeNotes && (
            <p className="mt-3 max-w-prose whitespace-pre-line text-sm text-gray-600">
              {event.themeNotes}
            </p>
          )}
          <div
            className="mt-6 h-1 w-16 rounded-full"
            style={{ backgroundColor: palette.accent }}
          />
          <h2 className="mt-6 text-lg font-semibold text-gray-900">Artist Call Sheet</h2>
          <p className="mt-1 max-w-prose text-sm text-gray-600">
            Fill this in so we can plan your slot properly. Everyone booked for this
            event uses the same link — your answers are saved against your artist
            name, so submit once per artist.
          </p>
        </header>

        <CallSheetForm eventId={event.id} palette={palette} />

        <p className="mt-8 text-center text-xs text-gray-500">
          Arty Party · Questions? Reply to the message this link came from.
        </p>
      </div>
    </div>
  );
}
