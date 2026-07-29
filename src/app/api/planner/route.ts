import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PLANNER_KINDS } from "@/lib/enums";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const tasks = await prisma.plannerTask.findMany({
      where:
        from && to
          ? { date: { gte: new Date(from), lte: new Date(to) } }
          : undefined,
      orderBy: { date: "asc" },
      include: { event: { select: { id: true, name: true } } },
    });
    return NextResponse.json(tasks);
  } catch (err) {
    console.error("GET planner", err);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title || !body.date) {
      return NextResponse.json({ error: "Title and date are required" }, { status: 400 });
    }
    const kind = PLANNER_KINDS.includes(body.kind) ? body.kind : "TASK";

    const created = await prisma.plannerTask.create({
      data: {
        title: String(body.title).slice(0, 200),
        date: new Date(body.date),
        kind,
        notes: body.notes || null,
        eventId: body.eventId || null,
      },
      include: { event: { select: { id: true, name: true } } },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST planner", err);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
