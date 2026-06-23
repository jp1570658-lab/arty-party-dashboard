import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const meetings = await prisma.meeting.findMany({
      where: { eventId: params.id },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(meetings);
  } catch (err) {
    console.error("GET meetings", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const b = await req.json();
    if (!b.title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }
    const meeting = await prisma.meeting.create({
      data: {
        eventId: params.id,
        title: b.title,
        date: b.date ? new Date(b.date) : new Date(),
        summary: b.summary || null,
        decisions: b.decisions ?? undefined,
        actionItems: b.actionItems ?? undefined,
      },
    });
    return NextResponse.json(meeting, { status: 201 });
  } catch (err) {
    console.error("POST meetings", err);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
