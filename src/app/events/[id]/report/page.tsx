import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buildReportData } from "@/lib/report-data";
import { ReportViewer } from "@/components/report/ReportViewer";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await buildReportData(params.id);
  if (!data) notFound();

  return (
    <div className="space-y-5">
      <div className="print:hidden">
        <Link
          href={`/events/${params.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to event
        </Link>
      </div>
      <ReportViewer eventId={params.id} data={data} />
    </div>
  );
}
