import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TEAM_TYPES } from "@/lib/enums";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const members = await prisma.eventTeamMember.findMany({
      where: { eventId: params.id },
      include: { teamMember: true, artist: true },
    });
    return NextResponse.json(members);
  } catch (err) {
    console.error("GET team", err);
    return NextResponse.json({ error: "Failed to load team" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { name, role, teamType, email, phone, notes, artistId } = body;

    if (!teamType || !TEAM_TYPES.includes(teamType)) {
      return NextResponse.json({ error: "Valid teamType required" }, { status: 400 });
    }
    if (!artistId && (!name || !role)) {
      return NextResponse.json({ error: "Name and role required" }, { status: 400 });
    }

    let teamMemberId: string | undefined;
    if (!artistId) {
      const tm = await prisma.teamMember.create({
        data: { name, role, email: email || null, phone: phone || null },
      });
      teamMemberId = tm.id;
    }

    const created = await prisma.eventTeamMember.create({
      data: {
        eventId: params.id,
        teamMemberId,
        artistId: artistId || null,
        role: role || "Media",
        teamType,
        status: "not_asked",
        notes: notes || null,
      },
      include: { teamMember: true, artist: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST team", err);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}
