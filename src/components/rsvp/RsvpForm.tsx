"use client";

import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import type { CallSheetPalette } from "@/lib/call-sheet";

export function RsvpForm({
  token,
  guestName,
  palette,
  initialStatus,
  initialPartySize,
}: {
  token: string;
  guestName: string;
  palette: CallSheetPalette;
  initialStatus: string;
  initialPartySize: number | null;
}) {
  const answered = initialStatus === "confirmed" || initialStatus === "declined";
  const [status, setStatus] = useState(answered ? initialStatus : null);
  const [partySize, setPartySize] = useState(initialPartySize ?? 1);
  const [saving, setSaving] = useState<"yes" | "no" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function respond(attending: boolean) {
    setSaving(attending ? "yes" : "no");
    setError(null);
    try {
      const res = await fetch(`/api/rsvp/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attending, partySize: attending ? partySize : 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setStatus(data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(null);
    }
  }

  if (status) {
    const coming = status === "confirmed";
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            backgroundColor: coming ? palette.tint : "#f3f4f6",
            color: coming ? palette.accent : "#6b7280",
          }}
        >
          {coming ? <Check className="h-7 w-7" /> : <X className="h-7 w-7" />}
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          {coming ? "You're on the list" : "Thanks for letting us know"}
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-gray-600">
          {coming
            ? `We've got you down${partySize > 1 ? ` for ${partySize} people` : ""}. See you there.`
            : "Sorry you can't make it — we'll catch you at the next one."}
        </p>
        <button
          onClick={() => setStatus(null)}
          className="mt-6 text-sm font-medium underline underline-offset-4"
          style={{ color: palette.accent }}
        >
          Change my answer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Hi {guestName}, can you make it?</h2>
        <p className="mt-1 text-sm text-gray-600">
          Let us know so we can plan numbers.
        </p>
      </div>

      <label className="block space-y-1.5">
        <span className="block text-xs font-medium uppercase tracking-wide text-gray-600">
          How many of you?
        </span>
        <select
          value={partySize}
          onChange={(e) => setPartySize(Number(e.target.value))}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2"
          style={{ ["--tw-ring-color" as string]: palette.accent }}
        >
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n === 1 ? "Just me" : `${n} people`}
            </option>
          ))}
        </select>
      </label>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          onClick={() => respond(true)}
          disabled={saving !== null}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: palette.accent, color: palette.onAccent }}
        >
          {saving === "yes" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          I&apos;ll be there
        </button>
        <button
          onClick={() => respond(false)}
          disabled={saving !== null}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          {saving === "no" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
          Can&apos;t make it
        </button>
      </div>
    </div>
  );
}
