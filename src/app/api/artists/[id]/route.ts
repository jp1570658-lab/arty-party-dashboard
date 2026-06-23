import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const artist = await prisma.artist.findUnique({
      where: { id: params.id },
      include: {
        events: { include: { event: true } },
        collaborations: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }
    return NextResponse.json(artist);
  } catch (err) {
    console.error("GET artist", err);
    return NextResponse.json({ error: "Failed to load artist" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const b = await req.json();
    const fields = [
      "name",
      "category",
      "subcategory",
      "email",
      "phone",
      "instagram",
      "tiktok",
      "website",
      "notes",
      "availability",
    ] as const;
    const data: Record<string, unknown> = {};
    for (const f of fields) {
      if (b[f] !== undefined) data[f] = b[f] || null;
    }
    const artist = await prisma.artist.update({ where: { id: params.id }, data });
    return NextResponse.json(artist);
  } catch (err) {
    console.error("PATCH artist", err);
    return NextResponse.json({ error: "Failed to update artist" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.artist.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE artist", err);
    return NextResponse.json({ error: "Failed to delete artist" }, { status: 500 });
  }
}
