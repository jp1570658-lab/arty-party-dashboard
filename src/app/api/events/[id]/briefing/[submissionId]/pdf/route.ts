import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PdfBuilder } from "@/lib/pdf";
import { buildBriefing } from "@/lib/briefing";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; submissionId: string } }
) {
  try {
    const [event, submission] = await Promise.all([
      prisma.event.findUnique({ where: { id: params.id } }),
      prisma.callSheetSubmission.findUnique({ where: { id: params.submissionId } }),
    ]);

    if (!event || !submission || submission.eventId !== event.id) {
      return NextResponse.json({ error: "Briefing not found" }, { status: 404 });
    }

    const briefing = buildBriefing(event, submission);

    const pdf = await PdfBuilder.create();
    pdf.brandHeader();
    pdf.title(briefing.title);
    pdf.subtitle(`Prepared for ${briefing.artistName}`);
    pdf.rule();
    pdf.space(12);

    for (const section of briefing.sections) {
      pdf.heading(section.heading);
      for (const l of section.lines) {
        pdf.row([
          { text: `${l.label}:`, x: 0, bold: true },
          { text: l.value, x: 130 },
        ]);
      }
      for (const block of section.blocks ?? []) {
        pdf.space(4);
        pdf.row([{ text: `${block.label}:`, x: 0, bold: true }]);
        for (const para of block.text.split(/\n+/)) {
          if (para.trim()) pdf.paragraph(para.trim());
        }
      }
      pdf.space(6);
    }

    if (briefing.links.length > 0) {
      pdf.heading("Files & links");
      for (const l of briefing.links) {
        pdf.row([{ text: `${l.label}:`, x: 0, bold: true }]);
        pdf.paragraph(l.href, 9);
      }
    }

    const bytes = await pdf.toBytes();
    const filename = `${event.name.replace(/[^a-z0-9]+/gi, "-")}-briefing-${briefing.artistName.replace(/[^a-z0-9]+/gi, "-")}.pdf`;
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("briefing pdf", err);
    return NextResponse.json({ error: "Failed to generate briefing" }, { status: 500 });
  }
}
