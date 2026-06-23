import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { artistId, partnerId, type, notes, status } = await req.json();
    if (!notes || (!artistId && !partnerId)) {
      return NextResponse.json(
        { error: "notes and an artistId or partnerId required" },
        { status: 400 }
      );
    }
    const note = await prisma.collaborationNote.create({
      data: {
        artistId: artistId || null,
        partnerId: partnerId || null,
        type: type || "idea",
        notes,
        status: status || "potential",
      },
    });
    return NextResponse.json(note, { status: 201 });
  } catch (err) {
    console.error("POST collaboration", err);
    return NextResponse.json({ error: "Failed to add note" }, { status: 500 });
  }
}
