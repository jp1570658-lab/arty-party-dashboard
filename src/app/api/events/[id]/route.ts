import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { eventUpdateSchema } from "@/lib/validation";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        activities: { include: { activity: true, materials: true } },
        teamMembers: { include: { teamMember: true, artist: true } },
        logistics: { orderBy: { time: "asc" } },
        runOfShow: { orderBy: { order: "asc" } },
        budget: { include: { items: true } },
        marketingPlan: true,
        postAnalysis: true,
        meetings: { orderBy: { date: "desc" } },
        mediaFiles: { orderBy: { createdAt: "desc" } },
        partners: { include: { partner: true } },
        guestInvites: { include: { guest: true } },
      },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json(event);
  } catch (err) {
    console.error("GET /events/[id]", err);
    return NextResponse.json({ error: "Failed to load event" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const parsed = eventUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const d = parsed.data;
    const event = await prisma.event.update({
      where: { id: params.id },
      data: {
        ...(d.name !== undefined && { name: d.name }),
        ...(d.date !== undefined && { date: new Date(d.date) }),
        ...(d.buildUpTime !== undefined && {
          buildUpTime: d.buildUpTime ? new Date(d.buildUpTime) : null,
        }),
        ...(d.breakdownTime !== undefined && {
          breakdownTime: d.breakdownTime ? new Date(d.breakdownTime) : null,
        }),
        ...(d.location !== undefined && { location: d.location }),
        ...(d.venueNotes !== undefined && { venueNotes: d.venueNotes }),
        ...(d.capacity !== undefined && { capacity: d.capacity }),
        ...(d.theme !== undefined && { theme: d.theme }),
        ...(d.themeNotes !== undefined && { themeNotes: d.themeNotes }),
        ...(d.status !== undefined && { status: d.status }),
        ...(d.actualAttendees !== undefined && { actualAttendees: d.actualAttendees }),
      },
    });
    return NextResponse.json(event);
  } catch (err) {
    console.error("PATCH /events/[id]", err);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.event.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /events/[id]", err);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
