"use client";

import { useState } from "react";
import { Printer, FileDown, Sparkles, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/primitives";
import type { ReportData } from "@/lib/report-data";
import { formatDate, formatTime, formatMoney, cn } from "@/lib/utils";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t py-5">
      <h2 className="section-label">{title}</h2>
      {children}
    </section>
  );
}

export function ReportViewer({ eventId, data }: { eventId: string; data: ReportData }) {
  const [narrative, setNarrative] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/report/narrative`, {
        method: "POST",
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      setNarrative(d.narrative);
      toast.success("Narrative ready");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  }

  const ev = data.event;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div className="text-xs text-ink-muted">
          {ev.status === "COMPLETED" ? "Final report" : "Preview — complete the event for the final version"}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            AI narrative
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <a href={`/api/events/${eventId}/report/pdf`} target="_blank" rel="noreferrer" className="btn-primary">
            <FileDown className="h-4 w-4" />
            Export PDF
          </a>
        </div>
      </div>

      {/* Report body */}
      <div className="card">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-brand-purple">
          Arty-Party
        </div>
        <h1 className="mt-1 text-3xl font-semibold text-ink-primary">{ev.name}</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Event Report · {formatDate(ev.date)} · {ev.location}
        </p>

        {narrative && (
          <div className="mt-4 rounded-lg bg-brand-purple-light p-4">
            <pre className="whitespace-pre-wrap font-sans text-sm text-ink-primary">{narrative}</pre>
          </div>
        )}

        <Section title="Event overview">
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div><dt className="text-ink-muted">Theme</dt><dd className="font-medium text-ink-primary">{ev.theme ?? "—"}</dd></div>
            <div><dt className="text-ink-muted">Attendees</dt><dd className="font-medium text-ink-primary">{ev.attendees ?? "—"}</dd></div>
            <div><dt className="text-ink-muted">Capacity</dt><dd className="font-medium text-ink-primary">{ev.capacity ?? "—"}</dd></div>
            <div>
              <dt className="text-ink-muted">Rating</dt>
              <dd className="flex">
                {data.rating ? (
                  [1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={cn("h-4 w-4", data.rating! >= n ? "fill-amber-400 text-amber-400" : "text-line-strong")} />
                  ))
                ) : "—"}
              </dd>
            </div>
          </dl>
        </Section>

        <Section title="Programme">
          {data.programme.length === 0 ? <p className="text-sm text-ink-muted">No activities recorded.</p> : (
            <ul className="space-y-1 text-sm">
              {data.programme.map((p, i) => (
                <li key={i} className="text-ink-primary">• {p.name}{p.team && <span className="text-ink-muted"> — {p.team}</span>}</li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Team">
          {data.team.length === 0 ? <p className="text-sm text-ink-muted">No team recorded.</p> : (
            <ul className="space-y-1 text-sm">
              {data.team.map((t, i) => (
                <li key={i} className="text-ink-primary">• {t.name} — {t.role} <span className="text-ink-muted">({t.type})</span></li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Partners & sponsors">
          {data.partners.length === 0 ? <p className="text-sm text-ink-muted">No partners recorded.</p> : (
            <ul className="space-y-1 text-sm">
              {data.partners.map((p, i) => (
                <li key={i} className="text-ink-primary">• {p.name} <span className="text-ink-muted capitalize">({p.type})</span></li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Budget summary">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="py-1">Category</th>
                <th className="py-1 text-right">Estimated</th>
                <th className="py-1 text-right">Actual</th>
              </tr>
            </thead>
            <tbody>
              {data.budget.byCategory.map((c, i) => (
                <tr key={i} className="border-t">
                  <td className="py-1 text-ink-primary">{c.category}</td>
                  <td className="py-1 text-right">{formatMoney(c.estimated)}</td>
                  <td className="py-1 text-right">{formatMoney(c.actual)}</td>
                </tr>
              ))}
              <tr className="border-t font-semibold">
                <td className="py-1">Total</td>
                <td className="py-1 text-right">{formatMoney(data.budget.totalEstimated)}</td>
                <td className="py-1 text-right">{formatMoney(data.budget.totalActual)}</td>
              </tr>
            </tbody>
          </table>
          <p className={cn("mt-2 text-sm font-medium", data.budget.variance < 0 ? "text-danger" : "text-success")}>
            {data.budget.variance < 0 ? "Over" : "Under"} budget by {formatMoney(Math.abs(data.budget.variance))}
          </p>
        </Section>

        <Section title="Highlights"><p className="text-sm text-ink-primary">{data.highlights ?? "—"}</p></Section>
        <Section title="Challenges"><p className="text-sm text-ink-primary">{data.challenges ?? "—"}</p></Section>
        <Section title="Audience feedback"><p className="text-sm text-ink-primary">{data.audienceFeedback ?? "—"}</p></Section>
        <Section title="Lessons for next event"><p className="text-sm text-ink-primary">{data.improvements ?? "—"}</p></Section>

        <Section title="Media captured">
          <p className="text-sm text-ink-primary">{data.media.photos} photos · {data.media.videos} videos</p>
        </Section>

        <Section title="Appendix — logistics timeline">
          {data.logistics.length === 0 ? <p className="text-sm text-ink-muted">None.</p> : (
            <ul className="space-y-0.5 text-sm">
              {data.logistics.map((l, i) => (
                <li key={i} className="text-ink-primary"><span className="font-medium tabular-nums">{formatTime(l.time)}</span> · {l.task}</li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
