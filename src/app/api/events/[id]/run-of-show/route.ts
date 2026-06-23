import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const items = await prisma.runOfShowItem.findMany({
      where: { eventId: params.id },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(items);
  } catch (err) {
    console.error("GET run-of-show", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    if (!body.time || !body.item) {
      return NextResponse.json({ error: "time and item required" }, { status: 400 });
    }
    const last = await prisma.runOfShowItem.findFirst({
      where: { eventId: params.id },
      orderBy: { order: "desc" },
    });
    const created = await prisma.runOfShowItem.create({
      data: {
        eventId: params.id,
        time: new Date(body.time),
        duration: body.duration ?? null,
        item: body.item,
        location: body.location || null,
        owner: body.owner || null,
        notes: body.notes || null,
        order: (last?.order ?? -1) + 1,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST run-of-show", err);
    return NextResponse.json({ error: "Failed to add" }, { status: 500 });
  }
}
