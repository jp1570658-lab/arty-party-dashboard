import { prisma } from "@/lib/db";
import { CommunityClient } from "@/components/community/CommunityClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Community — Arty-Party" };

export default async function CommunityPage() {
  const insights = await prisma.insight.findMany({
    where: { dismissed: false },
    orderBy: [{ batchDate: "desc" }, { createdAt: "asc" }],
    take: 200,
  });

  return (
    <CommunityClient
      initial={insights.map((i) => ({
        id: i.id,
        kind: i.kind,
        title: i.title,
        body: i.body,
        relevance: i.relevance,
        url: i.url,
        source: i.source,
        batchDate: i.batchDate.toISOString(),
        saved: i.saved,
        dismissed: i.dismissed,
      }))}
    />
  );
}
