import { NextRequest, NextResponse } from "next/server";
import {
  askClaude,
  isAIConfigured,
  aiNotConfiguredResponse,
  AINotConfiguredError,
  AI_SYSTEM_BASE,
} from "@/lib/ai";
import { buildReportData } from "@/lib/report-data";
import { formatDate } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAIConfigured()) return aiNotConfiguredResponse();

    const data = await buildReportData(params.id);
    if (!data) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const instruction =
      `Write a warm, professional narrative summary (3 short paragraphs) for the ` +
      `event report of "${data.event.name}" (${formatDate(data.event.date)}, ${data.event.location}). ` +
      `Use this data:\n${JSON.stringify({
        theme: data.event.theme,
        attendees: data.event.attendees,
        programme: data.programme.map((p) => p.name),
        rating: data.rating,
        highlights: data.highlights,
        challenges: data.challenges,
        lessons: data.improvements,
        audienceFeedback: data.audienceFeedback,
      })}\n` +
      `This will open a report a partner or sponsor might read. Plain text, no headers.`;

    const narrative = await askClaude(AI_SYSTEM_BASE, instruction, 900);
    return NextResponse.json({ narrative });
  } catch (err) {
    if (err instanceof AINotConfiguredError) return aiNotConfiguredResponse();
    console.error("generate-report", err);
    return NextResponse.json({ error: "Failed to generate narrative" }, { status: 500 });
  }
}
