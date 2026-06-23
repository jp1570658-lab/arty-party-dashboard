"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SlideOver } from "@/components/ui/SlideOver";
import { Button, Field, Input, Textarea } from "@/components/ui/primitives";

export interface GuestFormData {
  id?: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  notes: string | null;
}

const EMPTY: GuestFormData = { name: "", email: "", phone: "", role: "", notes: "" };

export function GuestForm({
  open,
  onClose,
  guest,
}: {
  open: boolean;
  onClose: () => void;
  guest?: GuestFormData;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<GuestFormData>(guest ?? EMPTY);
  const set = (k: keyof GuestFormData, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const editing = !!guest?.id;
      const res = await fetch(editing ? `/api/guests/${guest!.id}` : "/api/guests", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editing ? "Guest updated" : "Guest added");
      onClose();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={guest?.id ? "Edit guest" : "Add guest"}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving}>
            {guest?.id ? "Save changes" : "Add guest"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Name">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus />
        </Field>
        <Field label="Role / description" hint="e.g. Art collector, Journalist, Regular">
          <Input value={form.role ?? ""} onChange={(e) => set("role", e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <Input value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
          </Field>
        </div>
        <Field label="Notes">
          <Textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </div>
    </SlideOver>
  );
}
