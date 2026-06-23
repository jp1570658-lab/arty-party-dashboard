import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

async function ensureBudget(eventId: string) {
  let budget = await prisma.budget.findUnique({
    where: { eventId },
    include: { items: true },
  });
  if (!budget) {
    budget = await prisma.budget.create({
      data: { eventId },
      include: { items: true },
    });
  }
  return budget;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const budget = await ensureBudget(params.id);
    return NextResponse.json(budget);
  } catch (err) {
    console.error("GET budget", err);
    return NextResponse.json({ error: "Failed to load budget" }, { status: 500 });
  }
}

// Add a budget line item
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const b = await req.json();
    if (!b.name || !b.category) {
      return NextResponse.json({ error: "name and category required" }, { status: 400 });
    }
    const budget = await ensureBudget(params.id);
    const item = await prisma.budgetItem.create({
      data: {
        budgetId: budget.id,
        category: b.category,
        name: b.name,
        estimated: Number(b.estimated) || 0,
        actual: b.actual !== undefined && b.actual !== null && b.actual !== "" ? Number(b.actual) : null,
        paid: !!b.paid,
        notes: b.notes || null,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error("POST budget item", err);
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  }
}
