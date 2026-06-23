"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, Sparkles, ChevronRight } from "lucide-react";
import { useUIStore } from "@/store/ui";

const SEGMENT_LABELS: Record<string, string> = {
  events: "Events",
  artists: "Artists",
  guests: "Guests",
  partners: "Partners",
  reports: "Reports",
  new: "New",
  report: "Report",
  "run-of-show": "Run of Show",
};

export function Header() {
  const pathname = usePathname();
  const darkMode = useUIStore((s) => s.darkMode);
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode);
  const activeEvent = useUIStore((s) => s.activeEvent);
  const setAiOpen = useUIStore((s) => s.setAiOpen);

  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    let label = SEGMENT_LABELS[seg] ?? seg;
    // Replace event/artist id segments with friendly names where possible
    if (i > 0 && segments[i - 1] === "events" && activeEvent?.id === seg) {
      label = activeEvent.name;
    } else if (seg.length > 16) {
      label = "Details";
    }
    return { href, label };
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-surface-0/80 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-1.5 text-sm">
        <Link href="/" className="text-ink-muted hover:text-ink-primary">
          Home
        </Link>
        {crumbs.map((c) => (
          <span key={c.href} className="flex min-w-0 items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
            <Link
              href={c.href}
              className="truncate text-ink-secondary hover:text-ink-primary"
            >
              {c.label}
            </Link>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setAiOpen(true)}
          className="btn-primary px-3 py-1.5"
          title="AI assistant"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Assistant</span>
        </button>
        <button
          onClick={toggleDarkMode}
          className="btn-ghost px-2 py-2"
          title="Toggle dark mode"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
