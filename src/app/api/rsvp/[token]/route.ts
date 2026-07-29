import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Public RSVP endpoint — the link in the invitation email posts here. */
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const body = await req.json();
    const attending = Boolean(body.attending);
    const partySize = attending
      ? Math.min(Math.max(Number(body.partySize) || 1, 1), 20)
      : 0;

    const invite = await prisma.guestInvite.findUnique({
      where: { rsvpToken: params.token },
    });
    if (!invite) {
      return NextResponse.json({ error: "This RSVP link is not valid" }, { status: 404 });
    }

    const updated = await prisma.guestInvite.update({
      where: { id: invite.id },
      data: {
        status: attending ? "confirmed" : "declined",
        partySize,
        respondedAt: new Date(),
        ...(body.notes !== undefined && { notes: body.notes || null }),
      },
    });

    return NextResponse.json({ status: updated.status, partySize: updated.partySize });
  } catch (err) {
    console.error("POST rsvp", err);
    return NextResponse.json({ error: "Failed to save your response" }, { status: 500 });
  }
}
