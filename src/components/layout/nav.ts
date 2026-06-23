import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UserCheck,
  Handshake,
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
  { label: "Artists", href: "/artists", icon: Users },
  { label: "Guests", href: "/guests", icon: UserCheck },
  { label: "Partners", href: "/partners", icon: Handshake },
  { label: "Reports", href: "/reports", icon: FileText },
];

// Items shown in the compact mobile bottom bar
export const MOBILE_NAV_ITEMS: NavItem[] = NAV_ITEMS.filter((i) =>
  ["/", "/events", "/artists", "/partners"].includes(i.href)
);
