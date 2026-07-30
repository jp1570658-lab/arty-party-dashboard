"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_NAV_ITEMS } from "./nav";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 flex border-t bg-surface-0 md:hidden">
      {MOBILE_NAV_ITEMS.map((item) => {
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
              // 5 items have to fit a 375px screen — keep labels from wrapping.
              "flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2.5 text-[10px] font-medium transition-colors",
              active ? "text-brand-purple" : "text-ink-muted"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
