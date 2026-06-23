import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const items = await prisma.eventPartner.findMany({
      where: { eventId: params.id },
      include: { partner: true },
    });
    return NextResponse.json(items);
  } catch (err) {
    console.error("GET event partners", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { partnerId, role, notes } = await req.json();
    if (!partnerId) {
      return NextResponse.json({ error: "partnerId required" }, { status: 400 });
    }
    const existing = await prisma.eventPartner.findFirst({
      where: { eventId: params.id, partnerId },
    });
    if (existing) {
      return NextResponse.json({ error: "Partner already attached" }, { status: 409 });
    }
    const created = await prisma.eventPartner.create({
      data: { eventId: params.id, partnerId, role: role || null, notes: notes || null },
      include: { partner: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST event partner", err);
    return NextResponse.json({ error: "Failed to attach" }, { status: 500 });
  }
}
