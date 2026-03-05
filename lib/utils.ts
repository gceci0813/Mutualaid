import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DisciplineType } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatSalary(
  min?: number,
  max?: number,
  type: "hourly" | "annual" = "annual"
): string {
  const fmt = (n: number) =>
    type === "annual"
      ? `$${(n / 1000).toFixed(0)}k`
      : `$${n.toFixed(2)}/hr`;

  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  if (max) return `Up to ${fmt(max)}`;
  return "Salary not listed";
}

export const DISCIPLINE_LABELS: Record<DisciplineType, string> = {
  police:      "Law Enforcement",
  fire:        "Fire Department",
  ems:         "EMS / Ambulance",
  dispatch:    "Dispatch / 911",
  dpw:         "Public Works",
  fbi:         "FBI",
  dhs:         "DHS / Homeland Security",
  corrections: "Corrections",
  other:       "Other",
};

export const DISCIPLINE_COLORS: Record<DisciplineType, string> = {
  police:      "bg-blue-100 text-blue-800",
  fire:        "bg-red-100 text-red-800",
  ems:         "bg-orange-100 text-orange-800",
  dispatch:    "bg-yellow-100 text-yellow-800",
  dpw:         "bg-green-100 text-green-800",
  fbi:         "bg-slate-100 text-slate-800",
  dhs:         "bg-purple-100 text-purple-800",
  corrections: "bg-zinc-100 text-zinc-800",
  other:       "bg-gray-100 text-gray-700",
};

export const US_STATES = [
  { name: "Alabama", abbr: "AL" }, { name: "Alaska", abbr: "AK" },
  { name: "Arizona", abbr: "AZ" }, { name: "Arkansas", abbr: "AR" },
  { name: "California", abbr: "CA" }, { name: "Colorado", abbr: "CO" },
  { name: "Connecticut", abbr: "CT" }, { name: "Delaware", abbr: "DE" },
  { name: "Florida", abbr: "FL" }, { name: "Georgia", abbr: "GA" },
  { name: "Hawaii", abbr: "HI" }, { name: "Idaho", abbr: "ID" },
  { name: "Illinois", abbr: "IL" }, { name: "Indiana", abbr: "IN" },
  { name: "Iowa", abbr: "IA" }, { name: "Kansas", abbr: "KS" },
  { name: "Kentucky", abbr: "KY" }, { name: "Louisiana", abbr: "LA" },
  { name: "Maine", abbr: "ME" }, { name: "Maryland", abbr: "MD" },
  { name: "Massachusetts", abbr: "MA" }, { name: "Michigan", abbr: "MI" },
  { name: "Minnesota", abbr: "MN" }, { name: "Mississippi", abbr: "MS" },
  { name: "Missouri", abbr: "MO" }, { name: "Montana", abbr: "MT" },
  { name: "Nebraska", abbr: "NE" }, { name: "Nevada", abbr: "NV" },
  { name: "New Hampshire", abbr: "NH" }, { name: "New Jersey", abbr: "NJ" },
  { name: "New Mexico", abbr: "NM" }, { name: "New York", abbr: "NY" },
  { name: "North Carolina", abbr: "NC" }, { name: "North Dakota", abbr: "ND" },
  { name: "Ohio", abbr: "OH" }, { name: "Oklahoma", abbr: "OK" },
  { name: "Oregon", abbr: "OR" }, { name: "Pennsylvania", abbr: "PA" },
  { name: "Rhode Island", abbr: "RI" }, { name: "South Carolina", abbr: "SC" },
  { name: "South Dakota", abbr: "SD" }, { name: "Tennessee", abbr: "TN" },
  { name: "Texas", abbr: "TX" }, { name: "Utah", abbr: "UT" },
  { name: "Vermont", abbr: "VT" }, { name: "Virginia", abbr: "VA" },
  { name: "Washington", abbr: "WA" }, { name: "West Virginia", abbr: "WV" },
  { name: "Wisconsin", abbr: "WI" }, { name: "Wyoming", abbr: "WY" },
  { name: "District of Columbia", abbr: "DC" },
];

export function starLabel(rating: number): string {
  if (rating >= 4.5) return "Excellent";
  if (rating >= 3.5) return "Good";
  if (rating >= 2.5) return "Fair";
  if (rating >= 1.5) return "Poor";
  return "Terrible";
}
