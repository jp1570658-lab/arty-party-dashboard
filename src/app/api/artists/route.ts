import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ARTIST_CATEGORIES } from "@/lib/enums";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category"); // comma-separated allowed
    const where = category
      ? { category: { in: category.split(",") } }
      : undefined;

    const artists = await prisma.artist.findMany({
      where,
      orderBy: { name: "asc" },
      include: { _count: { select: { events: true } } },
    });
    return NextResponse.json(artists);
  } catch (err) {
    console.error("GET artists", err);
    return NextResponse.json({ error: "Failed to load artists" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.category) {
      return NextResponse.json({ error: "Name and category required" }, { status: 400 });
    }
    if (!ARTIST_CATEGORIES.includes(body.category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    const artist = await prisma.artist.create({
      data: {
        name: body.name,
        category: body.category,
        subcategory: body.subcategory || null,
        email: body.email || null,
        phone: body.phone || null,
        instagram: body.instagram || null,
        tiktok: body.tiktok || null,
        website: body.website || null,
        notes: body.notes || null,
        availability: body.availability || null,
      },
    });
    return NextResponse.json(artist, { status: 201 });
  } catch (err) {
    console.error("POST artists", err);
    return NextResponse.json({ error: "Failed to create artist" }, { status: 500 });
  }
}
