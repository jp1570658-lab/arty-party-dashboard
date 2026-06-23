"use client";

import { useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import { ArtistCard, type ArtistCardData } from "./ArtistCard";
import { ArtistForm } from "./ArtistForm";
import { Button, EmptyState } from "@/components/ui/primitives";
import { ARTIST_CATEGORY_LABELS, type ArtistCategory } from "@/lib/enums";
import { cn } from "@/lib/utils";

export function ArtistsClient({ artists }: { artists: ArtistCardData[] }) {
  const [filter, setFilter] = useState<string>("ALL");
  const [formOpen, setFormOpen] = useState(false);

  const categories = useMemo(() => {
    const present = Array.from(new Set(artists.map((a) => a.category)));
    return present;
  }, [artists]);

  const filtered =
    filter === "ALL" ? artists : artists.filter((a) => a.category === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-primary">Artists</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Your CRM across every Arty-Party — who performed, what they needed.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Add artist
        </Button>
      </div>

      {artists.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No artists yet"
          description="Add poets, painters, DJs, photographers and more to build your roster."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Add your first artist
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {["ALL", ...categories].map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  filter === c
                    ? "bg-brand-purple text-white"
                    : "bg-surface-2 text-ink-secondary hover:bg-surface-0"
                )}
              >
                {c === "ALL" ? "All" : ARTIST_CATEGORY_LABELS[c as ArtistCategory]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a, i) => (
              <ArtistCard key={a.id} artist={a} index={i} />
            ))}
          </div>
        </>
      )}

      <ArtistForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
