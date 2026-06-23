import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const b = await req.json();
    const data: Record<string, unknown> = {};
    if (b.category !== undefined) data.category = b.category;
    if (b.name !== undefined) data.name = b.name;
    if (b.estimated !== undefined) data.estimated = Number(b.estimated) || 0;
    if (b.actual !== undefined)
      data.actual = b.actual === null || b.actual === "" ? null : Number(b.actual);
    if (b.paid !== undefined) data.paid = !!b.paid;
    if (b.notes !== undefined) data.notes = b.notes || null;

    const item = await prisma.budgetItem.update({ where: { id: params.id }, data });
    return NextResponse.json(item);
  } catch (err) {
    console.error("PATCH budget item", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.budgetItem.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE budget item", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
