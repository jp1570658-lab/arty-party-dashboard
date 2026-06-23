import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  askClaude,
  isAIConfigured,
  aiNotConfiguredResponse,
  AINotConfiguredError,
  AI_SYSTEM_BASE,
} from "@/lib/ai";
import { formatDate } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAIConfigured()) return aiNotConfiguredResponse();

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: { activities: { include: { activity: true } } },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const activities = event.activities.map((a) => a.activity.name).join(", ") || "various arts activities";

    const instruction =
      `Write a complete marketing campaign brief for the Arty-Party event "${event.name}" ` +
      `on ${formatDate(event.date)} at ${event.location}` +
      `${event.theme ? `, themed "${event.theme}"` : ""}. ` +
      `The programme includes: ${activities}. ` +
      `Include these clearly labelled sections:\n` +
      `1. Campaign angle (1-2 sentences)\n` +
      `2. Instagram feed captions (2 options)\n` +
      `3. Instagram stories idea\n` +
      `4. TikTok concept\n` +
      `5. Posting schedule (working back from the event date)\n` +
      `Keep it practical and ready to use. Plain text with clear headers.`;

    const campaignBrief = await askClaude(AI_SYSTEM_BASE, instruction, 1500);

    // Persist the brief on the plan
    await prisma.marketingPlan.upsert({
      where: { eventId: params.id },
      update: { campaignBrief },
      create: { eventId: params.id, campaignBrief },
    });

    return NextResponse.json({ campaignBrief });
  } catch (err) {
    if (err instanceof AINotConfiguredError) return aiNotConfiguredResponse();
    console.error("marketing-campaign", err);
    return NextResponse.json({ error: "Failed to generate brief" }, { status: 500 });
  }
}
