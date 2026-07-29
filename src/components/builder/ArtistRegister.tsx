"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Clock,
  Mail,
  MessageCircle,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button, Input, Select } from "@/components/ui/primitives";
import {
  ARTIST_CATEGORIES,
  ARTIST_CATEGORY_LABELS,
  TEAM_MEMBER_STATUSES,
  TEAM_STATUS_LABELS,
  TEAM_STATUS_STYLES,
} from "@/lib/enums";
import { artistNameKey, callSheetPath } from "@/lib/call-sheet";
import { cn } from "@/lib/utils";

export interface LineupMember {
  id: string;
  role: string;
  status: string;
  callSheetSentAt: string | null;
  artistId: string | null;
  name: string;
  email: string | null;
  category: string | null;
}

export interface ArtistOption {
  id: string;
  name: string;
  category: string;
  email: string | null;
}

/**
 * The event's artist lineup. Built up incrementally as bookings confirm, and
 * the anchor point for the artist call sheet — this is who the link goes to.
 */
export function ArtistRegister({
  eventId,
  eventName,
  initial,
  allArtists,
  submittedKeys,
}: {
  eventId: string;
  eventName: string;
  initial: LineupMember[];
  allArtists: ArtistOption[];
  /** Normalised artist names that have already submitted a call sheet. */
  submittedKeys: string[];
}) {
  const router = useRouter();
  const [lineup, setLineup] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  const submitted = useMemo(() => new Set(submittedKeys), [submittedKeys]);
  const onLineup = useMemo(
    () => new Set(lineup.map((m) => m.artistId).filter(Boolean)),
    [lineup]
  );

  function hasSubmitted(m: LineupMember) {
    return submitted.has(artistNameKey(m.name));
  }

  async function cycleStatus(m: LineupMember) {
    const order = TEAM_MEMBER_STATUSES;
    const current = m.status === "pending" ? "not_asked" : m.status;
    const next = order[(order.indexOf(current as never) + 1) % order.length];
    const prev = lineup;
    setLineup((l) => l.map((x) => (x.id === m.id ? { ...x, status: next } : x)));
    try {
      const res = await fetch(`/api/events/${eventId}/team/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setLineup(prev);
      toast.error("Failed to update status");
    }
  }

  async function remove(m: LineupMember) {
    if (!confirm(`Remove ${m.name} from the lineup?`)) return;
    const prev = lineup;
    setLineup((l) => l.filter((x) => x.id !== m.id));
    setSelected((s) => {
      const n = new Set(s);
      n.delete(m.id);
      return n;
    });
    try {
      const res = await fetch(`/api/events/${eventId}/team/${m.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setLineup(prev);
      toast.error("Failed to remove");
    }
  }

  async function addToLineup(payload: Record<string, unknown>) {
    const res = await fetch(`/api/events/${eventId}/team`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, teamType: "ARTIST" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to add");

    setLineup((l) => [
      ...l,
      {
        id: data.id,
        role: data.role,
        status: data.status,
        callSheetSentAt: null,
        artistId: data.artistId,
        name: data.artist?.name ?? data.teamMember?.name ?? "Unnamed",
        email: data.artist?.email ?? data.teamMember?.email ?? null,
        category: data.artist?.category ?? null,
      },
    ]);
    router.refresh();
  }

  async function sendCallSheet() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setSending(true);
    try {
      const res = await fetch(`/api/events/${eventId}/call-sheet/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds: ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");

      const failed = (data.results ?? []).filter((r: { ok: boolean }) => !r.ok);
      if (data.sent > 0) {
        toast.success(`Call sheet sent to ${data.sent} artist${data.sent === 1 ? "" : "s"}`);
        const now = new Date().toISOString();
        setLineup((l) =>
          l.map((m) =>
            ids.includes(m.id) &&
            !failed.some((f: { id: string }) => f.id === m.id)
              ? { ...m, callSheetSentAt: now }
              : m
          )
        );
      }
      for (const f of failed) {
        toast.error(`${f.name}: ${f.error}`);
      }
      setSelected(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  /** No-service fallback — opens WhatsApp with the link pre-filled. */
  function whatsappHref(m: LineupMember) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const msg = `Hi ${m.name}! You're booked for ${eventName}. Please fill in your call sheet here: ${origin}${callSheetPath(eventId)}`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  }

  const selectable = lineup.filter((m) => m.email);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-ink-primary">Artist lineup</h4>
          <p className="text-xs text-ink-muted">
            Add artists as bookings confirm — this is who the call sheet goes to.
          </p>
        </div>
        {selected.size > 0 && (
          <Button onClick={sendCallSheet} loading={sending}>
            <Send className="h-4 w-4" />
            Send call sheet ({selected.size})
          </Button>
        )}
      </div>

      {lineup.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-ink-muted">
          No artists booked yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {lineup.map((m) => {
            const status = m.status === "pending" ? "not_asked" : m.status;
            const done = hasSubmitted(m);
            return (
              <li
                key={m.id}
                className="group flex flex-wrap items-center gap-3 rounded-lg border bg-surface-0 px-3 py-2.5"
              >
                <input
                  type="checkbox"
                  checked={selected.has(m.id)}
                  disabled={!m.email}
                  title={m.email ? "Select to email the call sheet" : "No email on file"}
                  onChange={(e) =>
                    setSelected((s) => {
                      const n = new Set(s);
                      if (e.target.checked) n.add(m.id);
                      else n.delete(m.id);
                      return n;
                    })
                  }
                  className="h-4 w-4 shrink-0 accent-[var(--brand-purple)] disabled:opacity-30"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-ink-primary">{m.name}</span>
                    {m.category && (
                      <span className="text-xs text-ink-muted">
                        {ARTIST_CATEGORY_LABELS[
                          m.category as keyof typeof ARTIST_CATEGORY_LABELS
                        ] ?? m.category}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-ink-muted">
                    {m.email ?? "No email on file"}
                  </p>
                </div>

                {done ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    Call sheet in
                  </span>
                ) : m.callSheetSentAt ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-ink-secondary">
                    <Clock className="h-3 w-3" />
                    Sent, awaiting
                  </span>
                ) : null}

                <button
                  onClick={() => cycleStatus(m)}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
                    TEAM_STATUS_STYLES[status]
                  )}
                  title="Click to change booking status"
                >
                  {TEAM_STATUS_LABELS[status]}
                </button>

                <a
                  href={whatsappHref(m)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-muted transition-colors hover:text-brand-purple"
                  title="Share the call sheet link over WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
                {m.email && (
                  <a
                    href={`mailto:${m.email}`}
                    className="text-ink-muted transition-colors hover:text-brand-purple"
                    title="Email this artist"
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                )}
                <button
                  onClick={() => remove(m)}
                  className="text-ink-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                  aria-label={`Remove ${m.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selectable.length === 0 && lineup.length > 0 && (
        <p className="text-xs text-ink-muted">
          Add an email to an artist to send them the call sheet from here — or use
          the WhatsApp icon to share the link instead.
        </p>
      )}

      {adding ? (
        <AddArtistForm
          allArtists={allArtists.filter((a) => !onLineup.has(a.id))}
          onCancel={() => setAdding(false)}
          onAdd={async (payload) => {
            try {
              await addToLineup(payload);
              setAdding(false);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed to add");
            }
          }}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-brand-purple hover:text-brand-purple-dark"
        >
          <Plus className="h-4 w-4" />
          Add artist
        </button>
      )}
    </div>
  );
}

function AddArtistForm({
  allArtists,
  onAdd,
  onCancel,
}: {
  allArtists: ArtistOption[];
  onAdd: (payload: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<"existing" | "new">(
    allArtists.length > 0 ? "existing" : "new"
  );
  const [artistId, setArtistId] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "OTHER",
    email: "",
    role: "",
  });

  async function submit() {
    setSaving(true);
    try {
      if (mode === "existing") {
        if (!artistId) {
          toast.error("Pick an artist");
          return;
        }
        const a = allArtists.find((x) => x.id === artistId);
        await onAdd({
          artistId,
          role: form.role || ARTIST_CATEGORY_LABELS[
            (a?.category ?? "OTHER") as keyof typeof ARTIST_CATEGORY_LABELS
          ],
        });
      } else {
        if (form.name.trim().length < 2) {
          toast.error("Give the artist a name");
          return;
        }
        // Create in the CRM first so they persist across events, then book them.
        const res = await fetch("/api/artists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            category: form.category,
            email: form.email || null,
          }),
        });
        const created = await res.json();
        if (!res.ok) throw new Error(created.error || "Failed to create artist");
        await onAdd({
          artistId: created.id,
          role: form.role || ARTIST_CATEGORY_LABELS[
            form.category as keyof typeof ARTIST_CATEGORY_LABELS
          ],
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2 rounded-lg border bg-surface-1 p-3">
      {allArtists.length > 0 && (
        <div className="flex gap-1 rounded-lg bg-surface-2 p-1 text-xs">
          <button
            onClick={() => setMode("existing")}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 font-medium transition-colors",
              mode === "existing" ? "bg-surface-0 text-ink-primary shadow-sm" : "text-ink-secondary"
            )}
          >
            From your artists
          </button>
          <button
            onClick={() => setMode("new")}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 font-medium transition-colors",
              mode === "new" ? "bg-surface-0 text-ink-primary shadow-sm" : "text-ink-secondary"
            )}
          >
            New artist
          </button>
        </div>
      )}

      {mode === "existing" ? (
        <Select value={artistId} onChange={(e) => setArtistId(e.target.value)}>
          <option value="">— Pick an artist —</option>
          {allArtists.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ·{" "}
              {ARTIST_CATEGORY_LABELS[a.category as keyof typeof ARTIST_CATEGORY_LABELS] ??
                a.category}
            </option>
          ))}
        </Select>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            placeholder="Artist name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            {ARTIST_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {ARTIST_CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
          <Input
            placeholder="Email (so you can send the call sheet)"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="sm:col-span-2"
          />
        </div>
      )}

      <Input
        placeholder="Role on the night (optional)"
        value={form.role}
        onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
      />

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          <X className="h-4 w-4" />
          Cancel
        </Button>
        <Button onClick={submit} loading={saving}>
          <Check className="h-4 w-4" />
          Add to lineup
        </Button>
      </div>
    </div>
  );
}
