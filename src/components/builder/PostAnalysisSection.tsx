"use client";

import { useState } from "react";
import { Star, Lock, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Field, Input, Textarea } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

interface Analysis {
  overallRating: number | null;
  totalAttendees: number | null;
  whatWentWell: string | null;
  whatWentWrong: string | null;
  improvements: string | null;
  couldBeBetter: string | null;
  audienceFeedback: string | null;
  teamFeedback: string | null;
  aiSummary: string | null;
}

const EMPTY: Analysis = {
  overallRating: null,
  totalAttendees: null,
  whatWentWell: null,
  whatWentWrong: null,
  improvements: null,
  couldBeBetter: null,
  audienceFeedback: null,
  teamFeedback: null,
  aiSummary: null,
};

const UNLOCKED = ["WRAP_UP", "COMPLETED", "ARCHIVED"];

export function PostAnalysisSection({
  eventId,
  status,
  initial,
}: {
  eventId: string;
  status: string;
  initial: Analysis | null;
}) {
  const [a, setA] = useState<Analysis>(initial ?? EMPTY);
  const [generating, setGenerating] = useState(false);

  const locked = !UNLOCKED.includes(status);

  async function save(patch: Partial<Analysis>) {
    setA((prev) => ({ ...prev, ...patch }));
    try {
      const res = await fetch(`/api/events/${eventId}/analysis`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Failed to save");
    }
  }

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/events/${eventId}/analysis/summary`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setA((prev) => ({ ...prev, aiSummary: data.aiSummary }));
      toast.success("AI takeaways ready");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setGenerating(false);
    }
  }

  if (locked) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed bg-surface-1 px-6 py-10 text-center">
        <Lock className="h-6 w-6 text-ink-muted" />
        <p className="text-sm font-medium text-ink-secondary">
          Post-event analysis unlocks at wrap-up
        </p>
        <p className="max-w-xs text-xs text-ink-muted">
          Set the event status to Wrap-up or Completed (top of this page) to fill
          in your reflection.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-6">
        <div>
          <span className="section-label">Overall rating</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => save({ overallRating: n })} aria-label={`${n} stars`}>
                <Star
                  className={cn(
                    "h-6 w-6 transition-colors",
                    (a.overallRating ?? 0) >= n
                      ? "fill-amber-400 text-amber-400"
                      : "text-line-strong"
                  )}
                />
              </button>
            ))}
          </div>
        </div>
        <Field label="Total attendees">
          <Input
            type="number"
            defaultValue={a.totalAttendees ?? ""}
            onBlur={(e) =>
              save({ totalAttendees: e.target.value === "" ? null : Number(e.target.value) })
            }
            className="w-32"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="What went well">
          <Textarea defaultValue={a.whatWentWell ?? ""} onBlur={(e) => save({ whatWentWell: e.target.value })} />
        </Field>
        <Field label="What went wrong">
          <Textarea defaultValue={a.whatWentWrong ?? ""} onBlur={(e) => save({ whatWentWrong: e.target.value })} />
        </Field>
        <Field label="What could be improved">
          <Textarea defaultValue={a.improvements ?? ""} onBlur={(e) => save({ improvements: e.target.value })} />
        </Field>
        <Field label="What could have been better">
          <Textarea defaultValue={a.couldBeBetter ?? ""} onBlur={(e) => save({ couldBeBetter: e.target.value })} />
        </Field>
        <Field label="Audience feedback">
          <Textarea defaultValue={a.audienceFeedback ?? ""} onBlur={(e) => save({ audienceFeedback: e.target.value })} />
        </Field>
        <Field label="Team feedback">
          <Textarea defaultValue={a.teamFeedback ?? ""} onBlur={(e) => save({ teamFeedback: e.target.value })} />
        </Field>
      </div>

      <div className="rounded-xl border bg-surface-1 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-purple" />
            <span className="section-label mb-0">AI takeaways</span>
          </div>
          <button onClick={generate} disabled={generating} className="btn-primary px-3 py-1.5 text-sm">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {a.aiSummary ? "Regenerate" : "Generate takeaways"}
          </button>
        </div>
        {a.aiSummary ? (
          <pre className="whitespace-pre-wrap font-sans text-sm text-ink-primary">{a.aiSummary}</pre>
        ) : (
          <p className="text-sm text-ink-muted">
            Once you&apos;ve filled in your reflection, generate a concise set of
            lessons to carry into the next event.
          </p>
        )}
      </div>
    </div>
  );
}
