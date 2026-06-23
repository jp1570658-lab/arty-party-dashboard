import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { eventCreateSchema } from "@/lib/validation";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { date: "desc" },
      include: {
        _count: { select: { activities: true, teamMembers: true, logistics: true, runOfShow: true, mediaFiles: true } },
        budget: { include: { items: true } },
        marketingPlan: { select: { id: true } },
        postAnalysis: { select: { id: true } },
      },
    });
    return NextResponse.json(events);
  } catch (err) {
    console.error("GET /events", err);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = eventCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const d = parsed.data;
    const event = await prisma.event.create({
      data: {
        name: d.name,
        date: new Date(d.date),
        buildUpTime: d.buildUpTime ? new Date(d.buildUpTime) : null,
        breakdownTime: d.breakdownTime ? new Date(d.breakdownTime) : null,
        location: d.location,
        venueNotes: d.venueNotes ?? null,
        capacity: d.capacity ?? null,
        theme: d.theme ?? null,
        themeNotes: d.themeNotes ?? null,
        status: "CONCEPT",
      },
    });
    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    console.error("POST /events", err);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
