import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const items = await prisma.guestInvite.findMany({
      where: { eventId: params.id },
      include: { guest: true },
    });
    return NextResponse.json(items);
  } catch (err) {
    console.error("GET event guests", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { guestId } = await req.json();
    if (!guestId) {
      return NextResponse.json({ error: "guestId required" }, { status: 400 });
    }
    const existing = await prisma.guestInvite.findFirst({
      where: { eventId: params.id, guestId },
    });
    if (existing) {
      return NextResponse.json({ error: "Guest already invited" }, { status: 409 });
    }
    const created = await prisma.guestInvite.create({
      data: { eventId: params.id, guestId, status: "pending" },
      include: { guest: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST event guest", err);
    return NextResponse.json({ error: "Failed to invite" }, { status: 500 });
  }
}
