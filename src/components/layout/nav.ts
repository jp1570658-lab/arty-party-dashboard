import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  Users,
  UserCheck,
  Handshake,
  Radar,
  FileText,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: LayoutDashboard },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Calendar", href: "/calendar", icon: CalendarRange },
  { label: "Artists", href: "/artists", icon: Users },
  { label: "Guests", href: "/guests", icon: UserCheck },
  { label: "Partners", href: "/partners", icon: Handshake },
  { label: "Community", href: "/community", icon: Radar },
  { label: "Reports", href: "/reports", icon: FileText },
];

// Items shown in the compact mobile bottom bar. Anything omitted here has no
// mobile entry point at all, so this covers the day-to-day destinations;
// Guests, Partners and Reports are reached from within the pages that link them.
export const MOBILE_NAV_ITEMS: NavItem[] = NAV_ITEMS.filter((i) =>
  ["/", "/events", "/calendar", "/artists", "/community"].includes(i.href)
);
