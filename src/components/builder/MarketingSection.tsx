"use client";

import { useState } from "react";
import { Sparkles, Wand2, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CampaignCalendar } from "@/components/marketing/CampaignCalendar";
import { ChipInput } from "@/components/ui/ChipInput";
import { Button, Field, Input, Textarea } from "@/components/ui/primitives";
import { suggestedDeadlines } from "@/lib/marketing";

interface PlanData {
  posterDeadline: string | null;
  flyerPrintDeadline: string | null;
  flyerDistributionDate: string | null;
  onlinePostStart: string | null;
  posterLocations: string[] | null;
  flyerLocations: string[] | null;
  instagramStoryPlan: string | null;
  instagramFeedPlan: string | null;
  tiktokPlan: string | null;
  specialInvites: string | null;
  campaignBrief: string | null;
}

const toDateInput = (v: string | null) => (v ? new Date(v).toISOString().slice(0, 10) : "");

export function MarketingSection({
  eventId,
  eventDate,
  initial,
}: {
  eventId: string;
  eventDate: string;
  initial: PlanData | null;
}) {
  const [plan, setPlan] = useState<PlanData>(
    initial ?? {
      posterDeadline: null,
      flyerPrintDeadline: null,
      flyerDistributionDate: null,
      onlinePostStart: null,
      posterLocations: [],
      flyerLocations: [],
      instagramStoryPlan: null,
      instagramFeedPlan: null,
      tiktokPlan: null,
      specialInvites: null,
      campaignBrief: null,
    }
  );
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  async function save(patch: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/events/${eventId}/marketing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Failed to save");
    }
  }

  function setDate(field: keyof PlanData, value: string) {
    const iso = value ? new Date(value).toISOString() : null;
    setPlan((p) => ({ ...p, [field]: iso }));
    save({ [field]: iso });
  }

  function setLocations(field: "posterLocations" | "flyerLocations", next: string[]) {
    setPlan((p) => ({ ...p, [field]: next }));
    save({ [field]: next });
  }

  function setText(field: keyof PlanData, value: string) {
    setPlan((p) => ({ ...p, [field]: value }));
  }

  function autoFill() {
    const s = suggestedDeadlines(new Date(eventDate));
    const patch = {
      posterDeadline: s.posterDeadline.toISOString(),
      flyerPrintDeadline: s.flyerPrintDeadline.toISOString(),
      flyerDistributionDate: s.flyerDistributionDate.toISOString(),
      onlinePostStart: s.onlinePostStart.toISOString(),
    };
    setPlan((p) => ({ ...p, ...patch }));
    save(patch);
    toast.success("Deadlines filled from event date");
  }

  async function generateBrief() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/ai/marketing-campaign`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setPlan((p) => ({ ...p, campaignBrief: data.campaignBrief }));
      toast.success("Campaign brief ready");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setGenerating(false);
    }
  }

  function copyBrief() {
    if (!plan.campaignBrief) return;
    navigator.clipboard.writeText(plan.campaignBrief);
    setCopied(true);
    toast.success("Copied");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6">
      {/* Timeline */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="section-label mb-0">Backward planning timeline</span>
          <Button variant="ghost" onClick={autoFill}>
            <Wand2 className="h-4 w-4" />
            Auto-fill deadlines
          </Button>
        </div>
        <CampaignCalendar eventDate={eventDate} />
      </div>

      {/* Deadlines */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Poster / design deadline">
          <Input type="date" value={toDateInput(plan.posterDeadline)} onChange={(e) => setDate("posterDeadline", e.target.value)} />
        </Field>
        <Field label="Flyer print deadline">
          <Input type="date" value={toDateInput(plan.flyerPrintDeadline)} onChange={(e) => setDate("flyerPrintDeadline", e.target.value)} />
        </Field>
        <Field label="Flyer distribution">
          <Input type="date" value={toDateInput(plan.flyerDistributionDate)} onChange={(e) => setDate("flyerDistributionDate", e.target.value)} />
        </Field>
        <Field label="Online launch">
          <Input type="date" value={toDateInput(plan.onlinePostStart)} onChange={(e) => setDate("onlinePostStart", e.target.value)} />
        </Field>
      </div>

      {/* Locations */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <span className="section-label">Poster locations</span>
          <ChipInput
            values={plan.posterLocations ?? []}
            onChange={(v) => setLocations("posterLocations", v)}
            placeholder="e.g. Café X window"
          />
        </div>
        <div>
          <span className="section-label">Flyer distribution spots</span>
          <ChipInput
            values={plan.flyerLocations ?? []}
            onChange={(v) => setLocations("flyerLocations", v)}
            placeholder="e.g. Pijp Market, Saturday"
          />
        </div>
      </div>

      {/* Online plan */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Instagram feed plan">
          <Textarea value={plan.instagramFeedPlan ?? ""} onChange={(e) => setText("instagramFeedPlan", e.target.value)} onBlur={() => save({ instagramFeedPlan: plan.instagramFeedPlan })} />
        </Field>
        <Field label="Instagram stories plan">
          <Textarea value={plan.instagramStoryPlan ?? ""} onChange={(e) => setText("instagramStoryPlan", e.target.value)} onBlur={() => save({ instagramStoryPlan: plan.instagramStoryPlan })} />
        </Field>
        <Field label="TikTok plan">
          <Textarea value={plan.tiktokPlan ?? ""} onChange={(e) => setText("tiktokPlan", e.target.value)} onBlur={() => save({ tiktokPlan: plan.tiktokPlan })} />
        </Field>
      </div>

      <Field label="Special invites">
        <Textarea value={plan.specialInvites ?? ""} onChange={(e) => setText("specialInvites", e.target.value)} onBlur={() => save({ specialInvites: plan.specialInvites })} placeholder="Press, VIPs, collectors to personally invite…" />
      </Field>

      {/* AI brief */}
      <div className="rounded-xl border bg-surface-1 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-purple" />
            <span className="section-label mb-0">AI campaign brief</span>
          </div>
          <div className="flex gap-2">
            {plan.campaignBrief && (
              <Button variant="ghost" onClick={copyBrief}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy
              </Button>
            )}
            <Button onClick={generateBrief} disabled={generating}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {plan.campaignBrief ? "Regenerate" : "Generate brief"}
            </Button>
          </div>
        </div>
        {plan.campaignBrief ? (
          <pre className="whitespace-pre-wrap font-sans text-sm text-ink-primary">
            {plan.campaignBrief}
          </pre>
        ) : (
          <p className="text-sm text-ink-muted">
            Generate captions, a TikTok concept and a posting schedule from your
            event details.
          </p>
        )}
      </div>
    </div>
  );
}
