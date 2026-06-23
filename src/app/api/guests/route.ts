import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const guests = await prisma.guest.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(guests);
  } catch (err) {
    console.error("GET guests", err);
    return NextResponse.json({ error: "Failed to load guests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    if (!b.name) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }
    const guest = await prisma.guest.create({
      data: {
        name: b.name,
        email: b.email || null,
        phone: b.phone || null,
        role: b.role || null,
        notes: b.notes || null,
      },
    });
    return NextResponse.json(guest, { status: 201 });
  } catch (err) {
    console.error("POST guests", err);
    return NextResponse.json({ error: "Failed to create guest" }, { status: 500 });
  }
}
