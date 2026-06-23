"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SlideOver } from "@/components/ui/SlideOver";
import { Button, Field, Input, Textarea } from "@/components/ui/primitives";
import type { FullEvent } from "@/lib/event-include";

function toDateInput(d: Date | string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}
function toTimeInput(d: Date | string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(11, 16);
}

export function EditEventForm({
  event,
  open,
  onClose,
}: {
  event: FullEvent;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: event.name,
    dateOnly: toDateInput(event.date),
    startTime: toTimeInput(event.date),
    buildUpTimeOnly: toTimeInput(event.buildUpTime),
    breakdownTimeOnly: toTimeInput(event.breakdownTime),
    location: event.location,
    venueNotes: event.venueNotes ?? "",
    capacity: event.capacity?.toString() ?? "",
    theme: event.theme ?? "",
    themeNotes: event.themeNotes ?? "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    try {
      const dt = (date: string, time?: string) =>
        date ? new Date(`${date}T${time || "00:00"}`).toISOString() : null;
      const payload = {
        name: form.name,
        date: dt(form.dateOnly, form.startTime),
        buildUpTime: form.buildUpTimeOnly ? dt(form.dateOnly, form.buildUpTimeOnly) : null,
        breakdownTime: form.breakdownTimeOnly ? dt(form.dateOnly, form.breakdownTimeOnly) : null,
        location: form.location,
        venueNotes: form.venueNotes || null,
        capacity: form.capacity ? Number(form.capacity) : null,
        theme: form.theme || null,
        themeNotes: form.themeNotes || null,
      };
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      toast.success("Event updated");
      onClose();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Edit event"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            Save changes
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Event name">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Date">
          <Input
            type="date"
            value={form.dateOnly}
            onChange={(e) => set("dateOnly", e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Start">
            <Input type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} />
          </Field>
          <Field label="Build-up">
            <Input type="time" value={form.buildUpTimeOnly} onChange={(e) => set("buildUpTimeOnly", e.target.value)} />
          </Field>
          <Field label="Breakdown">
            <Input type="time" value={form.breakdownTimeOnly} onChange={(e) => set("breakdownTimeOnly", e.target.value)} />
          </Field>
        </div>
        <Field label="Location">
          <Input value={form.location} onChange={(e) => set("location", e.target.value)} />
        </Field>
        <Field label="Venue notes">
          <Textarea value={form.venueNotes} onChange={(e) => set("venueNotes", e.target.value)} />
        </Field>
        <Field label="Capacity">
          <Input type="number" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} />
        </Field>
        <Field label="Theme">
          <Input value={form.theme} onChange={(e) => set("theme", e.target.value)} />
        </Field>
        <Field label="Theme notes">
          <Textarea value={form.themeNotes} onChange={(e) => set("themeNotes", e.target.value)} />
        </Field>
      </div>
    </SlideOver>
  );
}
