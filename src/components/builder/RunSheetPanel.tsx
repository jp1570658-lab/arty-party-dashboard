"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Clipboard, Download, ExternalLink, Link2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, Field, Input, Textarea } from "@/components/ui/primitives";
import { runSheetPath, type KeyContact } from "@/lib/run-sheet";
import { zonedTimeKey, zonedToIso } from "@/lib/timezone";

export interface RunSheetData {
  shareToken: string;
  doorsTime: string | null;
  address: string | null;
  parkingNotes: string | null;
  keyContacts: KeyContact[];
  emergencyContact: string | null;
  nearestHospital: string | null;
  generalNotes: string | null;
}

/**
 * Header/contact block of the internal event call sheet. The who/what/when grid
 * below it is the existing logistics list — together they form the sheet that
 * the share link and PDF render.
 */
export function RunSheetPanel({
  eventId,
  eventDateOnly,
  initial,
}: {
  eventId: string;
  /** yyyy-mm-dd in Brussels — anchors the doors time. */
  eventDateOnly: string;
  initial: RunSheetData;
}) {
  const [data, setData] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const path = runSheetPath(data.shareToken);

  function set<K extends keyof RunSheetData>(k: K, v: RunSheetData[K]) {
    setData((d) => ({ ...d, [k]: v }));
  }

  async function save(patch: Partial<RunSheetData>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/run-sheet`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  /** Save on blur so JP never has to hunt for a save button. */
  function blurSave<K extends keyof RunSheetData>(k: K) {
    return () => save({ [k]: data[k] } as Partial<RunSheetData>);
  }

  async function copyLink() {
    const url = typeof window !== "undefined" ? window.location.origin + path : path;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Call sheet link copied — paste it into WhatsApp");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select the link and copy manually");
    }
  }

  function updateContact(i: number, patch: Partial<KeyContact>) {
    const next = data.keyContacts.map((c, idx) => (idx === i ? { ...c, ...patch } : c));
    set("keyContacts", next);
    return next;
  }

  return (
    <div className="space-y-4 rounded-xl border bg-surface-1 p-4">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-ink-muted" />
          <span className="label">Shareable call sheet</span>
          {saving && <span className="text-[10px] text-ink-muted">saving…</span>}
        </div>
        <p className="mb-2 text-xs text-ink-muted">
          Read-only link for the venue, vendors and crew — no app access needed.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <code className="flex-1 truncate rounded-md border bg-surface-0 px-3 py-2 text-xs text-ink-secondary">
            {path}
          </code>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={copyLink}>
              {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Link href={path} target="_blank" rel="noopener noreferrer" className="btn-ghost">
              <ExternalLink className="h-4 w-4" />
              View
            </Link>
            <a
              href={`/api/events/${eventId}/run-sheet/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
            >
              <Download className="h-4 w-4" />
              PDF
            </a>
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-t pt-4 sm:grid-cols-2">
        <Field label="Doors time" hint="Leave blank to use the event start time.">
          <Input
            type="time"
            value={data.doorsTime ? zonedTimeKey(data.doorsTime) : ""}
            onChange={(e) => {
              const v = e.target.value;
              const iso = v ? zonedToIso(eventDateOnly, v) : null;
              set("doorsTime", iso);
              save({ doorsTime: iso });
            }}
          />
        </Field>
        <Field label="Address">
          <Input
            value={data.address ?? ""}
            onChange={(e) => set("address", e.target.value)}
            onBlur={blurSave("address")}
            placeholder="Full venue address"
          />
        </Field>
        <Field label="Parking & access">
          <Input
            value={data.parkingNotes ?? ""}
            onChange={(e) => set("parkingNotes", e.target.value)}
            onBlur={blurSave("parkingNotes")}
            placeholder="Loading bay, entrance to use, lift access…"
          />
        </Field>
        <Field label="Emergency contact" hint="Who to call if something goes wrong.">
          <Input
            value={data.emergencyContact ?? ""}
            onChange={(e) => set("emergencyContact", e.target.value)}
            onBlur={blurSave("emergencyContact")}
            placeholder="Name + phone"
          />
        </Field>
        <Field label="Nearest hospital">
          <Input
            value={data.nearestHospital ?? ""}
            onChange={(e) => set("nearestHospital", e.target.value)}
            onBlur={blurSave("nearestHospital")}
            placeholder="Name + address"
          />
        </Field>
      </div>

      <div className="border-t pt-4">
        <span className="label mb-2 block">Key contacts</span>
        <div className="space-y-2">
          {data.keyContacts.map((c, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="Name"
                value={c.name}
                onChange={(e) => updateContact(i, { name: e.target.value })}
                onBlur={() => save({ keyContacts: data.keyContacts })}
              />
              <Input
                placeholder="Role"
                value={c.role}
                onChange={(e) => updateContact(i, { role: e.target.value })}
                onBlur={() => save({ keyContacts: data.keyContacts })}
              />
              <Input
                placeholder="Phone"
                value={c.phone}
                onChange={(e) => updateContact(i, { phone: e.target.value })}
                onBlur={() => save({ keyContacts: data.keyContacts })}
              />
              <button
                onClick={() => {
                  const next = data.keyContacts.filter((_, idx) => idx !== i);
                  set("keyContacts", next);
                  save({ keyContacts: next });
                }}
                className="shrink-0 px-1 text-ink-muted transition-colors hover:text-danger"
                aria-label="Remove contact"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() =>
            set("keyContacts", [...data.keyContacts, { name: "", role: "", phone: "" }])
          }
          className="mt-2 flex items-center gap-1.5 text-sm font-medium text-brand-purple hover:text-brand-purple-dark"
        >
          <Plus className="h-4 w-4" />
          Add contact
        </button>
      </div>

      <div className="border-t pt-4">
        <Field label="Notes for the team">
          <Textarea
            value={data.generalNotes ?? ""}
            onChange={(e) => set("generalNotes", e.target.value)}
            onBlur={blurSave("generalNotes")}
            placeholder="Anything the crew and vendors need to know on the day…"
          />
        </Field>
      </div>
    </div>
  );
}

