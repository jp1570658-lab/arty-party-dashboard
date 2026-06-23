"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Check, MapPin, User, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, Input } from "@/components/ui/primitives";
import { cn, formatTime } from "@/lib/utils";

interface LogiItem {
  id: string;
  time: string;
  task: string;
  location: string | null;
  owner: string | null;
  done: boolean;
}

export function LogisticsSection({
  eventId,
  eventDateOnly,
  buildUpTime,
  initial,
}: {
  eventId: string;
  eventDateOnly: string; // yyyy-mm-dd
  buildUpTime: string | null;
  initial: LogiItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<LogiItem[]>(
    [...initial].sort((a, b) => +new Date(a.time) - +new Date(b.time))
  );
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ time: "", task: "", location: "", owner: "" });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const iso = (t: string) => new Date(`${eventDateOnly}T${t || "00:00"}`).toISOString();
  const resort = (arr: LogiItem[]) =>
    [...arr].sort((a, b) => +new Date(a.time) - +new Date(b.time));

  async function toggle(id: string, done: boolean) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done } : i)));
    try {
      const res = await fetch(`/api/events/${eventId}/logistics/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !done } : i)));
      toast.error("Failed to update");
    }
  }

  async function add() {
    if (!form.time || !form.task) {
      toast.error("Time and task are required");
      return;
    }
    try {
      const res = await fetch(`/api/events/${eventId}/logistics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          time: iso(form.time),
          task: form.task,
          location: form.location,
          owner: form.owner,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((prev) => resort([...prev, data]));
      setForm({ time: "", task: "", location: "", owner: "" });
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    }
  }

  async function remove(id: string) {
    const prev = items;
    setItems((p) => p.filter((i) => i.id !== id));
    try {
      const res = await fetch(`/api/events/${eventId}/logistics/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setItems(prev);
      toast.error("Failed to delete");
    }
  }

  async function generateStarter() {
    const base = buildUpTime ? new Date(buildUpTime) : new Date(`${eventDateOnly}T16:00`);
    const plus = (mins: number) => new Date(base.getTime() + mins * 60000).toISOString();
    const starters = [
      { time: plus(0), task: "Crew arrives at venue", owner: "Build team" },
      { time: plus(30), task: "Sound system setup", owner: "Sound" },
      { time: plus(90), task: "Activity stations set up", owner: "Build team" },
      { time: plus(150), task: "Doors open", owner: "Front of house" },
    ];
    try {
      const res = await fetch(`/api/events/${eventId}/logistics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(starters),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((prev) => resort([...prev, ...data]));
      toast.success("Starter timeline added");
      router.refresh();
    } catch {
      toast.error("Failed to generate timeline");
    }
  }

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <div className="flex flex-col items-start gap-2 rounded-lg bg-brand-purple-light p-3 text-sm text-brand-purple">
          <span>No logistics yet. Generate a starter timeline from your build-up time.</span>
          <button
            onClick={generateStarter}
            className="flex items-center gap-1.5 font-medium hover:underline"
          >
            <Sparkles className="h-4 w-4" />
            Generate starter timeline
          </button>
        </div>
      )}

      <ul className="space-y-1.5">
        {items.map((it) => (
          <li
            key={it.id}
            className="group flex items-center gap-3 rounded-lg border bg-surface-0 px-3 py-2"
          >
            <button
              onClick={() => toggle(it.id, !it.done)}
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                it.done ? "border-brand-purple bg-brand-purple text-white" : "border-line-strong"
              )}
              aria-label="Toggle done"
            >
              {it.done && <Check className="h-3.5 w-3.5" />}
            </button>
            <span className="w-14 shrink-0 text-sm font-semibold tabular-nums text-ink-primary">
              {formatTime(it.time)}
            </span>
            <div className="min-w-0 flex-1">
              <span className={cn("text-sm", it.done ? "text-ink-muted line-through" : "text-ink-primary")}>
                {it.task}
              </span>
              <div className="flex flex-wrap gap-x-3 text-xs text-ink-muted">
                {it.owner && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {it.owner}
                  </span>
                )}
                {it.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {it.location}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => remove(it.id)}
              className="opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      {open ? (
        <div className="space-y-2 rounded-lg border bg-surface-1 p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Input type="time" value={form.time} onChange={(e) => set("time", e.target.value)} />
            <Input placeholder="Task" value={form.task} onChange={(e) => set("task", e.target.value)} className="sm:col-span-1" />
            <Input placeholder="Owner" value={form.owner} onChange={(e) => set("owner", e.target.value)} />
            <Input placeholder="Location" value={form.location} onChange={(e) => set("location", e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={add}>
              <Check className="h-4 w-4" />
              Add task
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-brand-purple hover:text-brand-purple-dark"
        >
          <Plus className="h-4 w-4" />
          Add logistics item
        </button>
      )}
    </div>
  );
}
