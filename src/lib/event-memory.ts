import { prisma } from "@/lib/db";

/** Context from past completed events — the "learning" the AI draws on. */
export async function buildEventMemory(excludeEventId?: string) {
  const pastEvents = await prisma.event.findMany({
    where: {
      status: { in: ["COMPLETED", "ARCHIVED"] },
      ...(excludeEventId ? { id: { not: excludeEventId } } : {}),
    },
    include: {
      activities: { include: { activity: true } },
      budget: { include: { items: true } },
      postAnalysis: true,
    },
    orderBy: { date: "desc" },
    take: 10,
  });

  return pastEvents.map((e) => ({
    name: e.name,
    date: e.date.toISOString().slice(0, 10),
    location: e.location,
    theme: e.theme,
    activities: e.activities.map((a) => a.activity.name),
    totalBudget: e.budget?.items.reduce(
      (sum, i) => sum + (i.actual ?? i.estimated),
      0
    ),
    attendees: e.actualAttendees,
    rating: e.postAnalysis?.overallRating,
    whatWentWell: e.postAnalysis?.whatWentWell,
    improvements: e.postAnalysis?.improvements,
  }));
}

/** A summary of the current event's build state, including what's missing. */
export async function buildCurrentEventContext(eventId: string) {
  const e = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      activities: { include: { activity: true } },
      teamMembers: true,
      logistics: true,
      runOfShow: true,
      budget: { include: { items: true } },
      marketingPlan: true,
      mediaFiles: true,
      postAnalysis: true,
      partners: { include: { partner: true } },
      guestInvites: true,
    },
  });
  if (!e) return null;

  const missing: string[] = [];
  if (e.activities.length === 0) missing.push("activities");
  if (e.teamMembers.length === 0) missing.push("team");
  if (e.logistics.length === 0) missing.push("logistics timeline");
  if (e.runOfShow.length === 0) missing.push("run of show");
  if ((e.budget?.items.length ?? 0) === 0) missing.push("budget");
  if (!e.marketingPlan) missing.push("marketing plan");
  if (e.guestInvites.length === 0) missing.push("guest invites");
  if (e.partners.length === 0) missing.push("partners");

  return {
    name: e.name,
    date: e.date.toISOString().slice(0, 10),
    location: e.location,
    theme: e.theme,
    status: e.status,
    capacity: e.capacity,
    activities: e.activities.map((a) => a.activity.name),
    teamCount: e.teamMembers.length,
    logisticsCount: e.logistics.length,
    runOfShowCount: e.runOfShow.length,
    budgetItems: e.budget?.items.length ?? 0,
    estimatedBudget: e.budget?.items.reduce((s, i) => s + i.estimated, 0) ?? 0,
    hasMarketingPlan: !!e.marketingPlan,
    mediaCount: e.mediaFiles.length,
    guestInvites: e.guestInvites.length,
    partners: e.partners.map((p) => p.partner.name),
    missingSections: missing,
  };
}
