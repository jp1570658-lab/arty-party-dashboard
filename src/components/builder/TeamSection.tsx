"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  TeamMemberCard,
  type TeamMemberItem,
} from "@/components/team/TeamMemberCard";
import { Button, Input } from "@/components/ui/primitives";
import { TEAM_TYPE_LABELS } from "@/lib/enums";

interface MediaArtist {
  id: string;
  name: string;
  category: string;
}

const SUBSECTIONS = [
  { type: "PLANNING", hint: "People who plan the event with you." },
  { type: "BUILD_BREAKDOWN", hint: "Crew who set up and tear down." },
  { type: "MEDIA", hint: "Photographers, videographers, interviewers." },
] as const;

export function TeamSection({
  eventId,
  initial,
  mediaArtists,
}: {
  eventId: string;
  initial: TeamMemberItem[];
  mediaArtists: MediaArtist[];
}) {
  const router = useRouter();
  const [members, setMembers] = useState<TeamMemberItem[]>(initial);

  async function cycleStatus(id: string, next: string) {
    const prev = members;
    setMembers((m) => m.map((x) => (x.id === id ? { ...x, status: next } : x)));
    try {
      const res = await fetch(`/api/events/${eventId}/team/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setMembers(prev);
      toast.error("Failed to update status");
    }
  }

  async function remove(id: string) {
    const prev = members;
    setMembers((m) => m.filter((x) => x.id !== id));
    try {
      const res = await fetch(`/api/events/${eventId}/team/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setMembers(prev);
      toast.error("Failed to remove");
    }
  }

  async function add(payload: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/events/${eventId}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMembers((m) => [...m, data]);
      router.refresh();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
      return false;
    }
  }

  return (
    <div className="space-y-5">
      {SUBSECTIONS.map(({ type, hint }) => {
        const list = members.filter((m) => m.teamType === type);
        const confirmed = list.filter(
          (m) => (m.status === "pending" ? "not_asked" : m.status) === "confirmed"
        ).length;
        return (
          <div key={type}>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-ink-primary">
                  {TEAM_TYPE_LABELS[type]}
                </h4>
                <p className="text-xs text-ink-muted">{hint}</p>
              </div>
              {list.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-ink-secondary">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  {confirmed}/{list.length} confirmed
                </span>
              )}
            </div>

            <div className="space-y-2">
              {list.map((m) => (
                <TeamMemberCard
                  key={m.id}
                  member={m}
                  onCycleStatus={(next) => cycleStatus(m.id, next)}
                  onRemove={() => remove(m.id)}
                />
              ))}
            </div>

            <AddMemberForm
              teamType={type}
              mediaArtists={type === "MEDIA" ? mediaArtists : []}
              onAdd={add}
            />
          </div>
        );
      })}
    </div>
  );
}

function AddMemberForm({
  teamType,
  mediaArtists,
  onAdd,
}: {
  teamType: string;
  mediaArtists: MediaArtist[];
  onAdd: (payload: Record<string, unknown>) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    notes: "",
    artistId: "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setSaving(true);
    const payload: Record<string, unknown> = { teamType, notes: form.notes };
    if (form.artistId) {
      const a = mediaArtists.find((x) => x.id === form.artistId);
      payload.artistId = form.artistId;
      payload.role = form.role || a?.category || "Media";
    } else {
      payload.name = form.name;
      payload.role = form.role;
      payload.email = form.email;
      payload.phone = form.phone;
    }
    const ok = await onAdd(payload);
    setSaving(false);
    if (ok) {
      setForm({ name: "", role: "", email: "", phone: "", notes: "", artistId: "" });
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 flex items-center gap-1.5 text-sm font-medium text-brand-purple hover:text-brand-purple-dark"
      >
        <Plus className="h-4 w-4" />
        Add person
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2 rounded-lg border bg-surface-1 p-3">
      {mediaArtists.length > 0 && (
        <select
          className="input"
          value={form.artistId}
          onChange={(e) => set("artistId", e.target.value)}
        >
          <option value="">— Manual entry —</option>
          {mediaArtists.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.category})
            </option>
          ))}
        </select>
      )}
      {!form.artistId && (
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          <Input placeholder="Role" value={form.role} onChange={(e) => set("role", e.target.value)} />
          <Input placeholder="Email (optional)" value={form.email} onChange={(e) => set("email", e.target.value)} />
          <Input placeholder="Phone (optional)" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
      )}
      <Input
        placeholder={
          teamType === "BUILD_BREAKDOWN" ? "Arrival time / tasks…" : "Notes (optional)"
        }
        value={form.notes}
        onChange={(e) => set("notes", e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => setOpen(false)}>
          <X className="h-4 w-4" />
          Cancel
        </Button>
        <Button onClick={submit} loading={saving}>
          Add
        </Button>
      </div>
    </div>
  );
}
