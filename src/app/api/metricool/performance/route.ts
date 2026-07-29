import { NextRequest, NextResponse } from "next/server";
import {
  MetricoolNotConfiguredError,
  fetchPerformance,
  metricoolConfig,
} from "@/lib/metricool";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const days = Math.min(Math.max(Number(searchParams.get("days")) || 30, 7), 180);

  if (!metricoolConfig().configured) {
    return NextResponse.json(
      {
        configured: false,
        error:
          "Connect your social accounts in Metricool, then add METRICOOL_API_TOKEN, METRICOOL_USER_ID and METRICOOL_BLOG_ID. API access needs Metricool's Advanced plan.",
      },
      { status: 200 }
    );
  }

  try {
    const data = await fetchPerformance(days);
    return NextResponse.json({ configured: true, ...data });
  } catch (err) {
    if (err instanceof MetricoolNotConfiguredError) {
      return NextResponse.json({ configured: false }, { status: 200 });
    }
    console.error("GET metricool performance", err);
    return NextResponse.json(
      {
        configured: true,
        error: err instanceof Error ? err.message : "Failed to load performance",
      },
      { status: 200 }
    );
  }
}
