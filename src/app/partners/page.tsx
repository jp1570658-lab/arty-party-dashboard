import { prisma } from "@/lib/db";
import { PartnersClient } from "@/components/partners/PartnersClient";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  const partners = await prisma.partner.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { events: true } } },
  });
  return <PartnersClient partners={partners} />;
}
