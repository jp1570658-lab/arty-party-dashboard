"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SlideOver } from "@/components/ui/SlideOver";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/primitives";
import {
  ARTIST_CATEGORIES,
  ARTIST_CATEGORY_LABELS,
  ARTIST_SUBCATEGORIES,
  type ArtistCategory,
} from "@/lib/enums";

export interface ArtistFormData {
  id?: string;
  name: string;
  category: string;
  subcategory: string | null;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  tiktok: string | null;
  website: string | null;
  notes: string | null;
  availability: string | null;
}

const EMPTY: ArtistFormData = {
  name: "",
  category: "POET",
  subcategory: "",
  email: "",
  phone: "",
  instagram: "",
  tiktok: "",
  website: "",
  notes: "",
  availability: "",
};

export function ArtistForm({
  open,
  onClose,
  artist,
}: {
  open: boolean;
  onClose: () => void;
  artist?: ArtistFormData;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ArtistFormData>(
    artist ?? EMPTY
  );

  const set = (k: keyof ArtistFormData, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const subs = ARTIST_SUBCATEGORIES[form.category];

  async function save() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const editing = !!artist?.id;
      const res = await fetch(
        editing ? `/api/artists/${artist!.id}` : "/api/artists",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editing ? "Artist updated" : "Artist added");
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
      title={artist?.id ? "Edit artist" : "Add artist"}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            {artist?.id ? "Save changes" : "Add artist"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Name">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <Select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {ARTIST_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {ARTIST_CATEGORY_LABELS[c as ArtistCategory]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Subcategory">
            {subs ? (
              <Select
                value={form.subcategory ?? ""}
                onChange={(e) => set("subcategory", e.target.value)}
              >
                <option value="">—</option>
                {subs.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                value={form.subcategory ?? ""}
                onChange={(e) => set("subcategory", e.target.value)}
                placeholder="Optional"
              />
            )}
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <Input value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Instagram">
            <Input value={form.instagram ?? ""} onChange={(e) => set("instagram", e.target.value)} placeholder="@handle" />
          </Field>
          <Field label="TikTok">
            <Input value={form.tiktok ?? ""} onChange={(e) => set("tiktok", e.target.value)} placeholder="@handle" />
          </Field>
        </div>
        <Field label="Website">
          <Input value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} />
        </Field>
        <Field label="Availability">
          <Input value={form.availability ?? ""} onChange={(e) => set("availability", e.target.value)} placeholder="e.g. Weekends, evenings" />
        </Field>
        <Field label="Notes">
          <Textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </div>
    </SlideOver>
  );
}
