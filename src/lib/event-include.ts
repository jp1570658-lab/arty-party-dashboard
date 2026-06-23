import { Prisma } from "@prisma/client";

export const eventInclude = {
  activities: { include: { activity: true, materials: true } },
  teamMembers: { include: { teamMember: true, artist: true } },
  logistics: { orderBy: { time: "asc" } },
  runOfShow: { orderBy: { order: "asc" } },
  budget: { include: { items: true } },
  marketingPlan: true,
  postAnalysis: true,
  meetings: { orderBy: { date: "desc" } },
  mediaFiles: { orderBy: { createdAt: "desc" } },
  partners: { include: { partner: true } },
  guestInvites: { include: { guest: true } },
} satisfies Prisma.EventInclude;

export type FullEvent = Prisma.EventGetPayload<{ include: typeof eventInclude }>;
