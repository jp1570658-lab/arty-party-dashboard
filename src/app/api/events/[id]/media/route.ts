import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const media = await prisma.mediaFile.findMany({
      where: { eventId: params.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(media);
  } catch (err) {
    console.error("GET media", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
