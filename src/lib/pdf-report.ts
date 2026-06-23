import { PdfBuilder } from "@/lib/pdf";
import type { ReportData } from "@/lib/report-data";
import { formatDate, formatTime, formatMoney } from "@/lib/utils";

export async function buildReportPdf(data: ReportData): Promise<Uint8Array> {
  const pdf = await PdfBuilder.create();
  const ev = data.event;

  pdf.brandHeader();
  pdf.title(ev.name);
  pdf.subtitle(`Event Report · ${formatDate(ev.date)} · ${ev.location}`);
  pdf.rule();
  pdf.space(10);

  // 1. Overview
  pdf.heading("Event overview");
  pdf.paragraph(`Theme: ${ev.theme ?? "—"}`);
  pdf.paragraph(`Status: ${ev.status}`);
  pdf.paragraph(
    `Attendees: ${ev.attendees ?? "—"}${ev.capacity ? ` of ${ev.capacity} capacity` : ""}`
  );
  if (data.rating) pdf.paragraph(`Overall rating: ${data.rating}/5`);

  // 2. Programme
  pdf.heading("Programme");
  if (data.programme.length === 0) pdf.paragraph("No activities recorded.");
  for (const p of data.programme) {
    pdf.paragraph(`• ${p.name}${p.team ? ` — ${p.team}` : ""}`);
  }

  // 3. Team
  pdf.heading("Team");
  if (data.team.length === 0) pdf.paragraph("No team recorded.");
  for (const t of data.team) {
    pdf.paragraph(`• ${t.name} — ${t.role} (${t.type}, ${t.status})`);
  }

  // 4. Partners
  pdf.heading("Partners & sponsors");
  if (data.partners.length === 0) pdf.paragraph("No partners recorded.");
  for (const p of data.partners) {
    pdf.paragraph(`• ${p.name} (${p.type})${p.role ? ` — ${p.role}` : ""}`);
  }

  // 5. Budget
  pdf.heading("Budget summary");
  pdf.row([
    { text: "Category", x: 0, bold: true },
    { text: "Estimated", x: 280, bold: true },
    { text: "Actual", x: 400, bold: true },
  ]);
  for (const c of data.budget.byCategory) {
    pdf.row([
      { text: c.category, x: 0 },
      { text: formatMoney(c.estimated), x: 280 },
      { text: formatMoney(c.actual), x: 400 },
    ]);
  }
  pdf.space(4);
  pdf.row([
    { text: "Total", x: 0, bold: true },
    { text: formatMoney(data.budget.totalEstimated), x: 280, bold: true },
    { text: formatMoney(data.budget.totalActual), x: 400, bold: true },
  ]);
  pdf.paragraph(
    `Variance: ${data.budget.variance < 0 ? "over" : "under"} budget by ${formatMoney(
      Math.abs(data.budget.variance)
    )}`
  );

  // 6. Highlights
  pdf.heading("Highlights");
  pdf.paragraph(data.highlights ?? "—");

  // 7. Challenges
  pdf.heading("Challenges");
  pdf.paragraph(data.challenges ?? "—");

  // 8. Audience feedback
  pdf.heading("Audience feedback");
  pdf.paragraph(data.audienceFeedback ?? "—");

  // 9. Lessons
  pdf.heading("Lessons for next event");
  pdf.paragraph(data.improvements ?? "—");

  // 10. Media
  pdf.heading("Media captured");
  pdf.paragraph(`${data.media.photos} photos · ${data.media.videos} videos`);

  // 11. Appendix
  pdf.heading("Appendix — logistics timeline");
  if (data.logistics.length === 0) pdf.paragraph("No logistics recorded.");
  for (const l of data.logistics) {
    pdf.row([
      { text: formatTime(l.time), x: 0, bold: true },
      { text: l.task, x: 70 },
    ]);
  }
  pdf.space(6);
  pdf.heading("Appendix — materials");
  pdf.paragraph(data.materials.join(", ") || "—");

  return pdf.toBytes();
}
