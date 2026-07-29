import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { saveUpload } from "@/lib/storage";
import { callSheetSubmissionSchema } from "@/lib/validation";
import { artistNameKey, isAllowedUpload, MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/call-sheet";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const submissions = await prisma.callSheetSubmission.findMany({
      where: { eventId: params.id },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { revisions: true } } },
    });
    return NextResponse.json(submissions);
  } catch (err) {
    console.error("GET call-sheet", err);
    return NextResponse.json({ error: "Failed to load submissions" }, { status: 500 });
  }
}

/** Public endpoint — the shared per-event link posts here. */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const form = await req.formData();
    const text = (key: string) => {
      const v = form.get(key);
      return typeof v === "string" ? v : undefined;
    };

    const parsed = callSheetSubmissionSchema.safeParse({
      name: text("name") ?? "",
      artistName: text("artistName") ?? "",
      email: text("email") ?? "",
      socialHandles: text("socialHandles"),
      bio: text("bio"),
      promoMediaLink: text("promoMediaLink"),
      requirements: text("requirements"),
      arrivalTime: text("arrivalTime"),
      soundCheckDuration: text("soundCheckDuration"),
      materialsLink: text("materialsLink"),
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const d = parsed.data;

    // Files are optional; both are size- and type-checked server-side even
    // though the form also checks client-side.
    const uploads: Record<"promo" | "materials", { url: string; filename: string } | null> = {
      promo: null,
      materials: null,
    };

    for (const kind of ["promo", "materials"] as const) {
      const field = kind === "promo" ? "promoMediaFile" : "materialsFile";
      const file = form.get(field);
      if (!(file instanceof File) || file.size === 0) continue;

      if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json(
          { error: `${file.name} is too large (max ${MAX_UPLOAD_LABEL})` },
          { status: 400 }
        );
      }
      const mime = file.type || "application/octet-stream";
      if (!isAllowedUpload(kind, mime)) {
        return NextResponse.json(
          { error: `${file.name} is not an accepted file type` },
          { status: 400 }
        );
      }
      const ext = path.extname(file.name) || "";
      const key = `uploads/call-sheets/${params.id}/${randomUUID()}${ext}`;
      const url = await saveUpload(key, Buffer.from(await file.arrayBuffer()), mime);
      uploads[kind] = { url, filename: file.name };
    }

    const key = artistNameKey(d.artistName);
    const existing = await prisma.callSheetSubmission.findUnique({
      where: { eventId_artistNameKey: { eventId: params.id, artistNameKey: key } },
    });

    const fields = {
      name: d.name,
      artistName: d.artistName.trim(),
      email: d.email,
      socialHandles: d.socialHandles,
      bio: d.bio,
      promoMediaLink: d.promoMediaLink,
      requirements: d.requirements,
      arrivalTime: d.arrivalTime,
      soundCheckDuration: d.soundCheckDuration,
      materialsLink: d.materialsLink,
    };

    if (!existing) {
      const created = await prisma.callSheetSubmission.create({
        data: {
          eventId: params.id,
          artistNameKey: key,
          ...fields,
          promoMediaUrl: uploads.promo?.url ?? null,
          promoMediaFilename: uploads.promo?.filename ?? null,
          materialsUrl: uploads.materials?.url ?? null,
          materialsFilename: uploads.materials?.filename ?? null,
        },
      });
      return NextResponse.json({ id: created.id, updated: false }, { status: 201 });
    }

    // Resubmission: latest wins, previous version archived. A new upload
    // replaces the old one; submitting without a file keeps what we already have.
    const updated = await prisma.$transaction(async (tx) => {
      await tx.callSheetRevision.create({
        data: {
          submissionId: existing.id,
          data: JSON.parse(JSON.stringify(existing)),
        },
      });
      return tx.callSheetSubmission.update({
        where: { id: existing.id },
        data: {
          ...fields,
          ...(uploads.promo && {
            promoMediaUrl: uploads.promo.url,
            promoMediaFilename: uploads.promo.filename,
          }),
          ...(uploads.materials && {
            materialsUrl: uploads.materials.url,
            materialsFilename: uploads.materials.filename,
          }),
        },
      });
    });

    return NextResponse.json({ id: updated.id, updated: true }, { status: 200 });
  } catch (err) {
    console.error("POST call-sheet", err);
    return NextResponse.json({ error: "Failed to save your call sheet" }, { status: 500 });
  }
}
