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
 * Single-shot call with the server-side web search tool enabled, for anything
 * that needs information past the model's training cutoff.
 *
 * Web search runs on Anthropic's side and is billed per search ($10/1000) on
 * top of tokens, so `maxSearches` is a hard cost ceiling — keep it low.
 * A long search turn can stop with `pause_turn`; resuming is just re-sending
 * the conversation, which the loop below does.
 */
export async function askClaudeWithWebSearch(
  system: string,
  user: string,
  { maxTokens = 4096, maxSearches = 5 } = {}
): Promise<string> {
  if (!isAIConfigured()) throw new AINotConfiguredError();

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: user }];
  let message: Anthropic.Message | null = null;

  // Bounded tightly: each resume re-runs the search budget, multiplying both
  // cost and latency, and the whole call has to fit a serverless timeout.
  for (let i = 0; i < 2; i++) {
    message = await getClient().messages.create({
      model: AI_MODEL,
      max_tokens: maxTokens,
      system,
      messages,
      tools: [
        {
          // Basic variant deliberately: the _20260209 version adds dynamic
          // filtering, which runs code execution under the hood and roughly
          // triples wall-clock time. This call has to finish inside a
          // serverless timeout, and we post-filter the results ourselves.
          type: "web_search_20250305",
          name: "web_search",
          max_uses: maxSearches,
        } as unknown as Anthropic.ToolUnion,
      ],
    });

    if (message.stop_reason !== "pause_turn") break;
    // Re-send with the paused turn appended; the server picks up where it left off.
    messages.push({ role: "assistant", content: message.content });
  }

  const text = (message?.content ?? [])
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  if (!text) throw new Error("Claude returned no text from the search");
  return text;
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

/**
 * Maps an AI failure to a response the user can act on. Billing and auth
 * problems are the common ones in practice and are indistinguishable from a
 * generic 500 unless the API's own message is surfaced.
 */
export function aiErrorResponse(err: unknown) {
  if (err instanceof AINotConfiguredError) return aiNotConfiguredResponse();

  if (err instanceof Anthropic.APIError) {
    const detail =
      (err.error as { error?: { message?: string } } | undefined)?.error?.message ??
      err.message;

    if (err.status === 400 && /credit balance/i.test(detail)) {
      return NextResponse.json(
        {
          error:
            "Your Anthropic account is out of credit, so AI features can't run. Top up at console.anthropic.com under Plans & Billing.",
          code: "AI_NO_CREDIT",
        },
        { status: 402 }
      );
    }
    if (err.status === 401) {
      return NextResponse.json(
        { error: "The Anthropic API key was rejected. Check ANTHROPIC_API_KEY.", code: "AI_UNAUTHORIZED" },
        { status: 401 }
      );
    }
    if (err.status === 429) {
      return NextResponse.json(
        { error: "Anthropic rate limit hit. Wait a moment and try again.", code: "AI_RATE_LIMITED" },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: detail, code: "AI_ERROR" }, { status: 502 });
  }

  return null;
}

export const AI_SYSTEM_BASE =
  "You are an AI assistant for Arty-Party, a recurring arts and culture event series " +
  "(live painting, poetry, music, DJ sets, exhibitions, pottery, and a media team). " +
  "You help plan events, suggest improvements, and write communications. " +
  "Be concise, practical, and warm — like an experienced event producer.";
