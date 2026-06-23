import {
  Brush,
  Mic,
  Music,
  Headphones,
  Building2,
  Circle,
  Piano,
  Camera,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Brush,
  Mic,
  Music,
  Headphones,
  Building2,
  Circle,
  Piano,
  Camera,
};

export function activityIcon(name: string): LucideIcon {
  return ICONS[name] ?? Sparkles;
}
