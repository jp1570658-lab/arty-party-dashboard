import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updated = await prisma.insight.update({
      where: { id: params.id },
      data: {
        ...(body.saved !== undefined && { saved: Boolean(body.saved) }),
        ...(body.dismissed !== undefined && { dismissed: Boolean(body.dismissed) }),
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH insight", err);
    return NextResponse.json({ error: "Failed to update insight" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.insight.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE insight", err);
    return NextResponse.json({ error: "Failed to delete insight" }, { status: 500 });
  }
}
