import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import {
  appOrigin,
  emailNotConfiguredResponse,
  emailShell,
  escapeHtml,
  isEmailConfigured,
  sendEmail,
} from "@/lib/email";
import { resolvePalette } from "@/lib/call-sheet";
import { formatDate, formatTime } from "@/lib/utils";

/** Emails event invitations with a personal RSVP link to selected guests. */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isEmailConfigured()) return emailNotConfiguredResponse();

    const { inviteIds } = (await req.json()) as { inviteIds?: string[] };
    if (!Array.isArray(inviteIds) || inviteIds.length === 0) {
      return NextResponse.json({ error: "Select at least one guest" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id: params.id } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const invites = await prisma.guestInvite.findMany({
      where: { id: { in: inviteIds }, eventId: params.id },
      include: { guest: true },
    });

    const accent = resolvePalette(event.callSheetPalette).accent;
    const when = `${formatDate(event.date)} at ${formatTime(event.date)}`;
    const origin = appOrigin();

    const results = [];
    for (const inv of invites) {
      const to = inv.guest.email;
      if (!to) {
        results.push({ id: inv.id, name: inv.guest.name, ok: false, error: "No email on file" });
        continue;
      }

      // Stable per-invite token so re-sends keep the same RSVP link.
      const token = inv.rsvpToken ?? randomUUID();
      const rsvpUrl = `${origin}/rsvp/${token}`;

      const bodyHtml =
        `<p>Hi ${escapeHtml(inv.guest.name)},</p>` +
        `<p>You're invited to <strong>${escapeHtml(event.name)}</strong> — ${escapeHtml(when)} at ${escapeHtml(event.location)}.</p>` +
        (event.theme ? `<p>This one's themed <strong>${escapeHtml(event.theme)}</strong>.</p>` : "") +
        `<p>Let us know if you can make it so we can plan numbers.</p>`;

      const text =
        `Hi ${inv.guest.name},\n\n` +
        `You're invited to ${event.name} — ${when} at ${event.location}.\n` +
        (event.theme ? `Theme: ${event.theme}\n` : "") +
        `\nLet us know if you can make it:\n${rsvpUrl}\n\n— Arty Party`;

      const res = await sendEmail({
        to,
        subject: `You're invited: ${event.name}`,
        html: emailShell({
          heading: `You're invited to ${event.name}`,
          accent,
          bodyHtml,
          ctaLabel: "RSVP",
          ctaHref: rsvpUrl,
          footer: "Can't make it? Let us know with the same link.",
        }),
        text,
      });

      if (res.ok) {
        await prisma.guestInvite.update({
          where: { id: inv.id },
          data: { rsvpToken: token, sentAt: new Date(), status: "sent" },
        });
      }
      results.push({ id: inv.id, name: inv.guest.name, ok: res.ok, error: res.error });
    }

    const sent = results.filter((r) => r.ok).length;
    return NextResponse.json({ sent, total: results.length, results });
  } catch (err) {
    console.error("POST send invites", err);
    return NextResponse.json({ error: "Failed to send invitations" }, { status: 500 });
  }
}
