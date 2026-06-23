import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; inviteId: string } }
) {
  try {
    const b = await req.json();
    const invite = await prisma.guestInvite.update({
      where: { id: params.inviteId },
      data: {
        ...(b.status !== undefined && {
          status: b.status,
          sentAt: b.status === "sent" ? new Date() : undefined,
        }),
        ...(b.notes !== undefined && { notes: b.notes }),
      },
      include: { guest: true },
    });
    return NextResponse.json(invite);
  } catch (err) {
    console.error("PATCH invite", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; inviteId: string } }
) {
  try {
    await prisma.guestInvite.delete({ where: { id: params.inviteId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE invite", err);
    return NextResponse.json({ error: "Failed to remove" }, { status: 500 });
  }
}
