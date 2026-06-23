"use client";

import { FileText, Trash2, Tag } from "lucide-react";

export interface MediaItem {
  id: string;
  type: string;
  url: string;
  filename: string;
  caption: string | null;
  tags: string[] | null;
}

export function MediaGrid({
  items,
  onCaption,
  onTag,
  onDelete,
}: {
  items: MediaItem[];
  onCaption: (id: string, caption: string) => void;
  onTag: (id: string, tag: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="masonry columns-2 md:columns-3">
      {items.map((m) => (
        <div key={m.id} className="overflow-hidden rounded-xl border bg-surface-0">
          <div className="group relative">
            {m.type === "PHOTO" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.url} alt={m.caption ?? m.filename} className="w-full" />
            ) : m.type === "VIDEO" ? (
              <video src={m.url} controls className="w-full" />
            ) : (
              <a
                href={m.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 p-6 text-sm text-ink-secondary"
              >
                <FileText className="h-6 w-6" />
                {m.filename}
              </a>
            )}
            <button
              onClick={() => onDelete(m.id)}
              className="absolute right-2 top-2 rounded-lg bg-black/50 p-1.5 text-white opacity-0 transition-opacity hover:bg-danger group-hover:opacity-100"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-1.5 p-2">
            <input
              defaultValue={m.caption ?? ""}
              onBlur={(e) => e.target.value !== (m.caption ?? "") && onCaption(m.id, e.target.value)}
              placeholder="Add a caption…"
              className="w-full border-0 bg-transparent px-1 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none"
            />
            <div className="flex items-center gap-1 px-1">
              <Tag className="h-3 w-3 text-ink-muted" />
              <input
                defaultValue={m.tags?.[0] ?? ""}
                onBlur={(e) => e.target.value !== (m.tags?.[0] ?? "") && onTag(m.id, e.target.value)}
                placeholder="tag"
                className="w-full border-0 bg-transparent text-xs text-ink-secondary placeholder:text-ink-muted focus:outline-none"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
