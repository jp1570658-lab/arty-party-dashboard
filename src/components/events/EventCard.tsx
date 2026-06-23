"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Calendar, Users } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { formatDate } from "@/lib/utils";

export interface EventCardData {
  id: string;
  name: string;
  date: string;
  location: string;
  status: string;
  capacity?: number | null;
  progress: number;
}

export function EventCard({ event, index = 0 }: { event: EventCardData; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link href={`/events/${event.id}`}>
        <div className="card flex h-full flex-col gap-4 transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-ink-primary">
                {event.name}
              </h3>
              <div className="mt-1">
                <StatusBadge status={event.status} />
              </div>
            </div>
            <ProgressRing value={event.progress} />
          </div>

          <div className="space-y-1.5 text-sm text-ink-secondary">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-ink-muted" />
              {formatDate(event.date)}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-ink-muted" />
              <span className="truncate">{event.location}</span>
            </div>
            {event.capacity ? (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-ink-muted" />
                Capacity {event.capacity}
              </div>
            ) : null}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
