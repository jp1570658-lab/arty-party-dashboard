import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Full submission incl. revision history — used by the dashboard detail view. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const submission = await prisma.callSheetSubmission.findUnique({
      where: { id: params.id },
      include: { revisions: { orderBy: { createdAt: "desc" } } },
    });
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    return NextResponse.json(submission);
  } catch (err) {
    console.error("GET call-sheet submission", err);
    return NextResponse.json({ error: "Failed to load submission" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.callSheetSubmission.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE call-sheet submission", err);
    return NextResponse.json({ error: "Failed to delete submission" }, { status: 500 });
  }
}
