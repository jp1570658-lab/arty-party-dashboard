import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, EmptyState } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/events/StatusBadge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const events = await prisma.event.findMany({ orderBy: { date: "desc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-primary">Reports</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Generate a shareable report for any event — preview anytime, finalise when complete.
        </p>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No events to report on yet"
          description="Create and run an event, then generate a professional PDF report here."
        />
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <Link key={e.id} href={`/events/${e.id}/report`}>
              <Card className="flex items-center justify-between transition-shadow hover:shadow-md">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink-primary">{e.name}</span>
                    <StatusBadge status={e.status} />
                  </div>
                  <div className="text-sm text-ink-secondary">
                    {formatDate(e.date)} · {e.location}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-brand-purple">
                  View report
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
