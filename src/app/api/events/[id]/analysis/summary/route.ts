import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  askClaude,
  isAIConfigured,
  aiNotConfiguredResponse,
  AINotConfiguredError,
  AI_SYSTEM_BASE,
} from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAIConfigured()) return aiNotConfiguredResponse();

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: { postAnalysis: true },
    });
    if (!event || !event.postAnalysis) {
      return NextResponse.json(
        { error: "Fill in the analysis first" },
        { status: 400 }
      );
    }

    const a = event.postAnalysis;
    const instruction =
      `Summarise the post-event review of "${event.name}" into clear "AI takeaways" ` +
      `the team can apply to future events. Use 3-5 short bullet points.\n\n` +
      `Rating: ${a.overallRating ?? "n/a"}/5\n` +
      `Attendees: ${a.totalAttendees ?? "n/a"}\n` +
      `What went well: ${a.whatWentWell ?? "-"}\n` +
      `What went wrong: ${a.whatWentWrong ?? "-"}\n` +
      `Improvements: ${a.improvements ?? "-"}\n` +
      `Could be better: ${a.couldBeBetter ?? "-"}\n` +
      `Audience feedback: ${a.audienceFeedback ?? "-"}\n` +
      `Team feedback: ${a.teamFeedback ?? "-"}`;

    const aiSummary = await askClaude(AI_SYSTEM_BASE, instruction, 600);
    const updated = await prisma.postAnalysis.update({
      where: { eventId: params.id },
      data: { aiSummary },
    });

    return NextResponse.json({ aiSummary: updated.aiSummary });
  } catch (err) {
    if (err instanceof AINotConfiguredError) return aiNotConfiguredResponse();
    console.error("analysis summary", err);
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
