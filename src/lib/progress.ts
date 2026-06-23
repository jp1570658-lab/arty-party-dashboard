// Lightweight build-completion score for an event, used by progress rings.

export interface ProgressFlags {
  activities: boolean;
  team: boolean;
  logistics: boolean;
  runOfShow: boolean;
  budget: boolean;
  marketing: boolean;
  media: boolean;
  postAnalysis: boolean;
}

export function computeProgress(flags: Partial<ProgressFlags>): number {
  const keys: (keyof ProgressFlags)[] = [
    "activities",
    "team",
    "logistics",
    "runOfShow",
    "budget",
    "marketing",
    "media",
    "postAnalysis",
  ];
  const done = keys.filter((k) => flags[k]).length;
  return Math.round((done / keys.length) * 100);
}

// Build flags from a Prisma event with _count + relation presence.
export function flagsFromEvent(e: {
  _count?: {
    activities?: number;
    teamMembers?: number;
    logistics?: number;
    runOfShow?: number;
    mediaFiles?: number;
  };
  budget?: { items?: unknown[] } | null;
  marketingPlan?: unknown | null;
  postAnalysis?: unknown | null;
}): number {
  return computeProgress({
    activities: (e._count?.activities ?? 0) > 0,
    team: (e._count?.teamMembers ?? 0) > 0,
    logistics: (e._count?.logistics ?? 0) > 0,
    runOfShow: (e._count?.runOfShow ?? 0) > 0,
    budget: (e.budget?.items?.length ?? 0) > 0,
    marketing: !!e.marketingPlan,
    media: (e._count?.mediaFiles ?? 0) > 0,
    postAnalysis: !!e.postAnalysis,
  });
}
