import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PLANNER_KINDS } from "@/lib/enums";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updated = await prisma.plannerTask.update({
      where: { id: params.id },
      data: {
        ...(body.title !== undefined && { title: String(body.title).slice(0, 200) }),
        ...(body.date !== undefined && { date: new Date(body.date) }),
        ...(body.kind !== undefined &&
          PLANNER_KINDS.includes(body.kind) && { kind: body.kind }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
        ...(body.done !== undefined && { done: Boolean(body.done) }),
        ...(body.eventId !== undefined && { eventId: body.eventId || null }),
      },
      include: { event: { select: { id: true, name: true } } },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH planner", err);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.plannerTask.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE planner", err);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
