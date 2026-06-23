"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { NAV_ITEMS } from "./nav";
import { useUIStore } from "@/store/ui";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const activeEvent = useUIStore((s) => s.activeEvent);

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 border-r bg-surface-0">
      <div className="flex h-16 items-center gap-2 px-5 border-b">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-purple text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-ink-primary">Arty-Party</div>
          <div className="text-[11px] text-ink-muted">Event Planner</div>
        </div>
      </div>

      {activeEvent && (
        <div className="px-3 pt-3">
          <Link
            href={`/events/${activeEvent.id}`}
            className="block rounded-lg border border-brand-purple bg-brand-purple-light px-3 py-2"
          >
            <div className="text-[10px] font-semibold uppercase tracking-widest text-brand-purple">
              Active event
            </div>
            <div className="truncate text-sm font-medium text-ink-primary">
              {activeEvent.name}
            </div>
          </Link>
        </div>
      )}

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-purple-light text-brand-purple"
                  : "text-ink-secondary hover:bg-surface-2 hover:text-ink-primary"
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 text-[11px] text-ink-muted border-t">
        Built for JP · v1.0
      </div>
    </aside>
  );
}
