import { NextRequest, NextResponse } from "next/server";
import {
  askClaude,
  isAIConfigured,
  aiNotConfiguredResponse,
  AINotConfiguredError,
  AI_SYSTEM_BASE,
} from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!isAIConfigured()) return aiNotConfiguredResponse();

    const { type, event, recipient } = await req.json();

    let instruction: string;
    if (type === "collab") {
      instruction =
        `Write a warm, professional outreach email proposing a collaboration with ` +
        `${recipient?.name ?? "a potential partner"} (${recipient?.type ?? "partner"}). ` +
        `It is for the Arty-Party event "${event?.name ?? "an upcoming event"}"` +
        `${event?.date ? ` on ${event.date}` : ""}${event?.location ? ` at ${event.location}` : ""}. ` +
        `${recipient?.collabNotes ? `Context on the relationship: ${recipient.collabNotes}. ` : ""}` +
        `Keep it under 180 words. Return the email body only (a subject line on the first line as "Subject: ...").`;
    } else {
      instruction =
        `Write a personalised invitation email to ${recipient?.name ?? "a guest"}` +
        `${recipient?.role ? ` (${recipient.role})` : ""} for the Arty-Party event ` +
        `"${event?.name ?? "an upcoming event"}"${event?.date ? ` on ${event.date}` : ""}` +
        `${event?.location ? ` at ${event.location}` : ""}` +
        `${event?.theme ? `, themed "${event.theme}"` : ""}. ` +
        `Make it inviting and personal, under 150 words. Return the email body only ` +
        `(a subject line on the first line as "Subject: ...").`;
    }

    const email = await askClaude(AI_SYSTEM_BASE, instruction, 700);
    return NextResponse.json({ email });
  } catch (err) {
    if (err instanceof AINotConfiguredError) return aiNotConfiguredResponse();
    console.error("generate-email", err);
    return NextResponse.json({ error: "Failed to generate email" }, { status: 500 });
  }
}
