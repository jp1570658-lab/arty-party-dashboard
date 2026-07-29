import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/db";
import { buildBriefing } from "@/lib/briefing";
import { resolvePalette } from "@/lib/call-sheet";

export const dynamic = "force-dynamic";

export default async function BriefingPage({
  params,
}: {
  params: { id: string; submissionId: string };
}) {
  const [event, submission] = await Promise.all([
    prisma.event.findUnique({ where: { id: params.id } }),
    prisma.callSheetSubmission.findUnique({ where: { id: params.submissionId } }),
  ]);

  if (!event || !submission || submission.eventId !== event.id) notFound();

  const briefing = buildBriefing(event, submission);
  const palette = resolvePalette(event.callSheetPalette);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/events/${event.id}`} className="btn-ghost">
          <ArrowLeft className="h-4 w-4" />
          Back to event
        </Link>
        <a
          href={`/api/events/${event.id}/briefing/${submission.id}/pdf`}
          className="btn-primary"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </a>
      </div>

      <article className="card space-y-8">
        <header>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: palette.accent }}
          >
            Arty Party
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-ink-primary">
            {briefing.title}
          </h1>
          <p className="mt-2 text-sm text-ink-secondary">
            Prepared for{" "}
            <span className="font-medium text-ink-primary">{briefing.artistName}</span>
          </p>
          <div
            className="mt-5 h-1 w-16 rounded-full"
            style={{ backgroundColor: palette.accent }}
          />
        </header>

        {briefing.sections.map((section) => (
          <section key={section.heading} className="space-y-3">
            <h2 className="section-label mb-0">{section.heading}</h2>
            {section.lines.length > 0 && (
              <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {section.lines.map((l) => (
                  <div key={l.label} className="flex flex-col">
                    <dt className="text-xs text-ink-muted">{l.label}</dt>
                    <dd className="text-sm text-ink-primary">{l.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {section.blocks?.map((b) => (
              <div key={b.label} className="rounded-lg bg-surface-2 p-4">
                <p className="mb-1 text-xs text-ink-muted">{b.label}</p>
                <p className="whitespace-pre-line text-sm text-ink-primary">{b.text}</p>
              </div>
            ))}
          </section>
        ))}

        {briefing.links.length > 0 && (
          <section className="space-y-3">
            <h2 className="section-label mb-0">Files &amp; links</h2>
            <ul className="space-y-2">
              {briefing.links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-brand-purple hover:underline"
                  >
                    {l.label}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  );
}
