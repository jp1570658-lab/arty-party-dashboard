import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

function mediaType(mime: string): "PHOTO" | "VIDEO" | "DOCUMENT" {
  if (mime.startsWith("image/")) return "PHOTO";
  if (mime.startsWith("video/")) return "VIDEO";
  return "DOCUMENT";
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const eventId = form.get("eventId") as string | null;
    const files = form.getAll("files") as File[];

    if (!eventId || files.length === 0) {
      return NextResponse.json({ error: "eventId and files required" }, { status: 400 });
    }

    const dir = path.join(process.cwd(), "public", "uploads", "events", eventId);
    await mkdir(dir, { recursive: true });

    const created = [];
    for (const file of files) {
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: `${file.name} is too large (max 50MB)` },
          { status: 400 }
        );
      }
      const ext = path.extname(file.name) || "";
      const stored = `${randomUUID()}${ext}`;
      const bytes = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(dir, stored), bytes);

      const media = await prisma.mediaFile.create({
        data: {
          eventId,
          type: mediaType(file.type),
          url: `/uploads/events/${eventId}/${stored}`,
          filename: file.name,
        },
      });
      created.push(media);
    }

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST upload", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
