import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; meetingId: string } }
) {
  try {
    const b = await req.json();
    const meeting = await prisma.meeting.update({
      where: { id: params.meetingId },
      data: {
        ...(b.title !== undefined && { title: b.title }),
        ...(b.date !== undefined && { date: new Date(b.date) }),
        ...(b.summary !== undefined && { summary: b.summary }),
        ...(b.decisions !== undefined && { decisions: b.decisions }),
        ...(b.actionItems !== undefined && { actionItems: b.actionItems }),
      },
    });
    return NextResponse.json(meeting);
  } catch (err) {
    console.error("PATCH meeting", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; meetingId: string } }
) {
  try {
    await prisma.meeting.delete({ where: { id: params.meetingId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE meeting", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
