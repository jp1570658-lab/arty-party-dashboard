import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRunSheet } from "@/lib/run-sheet";

/** Header/contact block for the internal event call sheet. The record (and its
 *  share token) is created on first read so the link always exists. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sheet = await ensureRunSheet(params.id);
    if (!sheet) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json(sheet);
  } catch (err) {
    console.error("GET run-sheet", err);
    return NextResponse.json({ error: "Failed to load call sheet" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const existing = await ensureRunSheet(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const updated = await prisma.eventCallSheet.update({
      where: { eventId: params.id },
      data: {
        ...(body.doorsTime !== undefined && {
          doorsTime: body.doorsTime ? new Date(body.doorsTime) : null,
        }),
        ...(body.address !== undefined && { address: body.address || null }),
        ...(body.parkingNotes !== undefined && { parkingNotes: body.parkingNotes || null }),
        ...(body.keyContacts !== undefined && { keyContacts: body.keyContacts }),
        ...(body.emergencyContact !== undefined && {
          emergencyContact: body.emergencyContact || null,
        }),
        ...(body.nearestHospital !== undefined && {
          nearestHospital: body.nearestHospital || null,
        }),
        ...(body.generalNotes !== undefined && { generalNotes: body.generalNotes || null }),
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH run-sheet", err);
    return NextResponse.json({ error: "Failed to save call sheet" }, { status: 500 });
  }
}
