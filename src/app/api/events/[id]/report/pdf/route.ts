import { NextRequest, NextResponse } from "next/server";
import { buildReportData } from "@/lib/report-data";
import { buildReportPdf } from "@/lib/pdf-report";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await buildReportData(params.id);
    if (!data) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    const bytes = await buildReportPdf(data);
    const filename = `${data.event.name.replace(/[^a-z0-9]+/gi, "-")}-report.pdf`;
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("report pdf", err);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
