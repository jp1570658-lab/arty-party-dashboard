import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

// The project spec (CLAUDE.md) explicitly specifies this model.
export const AI_MODEL = "claude-sonnet-4-6";

export class AINotConfiguredError extends Error {
  constructor() {
    super("AI is not configured");
    this.name = "AINotConfiguredError";
  }
}

export function isAIConfigured(): boolean {
  const k = process.env.ANTHROPIC_API_KEY;
  return !!k && k.trim().length > 0 && k !== "your_key_here";
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }
  return client;
}

/**
 * Single-shot text call to Claude. Throws AINotConfiguredError when no key is
 * present so callers can return a friendly message instead of crashing.
 */
export async function askClaude(
  system: string,
  user: string,
  maxTokens = 2048
): Promise<string> {
  if (!isAIConfigured()) throw new AINotConfiguredError();

  const message = await getClient().messages.create({
    model: AI_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });

  const block = message.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }
  return block.text.trim();
}

/**
 * Single-shot call with a PDF document attached (Claude reads the PDF natively).
 */
export async function askClaudeWithPdf(
  system: string,
  instruction: string,
  pdfBase64: string,
  maxTokens = 2048
): Promise<string> {
  if (!isAIConfigured()) throw new AINotConfiguredError();

  const message = await getClient().messages.create({
    model: AI_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdfBase64,
            },
          },
          { type: "text", text: instruction },
        ],
      },
    ],
  });

  const block = message.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }
  return block.text.trim();
}

/** Best-effort extraction of a JSON object/array embedded in model text. */
export function extractJson<T = unknown>(text: string): T | null {
  // Strip ```json fences if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  if (start === -1) return null;
  // Find matching end by scanning from the last closing bracket
  const end = Math.max(candidate.lastIndexOf("}"), candidate.lastIndexOf("]"));
  if (end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

/** Standard 503 response for AI routes when the key is missing. */
export function aiNotConfiguredResponse() {
  return NextResponse.json(
    {
      error:
        "AI features need an Anthropic API key. Add ANTHROPIC_API_KEY to .env.local and restart.",
      code: "AI_NOT_CONFIGURED",
    },
    { status: 503 }
  );
}

export const AI_SYSTEM_BASE =
  "You are an AI assistant for Arty-Party, a recurring arts and culture event series " +
  "(live painting, poetry, music, DJ sets, exhibitions, pottery, and a media team). " +
  "You help plan events, suggest improvements, and write communications. " +
  "Be concise, practical, and warm — like an experienced event producer.";
