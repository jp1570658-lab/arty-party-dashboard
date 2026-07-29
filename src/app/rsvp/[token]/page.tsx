import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { resolvePalette } from "@/lib/call-sheet";
import { formatDate, formatTime } from "@/lib/utils";
import { RsvpForm } from "@/components/rsvp/RsvpForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "RSVP",
  robots: { index: false, follow: false },
};

export default async function RsvpPage({ params }: { params: { token: string } }) {
  const invite = await prisma.guestInvite.findUnique({
    where: { rsvpToken: params.token },
    include: { guest: true, event: true },
  });

  if (!invite) notFound();

  const { event, guest } = invite;
  const palette = resolvePalette(event.callSheetPalette);

  return (
    <div className="min-h-screen px-4 py-12" style={{ backgroundColor: palette.tint }}>
      <div className="mx-auto w-full max-w-lg">
        <header className="mb-8 text-center">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: palette.accent }}
          >
            Arty Party
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">{event.name}</h1>
          <p className="mt-3 text-sm text-gray-600">
            {formatDate(event.date)} · {formatTime(event.date)}
          </p>
          <p className="text-sm text-gray-600">{event.location}</p>
          {event.theme && (
            <p className="mt-1 text-sm text-gray-600">
              Theme: <span className="font-medium text-gray-900">{event.theme}</span>
            </p>
          )}
        </header>

        <RsvpForm
          token={params.token}
          guestName={guest.name}
          palette={palette}
          initialStatus={invite.status}
          initialPartySize={invite.partySize}
        />
      </div>
    </div>
  );
}
