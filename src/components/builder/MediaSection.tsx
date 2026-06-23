"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MediaUpload } from "@/components/media/MediaUpload";
import { MediaGrid, type MediaItem } from "@/components/media/MediaGrid";
import { cn } from "@/lib/utils";

export function MediaSection({
  eventId,
  initial,
}: {
  eventId: string;
  initial: MediaItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<MediaItem[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");

  const tags = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.tags?.forEach((t) => t && set.add(t)));
    return Array.from(set);
  }, [items]);

  const filtered = items.filter((i) => {
    if (typeFilter !== "all" && i.type !== typeFilter) return false;
    if (tagFilter !== "all" && !(i.tags ?? []).includes(tagFilter)) return false;
    return true;
  });

  async function upload(files: FileList) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("eventId", eventId);
      Array.from(files).forEach((f) => fd.append("files", f));
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((p) => [...normalizeAll(data), ...p]);
      toast.success(`Uploaded ${data.length} file${data.length === 1 ? "" : "s"}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function setCaption(id: string, caption: string) {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, caption } : i)));
    await fetch(`/api/media/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption }),
    }).catch(() => toast.error("Failed to save caption"));
  }

  async function setTag(id: string, tag: string) {
    const tags = tag ? [tag] : [];
    setItems((p) => p.map((i) => (i.id === id ? { ...i, tags } : i)));
    await fetch(`/api/media/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags }),
    }).catch(() => toast.error("Failed to save tag"));
  }

  async function remove(id: string) {
    const prev = items;
    setItems((p) => p.filter((i) => i.id !== id));
    try {
      const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setItems(prev);
      toast.error("Failed to delete");
    }
  }

  const typeFilters = [
    { key: "all", label: "All" },
    { key: "PHOTO", label: "Photos" },
    { key: "VIDEO", label: "Videos" },
  ];

  return (
    <div className="space-y-4">
      <MediaUpload onFiles={upload} uploading={uploading} />

      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {typeFilters.map((t) => (
            <button
              key={t.key}
              onClick={() => setTypeFilter(t.key)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                typeFilter === t.key ? "bg-brand-purple text-white" : "bg-surface-2 text-ink-secondary"
              )}
            >
              {t.label}
            </button>
          ))}
          {tags.length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="input w-auto py-1 text-xs"
            >
              <option value="all">All tags</option>
              {tags.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-ink-muted">
          {items.length === 0 ? "No media yet — upload photos and videos from the event." : "No media matches this filter."}
        </p>
      ) : (
        <MediaGrid items={filtered} onCaption={setCaption} onTag={setTag} onDelete={remove} />
      )}
    </div>
  );
}

function normalizeAll(rows: Record<string, unknown>[]): MediaItem[] {
  return rows.map((m) => ({
    id: m.id as string,
    type: m.type as string,
    url: m.url as string,
    filename: m.filename as string,
    caption: (m.caption as string) ?? null,
    tags: Array.isArray(m.tags) ? (m.tags as string[]) : null,
  }));
}
