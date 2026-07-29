"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Loader2, Paperclip } from "lucide-react";
import {
  MATERIALS_ACCEPT,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_LABEL,
  PROMO_MEDIA_ACCEPT,
  type CallSheetPalette,
} from "@/lib/call-sheet";

/** Public-facing form: styling is inline-themed per event, independent of the
 *  dashboard's design tokens (artists never see the dashboard chrome). */

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent";

function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-medium uppercase tracking-wide text-gray-600">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

export function CallSheetForm({
  eventId,
  palette,
}: {
  eventId: string;
  palette: CallSheetPalette;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ updated: boolean } | null>(null);

  const focusRing = { ["--tw-ring-color" as string]: palette.accent };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);

    // Client-side size gate for fast feedback — the API enforces it again.
    for (const field of ["promoMediaFile", "materialsFile"]) {
      const file = data.get(field);
      if (file instanceof File && file.size > MAX_UPLOAD_BYTES) {
        setError(`"${file.name}" is larger than ${MAX_UPLOAD_LABEL}. Upload a smaller file or paste a link instead.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/call-sheet`, {
        method: "POST",
        body: data,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Something went wrong");
      setDone({ updated: Boolean(json.updated) });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: palette.tint, color: palette.accent }}
        >
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          {done.updated ? "Your call sheet is updated" : "Thanks — we've got it"}
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-gray-600">
          {done.updated
            ? "We've replaced your previous answers with these ones."
            : "Your details are with the Arty Party team. You'll get an artist briefing closer to the date."}
        </p>
        <button
          type="button"
          onClick={() => {
            setDone(null);
            formRef.current?.reset();
          }}
          className="mt-6 text-sm font-medium underline underline-offset-4"
          style={{ color: palette.accent }}
        >
          Submit for another artist
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="space-y-4">
        <FormField label="Your name" required>
          <input
            name="name"
            required
            minLength={2}
            className={inputClass}
            style={focusRing}
            placeholder="Jane Doe"
          />
        </FormField>

        <FormField
          label="Artist name"
          required
          hint="How you're billed. This is how we tell submissions apart — use the same one if you come back to update."
        >
          <input
            name="artistName"
            required
            className={inputClass}
            style={focusRing}
            placeholder="DJ Nightshade"
          />
        </FormField>

        <FormField label="Email" required>
          <input
            name="email"
            type="email"
            required
            className={inputClass}
            style={focusRing}
            placeholder="you@example.com"
          />
        </FormField>

        <FormField label="Social handles" hint="Separate multiple with commas.">
          <input
            name="socialHandles"
            className={inputClass}
            style={focusRing}
            placeholder="@yourhandle, tiktok.com/@yourhandle"
          />
        </FormField>

        <FormField label="Bio" hint="Used for promo and introductions on the night.">
          <textarea
            name="bio"
            rows={5}
            className={`${inputClass} resize-y`}
            style={focusRing}
            placeholder="A few sentences about you and your work."
          />
        </FormField>
      </div>

      <div className="space-y-4 border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900">Promo media</h3>
        <p className="-mt-2 text-xs text-gray-500">
          Images, video or audio we can use to promote you. Upload a file or paste a
          link — either is fine.
        </p>
        <FormField label="Upload" hint={`Max ${MAX_UPLOAD_LABEL} per file.`}>
          <input
            name="promoMediaFile"
            type="file"
            accept={PROMO_MEDIA_ACCEPT}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700"
          />
        </FormField>
        <FormField label="Or paste a link">
          <input
            name="promoMediaLink"
            type="url"
            className={inputClass}
            style={focusRing}
            placeholder="https://drive.google.com/..."
          />
        </FormField>
      </div>

      <div className="space-y-4 border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900">On the day</h3>

        <FormField
          label="Requirements"
          hint="Anything you need from us — gear, space, timing, access, dietary, anything."
        >
          <textarea
            name="requirements"
            rows={5}
            className={`${inputClass} resize-y`}
            style={focusRing}
            placeholder="Write freely — there's no checklist here."
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Arrival time" hint="When you can be at the venue.">
            <input
              name="arrivalTime"
              className={inputClass}
              style={focusRing}
              placeholder="e.g. 17:30, or 'an hour before my set'"
            />
          </FormField>
          <FormField label="Sound check duration" hint="How long you need.">
            <input
              name="soundCheckDuration"
              className={inputClass}
              style={focusRing}
              placeholder="e.g. 20 minutes"
            />
          </FormField>
        </div>
      </div>

      <div className="space-y-4 border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900">Materials</h3>
        <p className="-mt-2 text-xs text-gray-500">
          Songs, poems, sound files, set notes — whatever we need on the night.
        </p>
        <FormField label="Upload" hint={`Audio, PDF, docs, images or video. Max ${MAX_UPLOAD_LABEL}.`}>
          <input
            name="materialsFile"
            type="file"
            accept={MATERIALS_ACCEPT}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700"
          />
        </FormField>
        <FormField label="Or paste a link">
          <input
            name="materialsLink"
            type="url"
            className={inputClass}
            style={focusRing}
            placeholder="https://dropbox.com/..."
          />
        </FormField>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 border-t border-gray-200 pt-6">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: palette.accent, color: palette.onAccent }}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Sending…" : "Submit call sheet"}
        </button>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <Paperclip className="h-3.5 w-3.5" />
          Uploads up to {MAX_UPLOAD_LABEL}
        </span>
      </div>
    </form>
  );
}
