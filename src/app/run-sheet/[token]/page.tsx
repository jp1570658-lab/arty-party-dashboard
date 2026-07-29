import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, Car, MapPin, Phone } from "lucide-react";
import { prisma } from "@/lib/db";
import { parseKeyContacts } from "@/lib/run-sheet";
import { formatDate, formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Event Call Sheet",
  robots: { index: false, follow: false },
};

/** Read-only operational call sheet, shared with venue/vendors by link. */
export default async function PublicRunSheetPage({
  params,
}: {
  params: { token: string };
}) {
  const sheet = await prisma.eventCallSheet.findUnique({
    where: { shareToken: params.token },
    include: {
      event: {
        include: { logistics: { orderBy: { time: "asc" } } },
      },
    },
  });

  if (!sheet) notFound();

  const { event } = sheet;
  const contacts = parseKeyContacts(sheet.keyContacts);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 print:bg-white">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        {/* Header block */}
        <header className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600">
            Arty Party — Call Sheet
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 sm:text-3xl">
            {event.name}
          </h1>
          <p className="mt-1 text-sm text-gray-600">{formatDate(event.date)}</p>

          <dl className="mt-5 grid gap-x-6 gap-y-3 border-t border-gray-200 pt-5 sm:grid-cols-3">
            <Stat label="Build-up from" value={event.buildUpTime ? formatTime(event.buildUpTime) : "—"} />
            <Stat
              label="Doors"
              value={formatTime(sheet.doorsTime ?? event.date)}
            />
            <Stat
              label="Breakdown from"
              value={event.breakdownTime ? formatTime(event.breakdownTime) : "—"}
            />
          </dl>
        </header>

        {/* Schedule grid — who / what / when */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Schedule
          </h2>
          {event.logistics.length === 0 ? (
            <p className="text-sm text-gray-500">No schedule items yet.</p>
          ) : (
            <div className="-mx-2 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-[11px] uppercase tracking-wide text-gray-500">
                    <th className="px-2 pb-2 font-medium">When</th>
                    <th className="px-2 pb-2 font-medium">What</th>
                    <th className="px-2 pb-2 font-medium">Who</th>
                    <th className="px-2 pb-2 font-medium">Where</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {event.logistics.map((l) => (
                    <tr key={l.id} className="align-top">
                      <td className="whitespace-nowrap px-2 py-2.5 font-medium text-gray-900">
                        {formatTime(l.time)}
                      </td>
                      <td className="px-2 py-2.5 text-gray-800">{l.task}</td>
                      <td className="px-2 py-2.5 text-gray-600">{l.owner || "—"}</td>
                      <td className="px-2 py-2.5 text-gray-600">{l.location || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Contacts */}
        {contacts.length > 0 && (
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-500">
              Key contacts
            </h2>
            <ul className="space-y-2">
              {contacts.map((c, i) => (
                <li key={i} className="flex flex-wrap items-baseline gap-x-3 text-sm">
                  <span className="font-medium text-gray-900">{c.name}</span>
                  {c.role && <span className="text-gray-500">{c.role}</span>}
                  {c.phone && (
                    <a
                      href={`tel:${c.phone.replace(/\s/g, "")}`}
                      className="ml-auto inline-flex items-center gap-1.5 font-medium text-violet-600 hover:underline"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {c.phone}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Location & safety */}
        <section className="grid gap-4 sm:grid-cols-2">
          <InfoCard icon={MapPin} title="Location">
            <p className="text-sm text-gray-800">{sheet.address || event.location}</p>
            {event.venueNotes && (
              <p className="mt-2 whitespace-pre-line text-sm text-gray-600">
                {event.venueNotes}
              </p>
            )}
          </InfoCard>

          {sheet.parkingNotes && (
            <InfoCard icon={Car} title="Parking & access">
              <p className="whitespace-pre-line text-sm text-gray-800">
                {sheet.parkingNotes}
              </p>
            </InfoCard>
          )}

          {(sheet.emergencyContact || sheet.nearestHospital) && (
            <InfoCard icon={AlertTriangle} title="In an emergency" tone="danger">
              {sheet.emergencyContact && (
                <p className="text-sm text-gray-800">{sheet.emergencyContact}</p>
              )}
              {sheet.nearestHospital && (
                <p className="mt-1 text-sm text-gray-600">
                  Nearest hospital: {sheet.nearestHospital}
                </p>
              )}
            </InfoCard>
          )}
        </section>

        {sheet.generalNotes && (
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
              Notes
            </h2>
            <p className="whitespace-pre-line text-sm text-gray-800">
              {sheet.generalNotes}
            </p>
          </section>
        )}

        <p className="text-center text-xs text-gray-500">
          Arty Party · This sheet is view-only and may be updated before the event.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold text-gray-900">{value}</dd>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  tone,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  tone?: "danger";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border p-5 shadow-sm ${
        tone === "danger" ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon
          className={`h-4 w-4 ${tone === "danger" ? "text-red-600" : "text-gray-400"}`}
        />
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}
