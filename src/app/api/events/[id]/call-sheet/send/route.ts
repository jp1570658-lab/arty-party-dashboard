import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callSheetPath, resolvePalette } from "@/lib/call-sheet";
import {
  appOrigin,
  emailNotConfiguredResponse,
  emailShell,
  escapeHtml,
  isEmailConfigured,
  sendEmail,
} from "@/lib/email";
import { formatDate, formatTime } from "@/lib/utils";

/** Emails the shared call sheet link to selected booked artists. */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isEmailConfigured()) return emailNotConfiguredResponse();

    const { memberIds } = (await req.json()) as { memberIds?: string[] };
    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: "Select at least one artist" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id: params.id } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const members = await prisma.eventTeamMember.findMany({
      where: { id: { in: memberIds }, eventId: params.id },
      include: { artist: true, teamMember: true },
    });

    const link = appOrigin() + callSheetPath(event.id);
    const accent = resolvePalette(event.callSheetPalette).accent;
    const when = `${formatDate(event.date)} at ${formatTime(event.date)}`;

    const results = [];
    for (const m of members) {
      const name = m.artist?.name ?? m.teamMember?.name ?? "there";
      const to = m.artist?.email ?? m.teamMember?.email ?? null;

      if (!to) {
        results.push({ id: m.id, name, ok: false, error: "No email on file" });
        continue;
      }

      const bodyHtml =
        `<p>Hi ${escapeHtml(name)},</p>` +
        `<p>You're booked for <strong>${escapeHtml(event.name)}</strong> — ${escapeHtml(when)} at ${escapeHtml(event.location)}${event.theme ? `, theme: ${escapeHtml(event.theme)}` : ""}.</p>` +
        `<p>Please fill in your call sheet so we can plan your slot: what you need, when you can arrive, how long you need for sound check, plus your bio and promo material.</p>`;

      const text =
        `Hi ${name},\n\n` +
        `You're booked for ${event.name} — ${when} at ${event.location}${event.theme ? `, theme: ${event.theme}` : ""}.\n\n` +
        `Please fill in your call sheet so we can plan your slot:\n${link}\n\n` +
        `It takes a couple of minutes. Reply to this email if anything is unclear.\n\n— Arty Party`;

      const res = await sendEmail({
        to,
        subject: `Your call sheet for ${event.name}`,
        html: emailShell({
          heading: `Your call sheet for ${event.name}`,
          accent,
          bodyHtml,
          ctaLabel: "Fill in your call sheet",
          ctaHref: link,
          footer: "It takes a couple of minutes. Just reply if anything is unclear.",
        }),
        text,
      });

      if (res.ok) {
        await prisma.eventTeamMember.update({
          where: { id: m.id },
          data: { callSheetSentAt: new Date() },
        });
      }
      results.push({ id: m.id, name, ok: res.ok, error: res.error });
    }

    const sent = results.filter((r) => r.ok).length;
    return NextResponse.json({ sent, total: results.length, results });
  } catch (err) {
    console.error("POST send call sheet", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
