import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const b = await req.json();
    const media = await prisma.mediaFile.update({
      where: { id: params.id },
      data: {
        ...(b.caption !== undefined && { caption: b.caption || null }),
        ...(b.tags !== undefined && { tags: b.tags }),
      },
    });
    return NextResponse.json(media);
  } catch (err) {
    console.error("PATCH media", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.mediaFile.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE media", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
