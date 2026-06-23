import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PATCH update an event-activity's notes
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; actId: string } }
) {
  try {
    const { notes } = await req.json();
    const updated = await prisma.eventActivity.update({
      where: { id: params.actId },
      data: { notes: notes ?? null },
      include: { activity: true, materials: true },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH event activity", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE remove an activity from the event (cascades materials)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; actId: string } }
) {
  try {
    await prisma.eventActivity.delete({ where: { id: params.actId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE event activity", err);
    return NextResponse.json({ error: "Failed to remove" }, { status: 500 });
  }
}
