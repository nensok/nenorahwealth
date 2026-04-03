export interface DefaultCategory {
  name: string;
  color: string;
  icon: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: "Food", color: "#F97316", icon: "restaurant" },
  { name: "Transport", color: "#3B82F6", icon: "directions-car" },
  { name: "Rent", color: "#8B5CF6", icon: "home" },
  { name: "Data", color: "#06B6D4", icon: "wifi" },
  { name: "Family", color: "#EC4899", icon: "group" },
  { name: "Gift", color: "#10B981", icon: "volunteer-activism" },
];
