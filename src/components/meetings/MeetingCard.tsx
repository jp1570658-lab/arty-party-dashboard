"use client";

import { useState } from "react";
import {
  FileText,
  Trash2,
  Pencil,
  Check,
  X,
  CalendarDays,
  CheckSquare,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import { Button, Input, Textarea } from "@/components/ui/primitives";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface ActionItem {
  text: string;
  owner?: string;
  done?: boolean;
}
export interface MeetingItem {
  id: string;
  title: string;
  date: string;
  summary: string | null;
  pdfPath: string | null;
  decisions: string[] | null;
  actionItems: ActionItem[] | null;
}

export function MeetingCard({
  eventId,
  meeting,
  onChange,
  onRemove,
}: {
  eventId: string;
  meeting: MeetingItem;
  onChange: (m: MeetingItem) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [form, setForm] = useState({
    title: meeting.title,
    summary: meeting.summary ?? "",
    decisions: (meeting.decisions ?? []).join("\n"),
    actionItems: (meeting.actionItems ?? [])
      .map((a) => (a.owner ? `${a.text} — ${a.owner}` : a.text))
      .join("\n"),
  });

  async function patch(data: Partial<MeetingItem>) {
    try {
      const res = await fetch(`/api/events/${eventId}/meetings/${meeting.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error);
      onChange(updated);
      return true;
    } catch {
      toast.error("Failed to save");
      return false;
    }
  }

  async function saveEdit() {
    const decisions = form.decisions.split("\n").map((s) => s.trim()).filter(Boolean);
    const actionItems = form.actionItems
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((line) => {
        const [text, owner] = line.split(/\s+—\s+|\s+-\s+/);
        return { text: text.trim(), owner: owner?.trim() || undefined, done: false };
      });
    const ok = await patch({
      title: form.title,
      summary: form.summary || null,
      decisions,
      actionItems,
    });
    if (ok) {
      setEditing(false);
      toast.success("Meeting updated");
    }
  }

  function toggleAction(idx: number) {
    const items = (meeting.actionItems ?? []).map((a, i) =>
      i === idx ? { ...a, done: !a.done } : a
    );
    onChange({ ...meeting, actionItems: items });
    patch({ actionItems: items });
  }

  return (
    <div className="rounded-xl border bg-surface-0 p-4">
      {editing ? (
        <div className="space-y-2">
          <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Textarea
            placeholder="Summary"
            value={form.summary}
            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
          />
          <Textarea
            placeholder="Decisions (one per line)"
            value={form.decisions}
            onChange={(e) => setForm((f) => ({ ...f, decisions: e.target.value }))}
          />
          <Textarea
            placeholder="Action items (one per line: task — owner)"
            value={form.actionItems}
            onChange={(e) => setForm((f) => ({ ...f, actionItems: e.target.value }))}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(false)}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={saveEdit}>
              <Check className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-semibold text-ink-primary">{meeting.title}</h4>
              <div className="flex items-center gap-1 text-xs text-ink-muted">
                <CalendarDays className="h-3 w-3" />
                {formatDate(meeting.date)}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setEditing(true)} className="btn-ghost px-2 py-1.5" aria-label="Edit">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={onRemove} className="btn-ghost px-2 py-1.5 text-ink-muted hover:text-danger" aria-label="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {meeting.summary && (
            <p className="mt-2 text-sm text-ink-secondary">{meeting.summary}</p>
          )}

          {meeting.decisions && meeting.decisions.length > 0 && (
            <div className="mt-3">
              <span className="section-label">Key decisions</span>
              <ul className="list-disc space-y-0.5 pl-5 text-sm text-ink-primary">
                {meeting.decisions.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          {meeting.actionItems && meeting.actionItems.length > 0 && (
            <div className="mt-3">
              <span className="section-label">Action items</span>
              <ul className="space-y-1">
                {meeting.actionItems.map((a, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <button onClick={() => toggleAction(i)} aria-label="Toggle done">
                      {a.done ? (
                        <CheckSquare className="h-4 w-4 text-brand-purple" />
                      ) : (
                        <Square className="h-4 w-4 text-ink-muted" />
                      )}
                    </button>
                    <span className={cn(a.done && "text-ink-muted line-through")}>
                      {a.text}
                      {a.owner && <span className="text-ink-muted"> · {a.owner}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {meeting.pdfPath && (
            <div className="mt-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPdf((s) => !s)}
                  className="flex items-center gap-1.5 text-sm font-medium text-brand-purple hover:text-brand-purple-dark"
                >
                  <FileText className="h-4 w-4" />
                  {showPdf ? "Hide PDF" : "View PDF"}
                </button>
                <a
                  href={meeting.pdfPath}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-ink-muted hover:text-ink-primary"
                >
                  Open in new tab
                </a>
              </div>
              {showPdf && (
                <iframe
                  src={meeting.pdfPath}
                  className="mt-2 h-96 w-full rounded-lg border"
                  title={meeting.title}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
