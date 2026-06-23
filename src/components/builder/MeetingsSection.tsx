"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  MeetingCard,
  type MeetingItem,
} from "@/components/meetings/MeetingCard";
import { Button, Input } from "@/components/ui/primitives";

export function MeetingsSection({
  eventId,
  eventName,
  initial,
}: {
  eventId: string;
  eventName: string;
  initial: MeetingItem[];
}) {
  const router = useRouter();
  const [meetings, setMeetings] = useState<MeetingItem[]>(initial);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function addManual() {
    if (!title.trim()) {
      toast.error("Title required");
      return;
    }
    try {
      const res = await fetch(`/api/events/${eventId}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, date: date || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMeetings((m) => [normalize(data), ...m]);
      setTitle("");
      setDate("");
      setAdding(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    }
  }

  async function upload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("eventId", eventId);
      fd.append("eventName", eventName);
      const res = await fetch("/api/meetings/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMeetings((m) => [normalize(data.meeting), ...m]);
      if (data.aiError) toast.info(data.aiError);
      else toast.success("Transcript uploaded and analysed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(id: string) {
    const prev = meetings;
    setMeetings((m) => m.filter((x) => x.id !== id));
    try {
      const res = await fetch(`/api/events/${eventId}/meetings/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setMeetings(prev);
      toast.error("Failed to delete");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setAdding((a) => !a)}>
          <Plus className="h-4 w-4" />
          Add meeting
        </Button>
        <Button
          variant="secondary"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Upload transcript PDF
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </div>

      {adding && (
        <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-surface-1 p-3">
          <div className="flex-1">
            <Input placeholder="Meeting title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
          <Button onClick={addManual}>Add</Button>
          <Button variant="ghost" onClick={() => setAdding(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {meetings.length === 0 ? (
        <p className="text-sm text-ink-muted">
          No meetings yet. Add one manually or upload a transcript PDF — AI will
          pull out the summary, decisions and action items.
        </p>
      ) : (
        <div className="space-y-3">
          {meetings.map((m) => (
            <MeetingCard
              key={m.id}
              eventId={eventId}
              meeting={m}
              onChange={(upd) =>
                setMeetings((list) =>
                  list.map((x) =>
                    x.id === upd.id ? normalize(upd as unknown as Record<string, unknown>) : x
                  )
                )
              }
              onRemove={() => remove(m.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Normalise Json fields (Prisma returns unknown) into typed arrays.
function normalize(m: Record<string, unknown>): MeetingItem {
  return {
    id: m.id as string,
    title: m.title as string,
    date: typeof m.date === "string" ? m.date : new Date(m.date as string).toISOString(),
    summary: (m.summary as string) ?? null,
    pdfPath: (m.pdfPath as string) ?? null,
    decisions: Array.isArray(m.decisions) ? (m.decisions as string[]) : null,
    actionItems: Array.isArray(m.actionItems) ? (m.actionItems as MeetingItem["actionItems"]) : null,
  };
}
