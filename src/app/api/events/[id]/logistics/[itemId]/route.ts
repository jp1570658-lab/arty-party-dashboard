import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const body = await req.json();
    const updated = await prisma.logisticsItem.update({
      where: { id: params.itemId },
      data: {
        ...(body.done !== undefined && { done: body.done }),
        ...(body.task !== undefined && { task: body.task }),
        ...(body.time !== undefined && { time: new Date(body.time) }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.owner !== undefined && { owner: body.owner }),
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH logistics", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    await prisma.logisticsItem.delete({ where: { id: params.itemId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE logistics", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
