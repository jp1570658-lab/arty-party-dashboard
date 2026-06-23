"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Phone,
  AtSign,
  Globe,
  Pencil,
  Trash2,
  Plus,
  CalendarDays,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { ArtistForm, type ArtistFormData } from "./ArtistForm";
import { Button, Card, Select, Textarea } from "@/components/ui/primitives";
import { ARTIST_CATEGORY_LABELS, type ArtistCategory } from "@/lib/enums";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface EventRef {
  id: string;
  role: string;
  event: { id: string; name: string; date: string };
}
interface Collab {
  id: string;
  type: string;
  notes: string;
  status: string;
}
interface ArtistFull extends ArtistFormData {
  id: string;
  events: EventRef[];
  collaborations: Collab[];
}

const COLLAB_STATUSES = ["potential", "in discussion", "confirmed"];
const STATUS_STYLE: Record<string, string> = {
  potential: "bg-surface-2 text-ink-secondary",
  "in discussion": "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

export function ArtistProfile({ artist }: { artist: ArtistFull }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [collabs, setCollabs] = useState<Collab[]>(artist.collaborations);
  const [newNote, setNewNote] = useState("");
  const [newStatus, setNewStatus] = useState("potential");

  const contacts = [
    { icon: Mail, value: artist.email, href: `mailto:${artist.email}` },
    { icon: Phone, value: artist.phone, href: `tel:${artist.phone}` },
    { icon: AtSign, value: artist.instagram, href: undefined },
    { icon: Globe, value: artist.website, href: artist.website ?? undefined },
  ].filter((c) => c.value);

  async function remove() {
    if (!confirm(`Delete ${artist.name}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/artists/${artist.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Artist deleted");
      router.push("/artists");
    } catch {
      toast.error("Failed to delete");
    }
  }

  async function addCollab() {
    if (!newNote.trim()) return;
    try {
      const res = await fetch("/api/collaborations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId: artist.id, notes: newNote, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCollabs((c) => [data, ...c]);
      setNewNote("");
      toast.success("Collaboration note added");
    } catch {
      toast.error("Failed to add note");
    }
  }

  async function updateStatus(id: string, status: string) {
    setCollabs((c) => c.map((n) => (n.id === id ? { ...n, status } : n)));
    try {
      await fetch(`/api/collaborations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {
      toast.error("Failed to update");
    }
  }

  async function deleteCollab(id: string) {
    const prev = collabs;
    setCollabs((c) => c.filter((n) => n.id !== id));
    try {
      const res = await fetch(`/api/collaborations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setCollabs(prev);
      toast.error("Failed to delete");
    }
  }

  const history = [...artist.events].sort(
    (a, b) => +new Date(b.event.date) - +new Date(a.event.date)
  );

  return (
    <div className="space-y-5">
      <Link
        href="/artists"
        className="inline-flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        All artists
      </Link>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink-primary">{artist.name}</h1>
            <p className="mt-1 text-sm text-ink-secondary">
              {ARTIST_CATEGORY_LABELS[artist.category as ArtistCategory]}
              {artist.subcategory ? ` · ${artist.subcategory}` : ""}
            </p>
            {artist.availability && (
              <p className="mt-1 text-xs text-ink-muted">Available: {artist.availability}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="ghost" onClick={remove} className="text-danger">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {contacts.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t pt-4 text-sm text-ink-secondary">
            {contacts.map((c, i) => {
              const Icon = c.icon;
              const inner = (
                <span className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4 text-ink-muted" />
                  {c.value}
                </span>
              );
              return c.href ? (
                <a key={i} href={c.href} className="hover:text-brand-purple" target="_blank" rel="noreferrer">
                  {inner}
                </a>
              ) : (
                <span key={i}>{inner}</span>
              );
            })}
          </div>
        )}

        {artist.notes && (
          <p className="mt-3 border-t pt-3 text-sm text-ink-secondary">{artist.notes}</p>
        )}
      </Card>

      {/* Performance history */}
      <Card>
        <h2 className="section-label">Performance history</h2>
        {history.length === 0 ? (
          <p className="text-sm text-ink-muted">No events yet.</p>
        ) : (
          <div className="divide-y">
            {history.map((h) => (
              <Link
                key={h.id}
                href={`/events/${h.event.id}`}
                className="flex items-center justify-between py-2.5 text-sm hover:text-brand-purple"
              >
                <span className="font-medium text-ink-primary">{h.event.name}</span>
                <span className="flex items-center gap-3 text-ink-secondary">
                  <span>{h.role}</span>
                  <span className="flex items-center gap-1 text-ink-muted">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(h.event.date)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Collaboration notes */}
      <Card>
        <h2 className="section-label">Collaboration notes</h2>
        <div className="mb-4 space-y-2">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="A collaboration idea for a future event…"
          />
          <div className="flex items-center justify-between gap-2">
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-auto"
            >
              {COLLAB_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Button onClick={addCollab}>
              <Plus className="h-4 w-4" />
              Add note
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {collabs.map((n) => (
            <div key={n.id} className="group rounded-lg border bg-surface-0 p-3">
              <p className="text-sm text-ink-primary">{n.notes}</p>
              <div className="mt-2 flex items-center gap-2">
                <select
                  value={n.status}
                  onChange={(e) => updateStatus(n.id, e.target.value)}
                  className={cn(
                    "rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold",
                    STATUS_STYLE[n.status] ?? "bg-surface-2"
                  )}
                >
                  {COLLAB_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => deleteCollab(n.id)}
                  className="ml-auto text-ink-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                  aria-label="Delete note"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <ArtistForm open={editing} onClose={() => setEditing(false)} artist={artist} />
    </div>
  );
}
