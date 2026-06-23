import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PdfBuilder } from "@/lib/pdf";
import { formatDate, formatTime } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: { runOfShow: { orderBy: { order: "asc" } } },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const pdf = await PdfBuilder.create();
    pdf.brandHeader();
    pdf.title(`${event.name} — Run of Show`);
    pdf.subtitle(`${formatDate(event.date)}  ·  ${event.location}`);
    pdf.rule();
    pdf.space(12);

    // Column header
    pdf.row(
      [
        { text: "TIME", x: 0, bold: true },
        { text: "DUR", x: 70, bold: true },
        { text: "ITEM", x: 110, bold: true },
        { text: "OWNER", x: 330, bold: true },
        { text: "LOCATION", x: 420, bold: true },
      ],
      9
    );
    pdf.rule();
    pdf.space(8);

    if (event.runOfShow.length === 0) {
      pdf.paragraph("No run-of-show items have been added yet.");
    }

    for (const it of event.runOfShow) {
      pdf.row([
        { text: formatTime(it.time), x: 0, bold: true },
        { text: it.duration ? `${it.duration}m` : "—", x: 70 },
        { text: truncate(it.item, 48), x: 110 },
        { text: truncate(it.owner ?? "—", 16), x: 330 },
        { text: truncate(it.location ?? "—", 18), x: 420 },
      ]);
      if (it.notes) {
        pdf.paragraph(`    - ${it.notes}`, 9);
      }
    }

    const bytes = await pdf.toBytes();
    const filename = `${event.name.replace(/[^a-z0-9]+/gi, "-")}-run-of-show.pdf`;
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("ROS pdf", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
