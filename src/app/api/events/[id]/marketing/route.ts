import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const plan = await prisma.marketingPlan.findUnique({
      where: { eventId: params.id },
    });
    return NextResponse.json(plan);
  } catch (err) {
    console.error("GET marketing", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

const DATE_FIELDS = [
  "posterDeadline",
  "flyerPrintDeadline",
  "flyerDistributionDate",
  "onlinePostStart",
] as const;
const JSON_FIELDS = ["posterLocations", "flyerLocations"] as const;
const TEXT_FIELDS = [
  "instagramStoryPlan",
  "instagramFeedPlan",
  "tiktokPlan",
  "specialInvites",
  "campaignBrief",
] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const b = await req.json();
    const data: Record<string, unknown> = {};
    for (const f of DATE_FIELDS) {
      if (b[f] !== undefined) data[f] = b[f] ? new Date(b[f]) : null;
    }
    for (const f of JSON_FIELDS) {
      if (b[f] !== undefined) data[f] = b[f] ?? null;
    }
    for (const f of TEXT_FIELDS) {
      if (b[f] !== undefined) data[f] = b[f] || null;
    }

    const plan = await prisma.marketingPlan.upsert({
      where: { eventId: params.id },
      update: data,
      create: { eventId: params.id, ...data },
    });
    return NextResponse.json(plan);
  } catch (err) {
    console.error("PATCH marketing", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
