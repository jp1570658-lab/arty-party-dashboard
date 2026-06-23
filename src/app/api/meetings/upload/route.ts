import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import {
  askClaudeWithPdf,
  extractJson,
  isAIConfigured,
  AI_SYSTEM_BASE,
} from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Extracted {
  summary?: string;
  decisions?: string[];
  actionItems?: { text: string; owner?: string }[];
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const eventId = form.get("eventId") as string | null;
    const eventName = (form.get("eventName") as string) || "the event";
    let meetingId = form.get("meetingId") as string | null;

    if (!file || !eventId) {
      return NextResponse.json(
        { error: "file and eventId are required" },
        { status: 400 }
      );
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    // Save to /public/uploads/meetings
    const dir = path.join(process.cwd(), "public", "uploads", "meetings");
    await mkdir(dir, { recursive: true });
    const filename = `${randomUUID()}.pdf`;
    await writeFile(path.join(dir, filename), bytes);
    const pdfPath = `/uploads/meetings/${filename}`;

    // Create or update the meeting record
    if (!meetingId) {
      const created = await prisma.meeting.create({
        data: {
          eventId,
          title: file.name.replace(/\.pdf$/i, "") || "Meeting",
          date: new Date(),
          pdfPath,
        },
      });
      meetingId = created.id;
    } else {
      await prisma.meeting.update({ where: { id: meetingId }, data: { pdfPath } });
    }

    // Best-effort AI extraction
    let aiError: string | null = null;
    if (isAIConfigured()) {
      try {
        const instruction =
          `You are analysing a meeting transcript for an arts event called "${eventName}". ` +
          `Extract the following and return ONLY valid JSON, no prose:\n` +
          `{"summary": "2-sentence summary", "decisions": ["key decision", ...], ` +
          `"actionItems": [{"text": "task", "owner": "name or empty"}, ...]}`;
        const raw = await askClaudeWithPdf(AI_SYSTEM_BASE, instruction, bytes.toString("base64"));
        const parsed = extractJson<Extracted>(raw);
        if (parsed) {
          await prisma.meeting.update({
            where: { id: meetingId },
            data: {
              summary: parsed.summary ?? undefined,
              decisions: parsed.decisions ?? undefined,
              actionItems: parsed.actionItems ?? undefined,
            },
          });
        }
      } catch (e) {
        console.error("AI extraction failed", e);
        aiError = "AI extraction failed — you can fill the fields manually.";
      }
    } else {
      aiError = "Add an Anthropic API key to auto-extract summary and action items.";
    }

    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    return NextResponse.json({ meeting, aiError });
  } catch (err) {
    console.error("POST meeting upload", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
