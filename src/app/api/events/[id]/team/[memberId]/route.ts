import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const body = await req.json();
    const updated = await prisma.eventTeamMember.update({
      where: { id: params.memberId },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.role !== undefined && { role: body.role }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
      include: { teamMember: true, artist: true },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH team member", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    await prisma.eventTeamMember.delete({ where: { id: params.memberId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE team member", err);
    return NextResponse.json({ error: "Failed to remove" }, { status: 500 });
  }
}
