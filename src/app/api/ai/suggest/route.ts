import { NextRequest, NextResponse } from "next/server";
import {
  askClaude,
  isAIConfigured,
  aiNotConfiguredResponse,
  AINotConfiguredError,
  AI_SYSTEM_BASE,
} from "@/lib/ai";
import { buildEventMemory, buildCurrentEventContext } from "@/lib/event-memory";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!isAIConfigured()) return aiNotConfiguredResponse();

    const { eventId, message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    const [memory, current] = await Promise.all([
      buildEventMemory(eventId),
      eventId ? buildCurrentEventContext(eventId) : Promise.resolve(null),
    ]);

    const system =
      `${AI_SYSTEM_BASE}\n\n` +
      `Here is context from previous events (your accumulated learning):\n` +
      `${JSON.stringify(memory)}\n\n` +
      (current
        ? `The current event being planned is:\n${JSON.stringify(current)}\n\n`
        : "") +
      `When useful, reference specific past events and the current event's data. ` +
      `Be concrete and concise. Use short paragraphs or bullet points.`;

    const reply = await askClaude(system, message, 1200);
    return NextResponse.json({ reply });
  } catch (err) {
    if (err instanceof AINotConfiguredError) return aiNotConfiguredResponse();
    console.error("ai suggest", err);
    return NextResponse.json({ error: "Failed to get a suggestion" }, { status: 500 });
  }
}
