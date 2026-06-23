import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET activities attached to an event
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const items = await prisma.eventActivity.findMany({
      where: { eventId: params.id },
      include: { activity: true, materials: true },
    });
    return NextResponse.json(items);
  } catch (err) {
    console.error("GET event activities", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

// POST add an activity to the event, seeding its default materials
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { activityId } = await req.json();
    if (!activityId) {
      return NextResponse.json({ error: "activityId required" }, { status: 400 });
    }

    const existing = await prisma.eventActivity.findFirst({
      where: { eventId: params.id, activityId },
    });
    if (existing) {
      return NextResponse.json({ error: "Activity already added" }, { status: 409 });
    }

    const activity = await prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    const defaults = Array.isArray(activity.defaultMaterials)
      ? (activity.defaultMaterials as string[])
      : [];

    const created = await prisma.eventActivity.create({
      data: {
        eventId: params.id,
        activityId,
        materials: {
          create: defaults.map((name) => ({ name, eventId: params.id })),
        },
      },
      include: { activity: true, materials: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST event activity", err);
    return NextResponse.json({ error: "Failed to add activity" }, { status: 500 });
  }
}
