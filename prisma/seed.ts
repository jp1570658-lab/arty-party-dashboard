import { PrismaClient } from "@prisma/client";
import { DEFAULT_ACTIVITIES } from "../src/lib/activities";

const prisma = new PrismaClient();

async function main() {
  // 1. Seed the 8 default activities
  for (const a of DEFAULT_ACTIVITIES) {
    await prisma.activity.upsert({
      where: { name: a.name },
      update: { icon: a.icon, color: a.color, defaultTeam: a.defaultTeam },
      create: {
        name: a.name,
        icon: a.icon,
        color: a.color,
        defaultTeam: a.defaultTeam,
        defaultMaterials: a.defaultMaterials,
      },
    });
  }
  console.log(`Seeded ${DEFAULT_ACTIVITIES.length} activities`);

  // 2. Sample completed event — gives the AI something to learn from
  const existing = await prisma.event.findFirst({
    where: { name: "Arty-Party Vol. 1" },
  });
  if (existing) {
    console.log("Sample event already exists — skipping");
    return;
  }

  const date = new Date();
  date.setMonth(date.getMonth() - 2);
  const buildUp = new Date(date);
  buildUp.setHours(16, 0, 0, 0);

  const painting = await prisma.activity.findUnique({ where: { name: "Live Painting" } });
  const poetry = await prisma.activity.findUnique({ where: { name: "Poetry" } });
  const dj = await prisma.activity.findUnique({ where: { name: "DJ Set" } });

  const event = await prisma.event.create({
    data: {
      name: "Arty-Party Vol. 1",
      date,
      buildUpTime: buildUp,
      location: "De Studio, Amsterdam",
      venueNotes: "Loading dock at the back, power on the left wall.",
      theme: "Spring Awakening",
      themeNotes: "Warm low lighting, plants everywhere, jazz between sets.",
      status: "COMPLETED",
      capacity: 120,
      actualAttendees: 108,
      activities: {
        create: [painting, poetry, dj]
          .filter(Boolean)
          .map((a) => ({
            activityId: a!.id,
            materials: {
              create: (a!.defaultMaterials as string[]).slice(0, 4).map((name, i) => ({
                name,
                checked: i % 2 === 0,
              })),
            },
          })),
      },
      teamMembers: {
        create: [
          { role: "Producer", teamType: "PLANNING", status: "confirmed", teamMember: { create: { name: "JP", role: "Producer", email: "jp@arty-party.test" } } },
          { role: "Sound engineer", teamType: "BUILD_BREAKDOWN", status: "confirmed", teamMember: { create: { name: "Sam", role: "Sound" } } },
          { role: "Photographer", teamType: "MEDIA", status: "confirmed", teamMember: { create: { name: "Lena", role: "Photographer" } } },
        ],
      },
      logistics: {
        create: [
          { time: new Date(buildUp), task: "Crew arrives at venue", owner: "Build team", done: true },
          { time: new Date(buildUp.getTime() + 30 * 60000), task: "Sound system setup", owner: "Sam", done: true },
          { time: new Date(buildUp.getTime() + 150 * 60000), task: "Doors open", owner: "Front of house", done: true },
        ],
      },
      runOfShow: {
        create: [
          { time: new Date(date.getTime()), item: "Doors & welcome", duration: 30, order: 0 },
          { time: new Date(date.getTime() + 45 * 60000), item: "Poetry set", duration: 30, owner: "MC", order: 1 },
          { time: new Date(date.getTime() + 120 * 60000), item: "DJ set", duration: 90, owner: "DJ", order: 2 },
        ],
      },
      budget: {
        create: {
          items: {
            create: [
              { category: "Venue", name: "Hall rental", estimated: 400, actual: 420, paid: true },
              { category: "Artists/Performers", name: "Poets + DJ fees", estimated: 300, actual: 300, paid: true },
              { category: "Printing", name: "Posters + flyers", estimated: 90, actual: 75, paid: true },
              { category: "Catering", name: "Drinks", estimated: 150, actual: 180, paid: true },
            ],
          },
        },
      },
      marketingPlan: {
        create: {
          posterLocations: ["Café De Jaren", "Local library"],
          flyerLocations: ["Pijp Market, Saturday"],
          instagramFeedPlan: "3 teaser posts in the two weeks before.",
          tiktokPlan: "Behind-the-scenes of the live painting setup.",
        },
      },
      postAnalysis: {
        create: {
          overallRating: 4,
          totalAttendees: 108,
          whatWentWell: "Strong turnout, the poetry set was a highlight and the room felt warm and intimate.",
          whatWentWrong: "Doors opened 20 minutes late and the bar queue got long early on.",
          improvements: "Open doors on time and add a second drinks station near the entrance.",
          couldBeBetter: "More seating during the poetry set.",
          audienceFeedback: "Loved the atmosphere; several asked when the next one is.",
          teamFeedback: "Build-up was smooth; breakdown ran late.",
        },
      },
    },
  });

  console.log(`Created sample event: ${event.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
