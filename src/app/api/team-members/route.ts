import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const members = await prisma.teamMember.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(members);
  } catch (err) {
    console.error("GET team-members", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, role, email, phone } = await req.json();
    if (!name || !role) {
      return NextResponse.json({ error: "Name and role required" }, { status: 400 });
    }
    const tm = await prisma.teamMember.create({
      data: { name, role, email: email || null, phone: phone || null },
    });
    return NextResponse.json(tm, { status: 201 });
  } catch (err) {
    console.error("POST team-members", err);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
