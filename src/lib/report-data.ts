import { prisma } from "@/lib/db";
import { eventInclude } from "@/lib/event-include";
import { TEAM_TYPE_LABELS, type TeamType } from "@/lib/enums";

export interface ReportData {
  event: {
    name: string;
    date: string;
    location: string;
    theme: string | null;
    status: string;
    attendees: number | null;
    capacity: number | null;
  };
  programme: { name: string; team: string | null }[];
  team: { name: string; role: string; type: string; status: string }[];
  partners: { name: string; type: string; role: string | null }[];
  budget: { totalEstimated: number; totalActual: number; variance: number; byCategory: { category: string; estimated: number; actual: number }[] };
  highlights: string | null;
  challenges: string | null;
  improvements: string | null;
  audienceFeedback: string | null;
  rating: number | null;
  media: { photos: number; videos: number };
  materials: string[];
  logistics: { time: string; task: string }[];
}

export async function buildReportData(eventId: string): Promise<ReportData | null> {
  const e = await prisma.event.findUnique({
    where: { id: eventId },
    include: eventInclude,
  });
  if (!e) return null;

  const byCategory = new Map<string, { estimated: number; actual: number }>();
  for (const it of e.budget?.items ?? []) {
    const cur = byCategory.get(it.category) ?? { estimated: 0, actual: 0 };
    cur.estimated += it.estimated;
    cur.actual += it.actual ?? 0;
    byCategory.set(it.category, cur);
  }
  const totalEstimated = (e.budget?.items ?? []).reduce((s, i) => s + i.estimated, 0);
  const totalActual = (e.budget?.items ?? []).reduce((s, i) => s + (i.actual ?? 0), 0);

  const materials = Array.from(
    new Set(
      e.activities.flatMap((a) => a.materials.map((m) => m.name))
    )
  );

  return {
    event: {
      name: e.name,
      date: e.date.toISOString(),
      location: e.location,
      theme: e.theme,
      status: e.status,
      attendees: e.actualAttendees ?? e.postAnalysis?.totalAttendees ?? null,
      capacity: e.capacity,
    },
    programme: e.activities.map((a) => ({
      name: a.activity.name,
      team: a.activity.defaultTeam,
    })),
    team: e.teamMembers.map((t) => ({
      name: t.teamMember?.name ?? t.artist?.name ?? "Unknown",
      role: t.role,
      type: TEAM_TYPE_LABELS[t.teamType as TeamType] ?? t.teamType,
      status: t.status,
    })),
    partners: e.partners.map((p) => ({
      name: p.partner.name,
      type: p.partner.type,
      role: p.role,
    })),
    budget: {
      totalEstimated,
      totalActual,
      variance: totalEstimated - totalActual,
      byCategory: Array.from(byCategory.entries()).map(([category, v]) => ({
        category,
        estimated: v.estimated,
        actual: v.actual,
      })),
    },
    highlights: e.postAnalysis?.whatWentWell ?? null,
    challenges: e.postAnalysis?.whatWentWrong ?? null,
    improvements: e.postAnalysis?.improvements ?? null,
    audienceFeedback: e.postAnalysis?.audienceFeedback ?? null,
    rating: e.postAnalysis?.overallRating ?? null,
    media: {
      photos: e.mediaFiles.filter((m) => m.type === "PHOTO").length,
      videos: e.mediaFiles.filter((m) => m.type === "VIDEO").length,
    },
    materials,
    logistics: e.logistics.map((l) => ({ time: l.time.toISOString(), task: l.task })),
  };
}
