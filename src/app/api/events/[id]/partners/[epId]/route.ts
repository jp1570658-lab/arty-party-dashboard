import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; epId: string } }
) {
  try {
    await prisma.eventPartner.delete({ where: { id: params.epId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE event partner", err);
    return NextResponse.json({ error: "Failed to remove" }, { status: 500 });
  }
}
