import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST create a custom material on an event-activity
export async function POST(req: NextRequest) {
  try {
    const { eventActivityId, name, quantity } = await req.json();
    if (!eventActivityId || !name) {
      return NextResponse.json(
        { error: "eventActivityId and name required" },
        { status: 400 }
      );
    }
    const ea = await prisma.eventActivity.findUnique({
      where: { id: eventActivityId },
      select: { eventId: true },
    });
    const material = await prisma.material.create({
      data: {
        name,
        quantity: quantity ?? 1,
        eventActivityId,
        eventId: ea?.eventId,
      },
    });
    return NextResponse.json(material, { status: 201 });
  } catch (err) {
    console.error("POST material", err);
    return NextResponse.json({ error: "Failed to add material" }, { status: 500 });
  }
}
