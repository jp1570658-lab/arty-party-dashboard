import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const b = await req.json();
    const fields = ["name", "email", "phone", "role", "notes"] as const;
    const data: Record<string, unknown> = {};
    for (const f of fields) if (b[f] !== undefined) data[f] = b[f] || null;
    const guest = await prisma.guest.update({ where: { id: params.id }, data });
    return NextResponse.json(guest);
  } catch (err) {
    console.error("PATCH guest", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.guest.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE guest", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
