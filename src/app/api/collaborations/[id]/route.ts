import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const b = await req.json();
    const note = await prisma.collaborationNote.update({
      where: { id: params.id },
      data: {
        ...(b.notes !== undefined && { notes: b.notes }),
        ...(b.status !== undefined && { status: b.status }),
        ...(b.type !== undefined && { type: b.type }),
      },
    });
    return NextResponse.json(note);
  } catch (err) {
    console.error("PATCH collaboration", err);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.collaborationNote.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE collaboration", err);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
