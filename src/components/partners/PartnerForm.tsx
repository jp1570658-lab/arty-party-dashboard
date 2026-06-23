"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SlideOver } from "@/components/ui/SlideOver";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { PARTNER_TYPES } from "@/lib/enums";

export interface PartnerFormData {
  id?: string;
  name: string;
  type: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  collabNotes: string | null;
}

const EMPTY: PartnerFormData = {
  name: "",
  type: "sponsor",
  contactName: "",
  email: "",
  phone: "",
  website: "",
  collabNotes: "",
};

export function PartnerForm({
  open,
  onClose,
  partner,
}: {
  open: boolean;
  onClose: () => void;
  partner?: PartnerFormData;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PartnerFormData>(partner ?? EMPTY);
  const set = (k: keyof PartnerFormData, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const editing = !!partner?.id;
      const res = await fetch(editing ? `/api/partners/${partner!.id}` : "/api/partners", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editing ? "Partner updated" : "Partner added");
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
      title={partner?.id ? "Edit partner" : "Add partner"}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving}>
            {partner?.id ? "Save changes" : "Add partner"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Name">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus />
        </Field>
        <Field label="Type">
          <Select value={form.type} onChange={(e) => set("type", e.target.value)}>
            {PARTNER_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contact name">
            <Input value={form.contactName ?? ""} onChange={(e) => set("contactName", e.target.value)} />
          </Field>
          <Field label="Email">
            <Input value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">
            <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="Website">
            <Input value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} />
          </Field>
        </div>
        <Field label="Collaboration notes">
          <Textarea value={form.collabNotes ?? ""} onChange={(e) => set("collabNotes", e.target.value)} />
        </Field>
      </div>
    </SlideOver>
  );
}
