import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PdfBuilder } from "@/lib/pdf";
import { ensureRunSheet, parseKeyContacts } from "@/lib/run-sheet";
import { formatDate, formatTime } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sheet = await ensureRunSheet(params.id);
    if (!sheet) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: { logistics: { orderBy: { time: "asc" } } },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const pdf = await PdfBuilder.create();
    pdf.brandHeader();
    pdf.title(`${event.name} — Call Sheet`);
    pdf.subtitle(formatDate(event.date));
    pdf.rule();
    pdf.space(12);

    pdf.heading("Key times");
    pdf.row([
      { text: "Build-up", x: 0, bold: true },
      { text: event.buildUpTime ? formatTime(event.buildUpTime) : "—", x: 90 },
      { text: "Doors", x: 180, bold: true },
      { text: formatTime(sheet.doorsTime ?? event.date), x: 250 },
      { text: "Breakdown", x: 340, bold: true },
      { text: event.breakdownTime ? formatTime(event.breakdownTime) : "—", x: 430 },
    ]);
    pdf.space(6);

    pdf.heading("Schedule");
    pdf.row(
      [
        { text: "WHEN", x: 0, bold: true },
        { text: "WHAT", x: 70, bold: true },
        { text: "WHO", x: 300, bold: true },
        { text: "WHERE", x: 400, bold: true },
      ],
      9
    );
    pdf.rule();
    pdf.space(6);
    if (event.logistics.length === 0) {
      pdf.paragraph("No schedule items yet.");
    }
    for (const l of event.logistics) {
      pdf.row([
        { text: formatTime(l.time), x: 0, bold: true },
        { text: truncate(l.task, 50), x: 70 },
        { text: truncate(l.owner ?? "—", 18), x: 300 },
        { text: truncate(l.location ?? "—", 20), x: 400 },
      ]);
    }
    pdf.space(6);

    const contacts = parseKeyContacts(sheet.keyContacts);
    if (contacts.length > 0) {
      pdf.heading("Key contacts");
      for (const c of contacts) {
        pdf.row([
          { text: c.name, x: 0, bold: true },
          { text: c.role, x: 160 },
          { text: c.phone, x: 340 },
        ]);
      }
      pdf.space(6);
    }

    pdf.heading("Location");
    pdf.paragraph(sheet.address || event.location);
    if (event.venueNotes) pdf.paragraph(event.venueNotes, 9);
    if (sheet.parkingNotes) {
      pdf.space(4);
      pdf.row([{ text: "Parking & access:", x: 0, bold: true }]);
      pdf.paragraph(sheet.parkingNotes, 9);
    }
    pdf.space(6);

    if (sheet.emergencyContact || sheet.nearestHospital) {
      pdf.heading("In an emergency");
      if (sheet.emergencyContact) pdf.paragraph(sheet.emergencyContact);
      if (sheet.nearestHospital) {
        pdf.paragraph(`Nearest hospital: ${sheet.nearestHospital}`);
      }
      pdf.space(6);
    }

    if (sheet.generalNotes) {
      pdf.heading("Notes");
      pdf.paragraph(sheet.generalNotes);
    }

    const bytes = await pdf.toBytes();
    const filename = `${event.name.replace(/[^a-z0-9]+/gi, "-")}-call-sheet.pdf`;
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("run-sheet pdf", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
