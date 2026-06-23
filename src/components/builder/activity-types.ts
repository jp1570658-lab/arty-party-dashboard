export interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  checked: boolean;
}

export interface ActivityRef {
  id: string;
  name: string;
  icon: string;
  color: string;
  defaultTeam: string | null;
}

export interface EventActivityItem {
  id: string;
  activityId: string;
  notes: string | null;
  activity: ActivityRef;
  materials: MaterialItem[];
}
