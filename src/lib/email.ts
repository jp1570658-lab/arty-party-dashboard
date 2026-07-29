import { NextResponse } from "next/server";
import { Resend } from "resend";

// Mirrors the shape of src/lib/ai.ts: routes degrade to a friendly 503 when no
// key is configured, rather than crashing.

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("Email is not configured");
    this.name = "EmailNotConfiguredError";
  }
}

export function isEmailConfigured(): boolean {
  const k = process.env.RESEND_API_KEY;
  return !!k && k.trim().length > 0 && k !== "your_key_here";
}

/** Verified sender. Resend's onboarding@resend.dev works before domain setup. */
export function fromAddress(): string {
  return process.env.EMAIL_FROM || "Arty Party <onboarding@resend.dev>";
}

let client: Resend | null = null;
function getClient(): Resend {
  if (!client) client = new Resend(process.env.RESEND_API_KEY!);
  return client;
}

export interface SendResult {
  to: string;
  ok: boolean;
  error?: string;
}

/** Send one email. Never throws for per-recipient failures — returns a result. */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<SendResult> {
  if (!isEmailConfigured()) throw new EmailNotConfiguredError();

  try {
    const { error } = await getClient().emails.send({
      from: fromAddress(),
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      ...(opts.replyTo && { replyTo: opts.replyTo }),
    });
    if (error) return { to: opts.to, ok: false, error: error.message };
    return { to: opts.to, ok: true };
  } catch (err) {
    return {
      to: opts.to,
      ok: false,
      error: err instanceof Error ? err.message : "Send failed",
    };
  }
}

export function emailNotConfiguredResponse() {
  return NextResponse.json(
    {
      error:
        "Email sending needs a Resend API key. Add RESEND_API_KEY to .env.local (and EMAIL_FROM once your domain is verified), then restart.",
      code: "EMAIL_NOT_CONFIGURED",
    },
    { status: 503 }
  );
}

/* ---------- Shared HTML shell ---------- */

/** Minimal, client-safe email layout — inline styles, no external assets. */
export function emailShell(opts: {
  heading: string;
  accent?: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaHref?: string;
  footer?: string;
}): string {
  const accent = opts.accent || "#7C3AED";
  const cta =
    opts.ctaHref && opts.ctaLabel
      ? `<p style="margin:28px 0 0"><a href="${opts.ctaHref}" style="background:${accent};color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;display:inline-block">${opts.ctaLabel}</a></p>`
      : "";
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f9fafb">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;padding:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#111827">
<tr><td>
<p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${accent}">Arty Party</p>
<h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;color:#111827">${opts.heading}</h1>
<div style="font-size:15px;line-height:1.6;color:#374151">${opts.bodyHtml}</div>
${cta}
${opts.footer ? `<p style="margin:28px 0 0;padding-top:18px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">${opts.footer}</p>` : ""}
</td></tr></table>
</td></tr></table>
</body></html>`;
}

/** Absolute origin for links inside emails. */
export function appOrigin(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
