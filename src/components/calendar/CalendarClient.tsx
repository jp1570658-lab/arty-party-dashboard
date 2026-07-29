"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button, Input, Select, Textarea } from "@/components/ui/primitives";
import {
  PLANNER_KINDS,
  PLANNER_KIND_LABELS,
  PLANNER_KIND_STYLES,
  type PlannerKind,
} from "@/lib/enums";
import { cn, formatDate } from "@/lib/utils";

export interface CalendarEvent {
  id: string;
  name: string;
  date: string;
  status: string;
}

export interface PlannerTaskItem {
  id: string;
  title: string;
  date: string;
  kind: string;
  notes: string | null;
  done: boolean;
  eventId: string | null;
  eventName: string | null;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Local yyyy-mm-dd — avoids the UTC shift that toISOString() introduces. */
function dayKey(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

/** Monday-first grid covering the whole month plus padding days. */
function buildGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Sunday=0 → Monday-first
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function CalendarClient({
  events,
  initialTasks,
}: {
  events: CalendarEvent[];
  initialTasks: PlannerTaskItem[];
}) {
  const router = useRouter();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [tasks, setTasks] = useState(initialTasks);
  const [selected, setSelected] = useState<string>(dayKey(today));
  const [adding, setAdding] = useState(false);

  const grid = useMemo(
    () => buildGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor]
  );

  const eventsByDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const k = dayKey(e.date);
      m.set(k, [...(m.get(k) ?? []), e]);
    }
    return m;
  }, [events]);

  const tasksByDay = useMemo(() => {
    const m = new Map<string, PlannerTaskItem[]>();
    for (const t of tasks) {
      const k = dayKey(t.date);
      m.set(k, [...(m.get(k) ?? []), t]);
    }
    return m;
  }, [tasks]);

  const selectedEvents = eventsByDay.get(selected) ?? [];
  const selectedTasks = tasksByDay.get(selected) ?? [];

  async function addTask(payload: {
    title: string;
    kind: string;
    notes: string;
    eventId: string;
  }) {
    try {
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          eventId: payload.eventId || null,
          // Noon avoids any timezone rollover into the neighbouring day.
          date: new Date(`${selected}T12:00:00`).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTasks((t) => [
        ...t,
        {
          id: data.id,
          title: data.title,
          date: data.date,
          kind: data.kind,
          notes: data.notes,
          done: data.done,
          eventId: data.eventId,
          eventName: data.event?.name ?? null,
        },
      ]);
      setAdding(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    }
  }

  async function toggleTask(t: PlannerTaskItem) {
    const prev = tasks;
    setTasks((list) =>
      list.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x))
    );
    try {
      const res = await fetch(`/api/planner/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !t.done }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setTasks(prev);
      toast.error("Failed to update");
    }
  }

  async function deleteTask(t: PlannerTaskItem) {
    const prev = tasks;
    setTasks((list) => list.filter((x) => x.id !== t.id));
    try {
      const res = await fetch(`/api/planner/${t.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setTasks(prev);
      toast.error("Failed to delete");
    }
  }

  const monthLabel = cursor.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink-primary">Calendar</h1>
          <p className="text-sm text-ink-secondary">
            Event dates plus your planning and content schedule.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
            }
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[150px] text-center text-sm font-semibold text-ink-primary">
            {monthLabel}
          </span>
          <Button
            variant="ghost"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
            }
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const now = new Date();
              setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
              setSelected(dayKey(now));
            }}
          >
            Today
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Month grid */}
        <div className="card p-0">
          <div className="grid grid-cols-7 border-b">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-muted"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {grid.map((d) => {
              const k = dayKey(d);
              const inMonth = d.getMonth() === cursor.getMonth();
              const isToday = k === dayKey(today);
              const dayEvents = eventsByDay.get(k) ?? [];
              const dayTasks = tasksByDay.get(k) ?? [];
              return (
                <button
                  key={k}
                  onClick={() => setSelected(k)}
                  className={cn(
                    "min-h-[86px] border-b border-r p-1.5 text-left transition-colors last:border-r-0 hover:bg-surface-2",
                    !inMonth && "opacity-40",
                    selected === k && "bg-brand-purple-light"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                      isToday
                        ? "bg-brand-purple font-semibold text-white"
                        : "text-ink-secondary"
                    )}
                  >
                    {d.getDate()}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.map((e) => (
                      <div
                        key={e.id}
                        className="truncate rounded bg-brand-purple px-1 py-0.5 text-[10px] font-medium text-white"
                        title={e.name}
                      >
                        {e.name}
                      </div>
                    ))}
                    {dayTasks.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        className={cn(
                          "truncate rounded px-1 py-0.5 text-[10px]",
                          PLANNER_KIND_STYLES[t.kind as PlannerKind] ??
                            PLANNER_KIND_STYLES.TASK,
                          t.done && "line-through opacity-60"
                        )}
                        title={t.title}
                      >
                        {t.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="px-1 text-[10px] text-ink-muted">
                        +{dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day detail */}
        <div className="card space-y-4">
          <div>
            <span className="section-label mb-0">Selected day</span>
            <h2 className="text-lg font-semibold text-ink-primary">
              {formatDate(`${selected}T12:00:00`)}
            </h2>
          </div>

          {selectedEvents.length > 0 && (
            <div className="space-y-1.5">
              <span className="label">Events</span>
              {selectedEvents.map((e) => (
                <Link
                  key={e.id}
                  href={`/events/${e.id}`}
                  className="block rounded-lg border bg-surface-0 px-3 py-2 text-sm font-medium text-ink-primary hover:bg-surface-2"
                >
                  {e.name}
                </Link>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <span className="label">Planning &amp; content</span>
            {selectedTasks.length === 0 ? (
              <p className="text-sm text-ink-muted">Nothing scheduled.</p>
            ) : (
              <ul className="space-y-1.5">
                {selectedTasks.map((t) => (
                  <li
                    key={t.id}
                    className="group flex items-start gap-2 rounded-lg border bg-surface-0 px-3 py-2"
                  >
                    <button
                      onClick={() => toggleTask(t)}
                      className={cn(
                        "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition-colors",
                        t.done
                          ? "border-brand-purple bg-brand-purple text-white"
                          : "border-line-strong hover:border-brand-purple"
                      )}
                      aria-label={t.done ? "Mark not done" : "Mark done"}
                    >
                      {t.done && <Check className="h-3 w-3" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm",
                          t.done ? "text-ink-muted line-through" : "text-ink-primary"
                        )}
                      >
                        {t.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px]",
                            PLANNER_KIND_STYLES[t.kind as PlannerKind] ??
                              PLANNER_KIND_STYLES.TASK
                          )}
                        >
                          {PLANNER_KIND_LABELS[t.kind as PlannerKind] ?? t.kind}
                        </span>
                        {t.eventName && (
                          <span className="truncate text-[10px] text-ink-muted">
                            {t.eventName}
                          </span>
                        )}
                      </div>
                      {t.notes && (
                        <p className="mt-1 whitespace-pre-line text-xs text-ink-muted">
                          {t.notes}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteTask(t)}
                      className="text-ink-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <AnimatePresence initial={false}>
            {adding ? (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <AddTaskForm
                  events={events}
                  onCancel={() => setAdding(false)}
                  onAdd={addTask}
                />
              </motion.div>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-brand-purple hover:text-brand-purple-dark"
              >
                <Plus className="h-4 w-4" />
                Add to this day
              </button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function AddTaskForm({
  events,
  onAdd,
  onCancel,
}: {
  events: CalendarEvent[];
  onAdd: (p: { title: string; kind: string; notes: string; eventId: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    kind: "TASK" as string,
    notes: "",
    eventId: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-2 rounded-lg border bg-surface-1 p-3">
      <Input
        autoFocus
        placeholder="What needs doing?"
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <Select value={form.kind} onChange={(e) => set("kind", e.target.value)}>
          {PLANNER_KINDS.map((k) => (
            <option key={k} value={k}>
              {PLANNER_KIND_LABELS[k]}
            </option>
          ))}
        </Select>
        <Select value={form.eventId} onChange={(e) => set("eventId", e.target.value)}>
          <option value="">No event</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </Select>
      </div>
      <Textarea
        placeholder="Notes (optional)"
        value={form.notes}
        onChange={(e) => set("notes", e.target.value)}
        className="min-h-[60px]"
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          <X className="h-4 w-4" />
          Cancel
        </Button>
        <Button
          loading={saving}
          onClick={async () => {
            if (!form.title.trim()) {
              toast.error("Give it a title");
              return;
            }
            setSaving(true);
            await onAdd(form);
            setSaving(false);
          }}
        >
          <Check className="h-4 w-4" />
          Add
        </Button>
      </div>
    </div>
  );
}
