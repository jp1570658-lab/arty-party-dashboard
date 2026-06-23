"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button, Field, Input, Textarea, Card } from "@/components/ui/primitives";
import {
  wizardStep1Schema,
  wizardStep2Schema,
  combineDateTime,
} from "@/lib/validation";

const STEPS = ["Date & time", "Location", "Theme"];

export function NewEventWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: "",
    dateOnly: "",
    startTime: "",
    buildUpTimeOnly: "",
    breakdownTimeOnly: "",
    location: "",
    venueNotes: "",
    capacity: "",
    theme: "",
    themeNotes: "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  function validateStep(): boolean {
    setErrors({});
    if (step === 0) {
      const r = wizardStep1Schema.safeParse(form);
      if (!r.success) {
        const e: Record<string, string> = {};
        r.error.issues.forEach((er) => (e[er.path[0] as string] = er.message));
        setErrors(e);
        return false;
      }
    }
    if (step === 1) {
      const r = wizardStep2Schema.safeParse(form);
      if (!r.success) {
        const e: Record<string, string> = {};
        r.error.issues.forEach((er) => (e[er.path[0] as string] = er.message));
        setErrors(e);
        return false;
      }
    }
    return true;
  }

  function next() {
    if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        date: combineDateTime(form.dateOnly, form.startTime),
        buildUpTime: form.buildUpTimeOnly
          ? combineDateTime(form.dateOnly, form.buildUpTimeOnly)
          : null,
        breakdownTime: form.breakdownTimeOnly
          ? combineDateTime(form.dateOnly, form.breakdownTimeOnly)
          : null,
        location: form.location,
        venueNotes: form.venueNotes || null,
        capacity: form.capacity ? Number(form.capacity) : null,
        theme: form.theme || null,
        themeNotes: form.themeNotes || null,
      };
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create event");
      toast.success("Event created");
      router.push(`/events/${data.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto max-w-xl">
      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                i < step
                  ? "bg-brand-purple text-white"
                  : i === step
                    ? "bg-brand-purple text-white"
                    : "bg-surface-2 text-ink-muted"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={`hidden text-xs font-medium sm:inline ${
                i === step ? "text-ink-primary" : "text-ink-muted"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="h-px flex-1 bg-line" />
            )}
          </div>
        ))}
      </div>

      <div className="mb-1 text-xs font-medium text-brand-purple">
        Step {step + 1} of {STEPS.length}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.18 }}
          className="space-y-4"
        >
          {step === 0 && (
            <>
              <Field label="Event name" error={errors.name}>
                <Input
                  placeholder="Arty-Party Vol. 4"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  autoFocus
                />
              </Field>
              <Field label="Date" error={errors.dateOnly}>
                <Input
                  type="date"
                  value={form.dateOnly}
                  onChange={(e) => set("dateOnly", e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Doors / start">
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => set("startTime", e.target.value)}
                  />
                </Field>
                <Field label="Build-up">
                  <Input
                    type="time"
                    value={form.buildUpTimeOnly}
                    onChange={(e) => set("buildUpTimeOnly", e.target.value)}
                  />
                </Field>
                <Field label="Breakdown">
                  <Input
                    type="time"
                    value={form.breakdownTimeOnly}
                    onChange={(e) => set("breakdownTimeOnly", e.target.value)}
                  />
                </Field>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <Field label="Location" error={errors.location}>
                <Input
                  placeholder="Venue name & address"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  autoFocus
                />
              </Field>
              <Field label="Venue notes" hint="Access, power, restrictions, contacts…">
                <Textarea
                  placeholder="Loading dock at the back, power on left wall…"
                  value={form.venueNotes}
                  onChange={(e) => set("venueNotes", e.target.value)}
                />
              </Field>
              <Field label="Capacity" error={errors.capacity}>
                <Input
                  type="number"
                  placeholder="120"
                  value={form.capacity}
                  onChange={(e) => set("capacity", e.target.value)}
                />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Theme">
                <Input
                  placeholder="Neon Nights, Spring Awakening…"
                  value={form.theme}
                  onChange={(e) => set("theme", e.target.value)}
                  autoFocus
                />
              </Field>
              <Field label="Theme notes" hint="Mood, colours, references, dress code…">
                <Textarea
                  placeholder="Warm low lighting, lots of plants, jazz between sets…"
                  value={form.themeNotes}
                  onChange={(e) => set("themeNotes", e.target.value)}
                />
              </Field>
              <div className="flex items-start gap-2 rounded-lg bg-brand-purple-light p-3 text-xs text-brand-purple">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                Once created, the builder lets you add activities, team, run of show,
                budget, marketing and more.
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={back} disabled={step === 0}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next}>
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={submit} loading={submitting}>
            Create event
            <Check className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}
