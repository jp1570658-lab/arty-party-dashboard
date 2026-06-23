import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const partners = await prisma.partner.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { events: true } } },
    });
    return NextResponse.json(partners);
  } catch (err) {
    console.error("GET partners", err);
    return NextResponse.json({ error: "Failed to load partners" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    if (!b.name || !b.type) {
      return NextResponse.json({ error: "Name and type required" }, { status: 400 });
    }
    const partner = await prisma.partner.create({
      data: {
        name: b.name,
        type: b.type,
        contactName: b.contactName || null,
        email: b.email || null,
        phone: b.phone || null,
        collabNotes: b.collabNotes || null,
        website: b.website || null,
      },
    });
    return NextResponse.json(partner, { status: 201 });
  } catch (err) {
    console.error("POST partners", err);
    return NextResponse.json({ error: "Failed to create partner" }, { status: 500 });
  }
}
