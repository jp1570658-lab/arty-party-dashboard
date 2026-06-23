import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const material = await prisma.material.update({
      where: { id: params.id },
      data: {
        ...(body.checked !== undefined && { checked: body.checked }),
        ...(body.name !== undefined && { name: body.name }),
        ...(body.quantity !== undefined && { quantity: body.quantity }),
        ...(body.source !== undefined && { source: body.source }),
      },
    });
    return NextResponse.json(material);
  } catch (err) {
    console.error("PATCH material", err);
    return NextResponse.json({ error: "Failed to update material" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.material.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE material", err);
    return NextResponse.json({ error: "Failed to delete material" }, { status: 500 });
  }
}
