import type { PrismaClient } from "@prisma/client";

export interface DefaultActivity {
  name: string;
  icon: string; // Lucide icon name
  color: string;
  defaultMaterials: string[];
  defaultTeam: string;
}

export const DEFAULT_ACTIVITIES: DefaultActivity[] = [
  {
    name: "Live Painting",
    icon: "Brush",
    color: "#7C3AED",
    defaultMaterials: [
      "Artist supervisor confirmed",
      "Canvas (x6)",
      "Easels",
      "Floor plastic sheeting",
      "Paint brushes (mixed sizes)",
      "Water cups",
      "Napkins/cloths",
      "Aprons (x8)",
      "Paint sets",
    ],
    defaultTeam: "Supervising artist + 1 assistant",
  },
  {
    name: "Poetry",
    icon: "Mic",
    color: "#D4537E",
    defaultMaterials: [
      "Poets confirmed (min 3)",
      "Microphone",
      "Mic stand",
      "Stool (optional)",
      "MC confirmed",
    ],
    defaultTeam: "MC + sound operator",
  },
  {
    name: "Performance",
    icon: "Music",
    color: "#D85A30",
    defaultMaterials: [
      "Artist confirmed",
      "Microphone",
      "Sound system",
      "Monitor speaker",
      "Setlist agreed",
      "Soundcheck scheduled",
    ],
    defaultTeam: "Performing artist + sound engineer",
  },
  {
    name: "DJ Set",
    icon: "Headphones",
    color: "#059669",
    defaultMaterials: [
      "DJ confirmed",
      "DJ equipment or venue confirms theirs",
      "Playlist brief sent",
      "Set time agreed",
    ],
    defaultTeam: "DJ",
  },
  {
    name: "Exhibition",
    icon: "Building2",
    color: "#1D4ED8",
    defaultMaterials: [
      "Curator briefed",
      "Wall space measured",
      "Artwork pickup scheduled",
      "Labels/descriptions printed",
      "Lighting checked",
      "Hanging hardware",
    ],
    defaultTeam: "Curator + 2 setup crew",
  },
  {
    name: "Pottery",
    icon: "Circle",
    color: "#B45309",
    defaultMaterials: [
      "Potter confirmed",
      "Clay (min 3kg)",
      "Hand tools or wheel confirmed",
      "Water bucket",
      "Floor covering",
      "Towels (x6)",
    ],
    defaultTeam: "Potter + assistant",
  },
  {
    name: "Instrumentalist",
    icon: "Piano",
    color: "#7C3AED",
    defaultMaterials: [
      "Instrument confirmed (artist brings or venue provides)",
      "Mic or DI box if needed",
      "Music stand",
      "Soundcheck scheduled",
    ],
    defaultTeam: "Artist + sound operator",
  },
  {
    name: "Photo / Video",
    icon: "Camera",
    color: "#374151",
    defaultMaterials: [
      "Photographer confirmed",
      "Videographer confirmed",
      "Shot list created and shared",
      "Interview space identified",
      "Memory cards / storage confirmed",
    ],
    defaultTeam: "Photographer + videographer",
  },
];

let seeded = false;

/** Idempotently ensure the 8 default activities exist. */
export async function ensureDefaultActivities(prisma: PrismaClient) {
  if (seeded) return;
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
  seeded = true;
}
