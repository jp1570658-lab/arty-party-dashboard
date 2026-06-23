import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const items = await prisma.logisticsItem.findMany({
      where: { eventId: params.id },
      orderBy: { time: "asc" },
    });
    return NextResponse.json(items);
  } catch (err) {
    console.error("GET logistics", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    // Accept a single item or an array (for starter timelines)
    const items = Array.isArray(body) ? body : [body];
    for (const it of items) {
      if (!it.time || !it.task) {
        return NextResponse.json(
          { error: "time and task required" },
          { status: 400 }
        );
      }
    }
    const created = await prisma.$transaction(
      items.map((it) =>
        prisma.logisticsItem.create({
          data: {
            eventId: params.id,
            time: new Date(it.time),
            task: it.task,
            location: it.location || null,
            owner: it.owner || null,
          },
        })
      )
    );
    return NextResponse.json(Array.isArray(body) ? created : created[0], {
      status: 201,
    });
  } catch (err) {
    console.error("POST logistics", err);
    return NextResponse.json({ error: "Failed to add" }, { status: 500 });
  }
}
