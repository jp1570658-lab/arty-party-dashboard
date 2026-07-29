import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { aiErrorResponse } from "@/lib/ai";
import { runDailyInsights } from "@/lib/insights";

// A search-backed run takes minutes; give it the platform maximum.
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeDismissed = searchParams.get("dismissed") === "true";

    const insights = await prisma.insight.findMany({
      where: includeDismissed ? undefined : { dismissed: false },
      orderBy: [{ batchDate: "desc" }, { createdAt: "asc" }],
      take: 200,
    });
    return NextResponse.json(insights);
  } catch (err) {
    console.error("GET insights", err);
    return NextResponse.json({ error: "Failed to load insights" }, { status: 500 });
  }
}

/** Runs a fresh insight batch on demand. Billed per web search — see MAX_SEARCHES. */
export async function POST() {
  try {
    const { created, batchDate } = await runDailyInsights();
    if (created === 0) {
      return NextResponse.json(
        { error: "The research came back empty. Try again in a moment." },
        { status: 502 }
      );
    }
    return NextResponse.json({ created, batchDate });
  } catch (err) {
    const mapped = aiErrorResponse(err);
    if (mapped) return mapped;
    console.error("POST insights", err);
    return NextResponse.json({ error: "Failed to gather insights" }, { status: 500 });
  }
}
