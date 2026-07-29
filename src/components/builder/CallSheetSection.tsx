"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  Clipboard,
  ExternalLink,
  FileText,
  History,
  Link2,
  Mail,
  Trash2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Button, EmptyState, Field, Select } from "@/components/ui/primitives";
import {
  CALL_SHEET_PALETTES,
  callSheetPath,
  resolvePalette,
} from "@/lib/call-sheet";
import { cn } from "@/lib/utils";

export interface CallSheetSubmissionItem {
  id: string;
  name: string;
  artistName: string;
  email: string;
  socialHandles: string | null;
  bio: string | null;
  promoMediaUrl: string | null;
  promoMediaFilename: string | null;
  promoMediaLink: string | null;
  requirements: string | null;
  arrivalTime: string | null;
  soundCheckDuration: string | null;
  materialsUrl: string | null;
  materialsFilename: string | null;
  materialsLink: string | null;
  createdAt: string;
  updatedAt: string;
  revisionCount: number;
}

export function CallSheetSection({
  eventId,
  initial,
  bookedArtistCount,
  initialPalette,
}: {
  eventId: string;
  initial: CallSheetSubmissionItem[];
  /** Artists attached to the event's team — the denominator for "x of y". */
  bookedArtistCount: number;
  initialPalette: string | null;
}) {
  const [submissions, setSubmissions] = useState(initial);
  const [palette, setPalette] = useState(initialPalette ?? "brand");
  const [copied, setCopied] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const path = callSheetPath(eventId);
  const accent = resolvePalette(palette).accent;

  async function copyLink() {
    const url = typeof window !== "undefined" ? window.location.origin + path : path;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Call sheet link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select the link and copy manually");
    }
  }

  async function changePalette(next: string) {
    const previous = palette;
    setPalette(next);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callSheetPalette: next }),
      });
      if (!res.ok) throw new Error();
      toast.success("Call sheet styling updated");
    } catch {
      setPalette(previous);
      toast.error("Failed to update styling");
    }
  }

  async function remove(id: string, artistName: string) {
    if (!confirm(`Delete ${artistName}'s submission? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/call-sheets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSubmissions((s) => s.filter((x) => x.id !== id));
      toast.success("Submission deleted");
    } catch {
      toast.error("Failed to delete submission");
    }
  }

  const submitted = submissions.length;

  return (
    <div className="space-y-5">
      {/* Shared link */}
      <div className="rounded-lg border bg-surface-2 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-ink-muted" />
          <span className="label">One link, every artist</span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="flex-1 truncate rounded-md border bg-surface-0 px-3 py-2 text-xs text-ink-secondary">
            {path}
          </code>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={copyLink}>
              {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
              {copied ? "Copied" : "Copy link"}
            </Button>
            <Link
              href={path}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
            >
              <ExternalLink className="h-4 w-4" />
              Preview
            </Link>
          </div>
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          Send this to everyone booked. Each artist&apos;s answers are saved
          separately under their artist name.
        </p>
      </div>

      {/* Theme styling */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-56">
          <Field label="Call sheet accent" hint="Match the event theme.">
            <Select value={palette} onChange={(e) => changePalette(e.target.value)}>
              {CALL_SHEET_PALETTES.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div
          className="mb-1 h-9 w-9 shrink-0 rounded-lg border"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
        <p className="mb-2 text-xs text-ink-muted">
          {bookedArtistCount > 0
            ? `${submitted} of ${bookedArtistCount} booked artists submitted`
            : `${submitted} submitted · add artists to the Team section to track who's outstanding`}
        </p>
      </div>

      {/* Submissions */}
      {submissions.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No call sheets yet"
          description="Once you send the link, each artist's submission lands here as its own entry."
        />
      ) : (
        <ul className="space-y-2">
          {submissions.map((s) => {
            const open = openId === s.id;
            return (
              <li key={s.id} className="rounded-lg border bg-surface-0">
                <button
                  onClick={() => setOpenId(open ? null : s.id)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-ink-primary">
                        {s.artistName}
                      </span>
                      {s.revisionCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-ink-secondary">
                          <History className="h-3 w-3" />
                          updated {s.revisionCount}×
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-ink-secondary">
                      {s.name} · {s.email}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-ink-muted transition-transform",
                      open && "rotate-180"
                    )}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 border-t px-4 py-4">
                        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                          <Detail label="Arrival time" value={s.arrivalTime} />
                          <Detail label="Sound check" value={s.soundCheckDuration} />
                          <Detail label="Socials" value={s.socialHandles} />
                          <Detail
                            label="Submitted"
                            value={new Date(s.createdAt).toLocaleString("en-GB")}
                          />
                        </dl>

                        {s.bio && <Block label="Bio" text={s.bio} />}
                        {s.requirements && (
                          <Block label="Requirements" text={s.requirements} />
                        )}

                        <FileLinks submission={s} />

                        <div className="flex flex-wrap gap-2 border-t pt-3">
                          <Link
                            href={`/events/${eventId}/briefing/${s.id}`}
                            className="btn-secondary"
                          >
                            <FileText className="h-4 w-4" />
                            Artist briefing
                          </Link>
                          <a href={`mailto:${s.email}`} className="btn-ghost">
                            <Mail className="h-4 w-4" />
                            Email
                          </a>
                          <Button
                            variant="ghost"
                            className="text-danger"
                            onClick={() => remove(s.id, s.artistName)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="text-sm text-ink-primary">{value || "—"}</dd>
    </div>
  );
}

function Block({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-lg bg-surface-2 p-3">
      <p className="mb-1 text-xs text-ink-muted">{label}</p>
      <p className="whitespace-pre-line text-sm text-ink-primary">{text}</p>
    </div>
  );
}

function FileLinks({ submission: s }: { submission: CallSheetSubmissionItem }) {
  const items = [
    s.promoMediaUrl && {
      label: s.promoMediaFilename ?? "Promo media",
      href: s.promoMediaUrl,
    },
    s.promoMediaLink && { label: "Promo media link", href: s.promoMediaLink },
    s.materialsUrl && {
      label: s.materialsFilename ?? "Materials",
      href: s.materialsUrl,
    },
    s.materialsLink && { label: "Materials link", href: s.materialsLink },
  ].filter(Boolean) as { label: string; href: string }[];

  if (items.length === 0) {
    return <p className="text-xs text-ink-muted">No files or links supplied.</p>;
  }

  return (
    <ul className="space-y-1">
      {items.map((i) => (
        <li key={i.href}>
          <a
            href={i.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-brand-purple hover:underline"
          >
            {i.label}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </li>
      ))}
    </ul>
  );
}
