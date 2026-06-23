import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDefaultActivities } from "@/lib/activities";

export async function GET() {
  try {
    await ensureDefaultActivities(prisma);
    const activities = await prisma.activity.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(activities);
  } catch (err) {
    console.error("GET /activities", err);
    return NextResponse.json({ error: "Failed to load activities" }, { status: 500 });
  }
}
