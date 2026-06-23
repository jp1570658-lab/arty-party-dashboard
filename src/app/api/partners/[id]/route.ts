import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const b = await req.json();
    const fields = ["name", "type", "contactName", "email", "phone", "collabNotes", "website"] as const;
    const data: Record<string, unknown> = {};
    for (const f of fields) if (b[f] !== undefined) data[f] = b[f] || null;
    const partner = await prisma.partner.update({ where: { id: params.id }, data });
    return NextResponse.json(partner);
  } catch (err) {
    console.error("PATCH partner", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.partner.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE partner", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
