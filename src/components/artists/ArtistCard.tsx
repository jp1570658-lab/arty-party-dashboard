"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarDays, Music2 } from "lucide-react";
import { ARTIST_CATEGORY_LABELS, type ArtistCategory } from "@/lib/enums";
import { formatDate } from "@/lib/utils";

export interface ArtistCardData {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  eventCount: number;
  lastEvent: string | null;
}

export function ArtistCard({ artist, index = 0 }: { artist: ArtistCardData; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Link href={`/artists/${artist.id}`}>
        <div className="card flex h-full flex-col gap-3 transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-purple-light text-brand-purple">
              <Music2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-ink-primary">{artist.name}</h3>
              <p className="text-xs text-ink-secondary">
                {ARTIST_CATEGORY_LABELS[artist.category as ArtistCategory]}
                {artist.subcategory ? ` · ${artist.subcategory}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>
              {artist.eventCount} event{artist.eventCount === 1 ? "" : "s"}
            </span>
            {artist.lastEvent && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {formatDate(artist.lastEvent)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
