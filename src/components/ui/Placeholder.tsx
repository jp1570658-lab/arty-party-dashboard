"use client";

import { Construction } from "lucide-react";
import { EmptyState } from "@/components/ui/primitives";

export function Placeholder({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-ink-primary">{title}</h1>
      <EmptyState
        icon={Construction}
        title={`${title} coming soon`}
        description={`This section is built in ${phase}.`}
      />
    </div>
  );
}
