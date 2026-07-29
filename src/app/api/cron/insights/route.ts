import { NextRequest, NextResponse } from "next/server";
import { runDailyInsights } from "@/lib/insights";

export const maxDuration = 300;

/**
 * Daily insight batch, fired by the Vercel cron in vercel.json.
 *
 * This endpoint spends money (one AI call plus up to MAX_SEARCHES web searches),
 * so it refuses anything that can't prove it's the scheduler: Vercel signs cron
 * requests with CRON_SECRET as a bearer token. With no secret set, the route
 * stays closed rather than defaulting open.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not set — the scheduled run is disabled." },
      { status: 503 }
    );
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { created, batchDate } = await runDailyInsights();
    return NextResponse.json({ ok: true, created, batchDate });
  } catch (err) {
    console.error("cron insights", err);
    // Return 200 so a transient AI failure doesn't get retried into a bill.
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed" },
      { status: 200 }
    );
  }
}
