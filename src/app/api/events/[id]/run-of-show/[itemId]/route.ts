import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const body = await req.json();
    const updated = await prisma.runOfShowItem.update({
      where: { id: params.itemId },
      data: {
        ...(body.time !== undefined && { time: new Date(body.time) }),
        ...(body.duration !== undefined && { duration: body.duration }),
        ...(body.item !== undefined && { item: body.item }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.owner !== undefined && { owner: body.owner }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.order !== undefined && { order: body.order }),
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH run-of-show", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    await prisma.runOfShowItem.delete({ where: { id: params.itemId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE run-of-show", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
