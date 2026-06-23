import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const analysis = await prisma.postAnalysis.findUnique({
      where: { eventId: params.id },
    });
    return NextResponse.json(analysis);
  } catch (err) {
    console.error("GET analysis", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

const NUM_FIELDS = ["overallRating", "totalAttendees"] as const;
const TEXT_FIELDS = [
  "whatWentWell",
  "whatWentWrong",
  "improvements",
  "couldBeBetter",
  "audienceFeedback",
  "teamFeedback",
] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const b = await req.json();
    const data: Record<string, unknown> = {};
    for (const f of NUM_FIELDS) {
      if (b[f] !== undefined) data[f] = b[f] === null || b[f] === "" ? null : Number(b[f]);
    }
    for (const f of TEXT_FIELDS) {
      if (b[f] !== undefined) data[f] = b[f] || null;
    }

    const analysis = await prisma.postAnalysis.upsert({
      where: { eventId: params.id },
      update: data,
      create: { eventId: params.id, ...data },
    });

    // Keep the event's actualAttendees in sync for analytics/reports
    if (b.totalAttendees !== undefined) {
      await prisma.event.update({
        where: { id: params.id },
        data: {
          actualAttendees:
            b.totalAttendees === null || b.totalAttendees === ""
              ? null
              : Number(b.totalAttendees),
        },
      });
    }

    return NextResponse.json(analysis);
  } catch (err) {
    console.error("PATCH analysis", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
