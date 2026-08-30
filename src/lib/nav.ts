import type { AppRole } from "@/lib/types";

// Mirrors PRD §3's nav table and prototype/App.jsx's NAV_ITEMS/TAB_PERMS.
// Keep these three in sync.
export const NAV_ITEMS: { id: string; label: string; href: string }[] = [
  { id: "survey", label: "Take Assessment", href: "/survey" },
  { id: "dashboard", label: "Overview", href: "/dashboard" },
  { id: "assessments", label: "Assessment Builder", href: "/assessments" },
  { id: "builder", label: "Scoring Engine", href: "/scoring-engine" },
  { id: "reports", label: "Reports", href: "/reports" },
  { id: "nudges", label: "Nudges", href: "/nudges" },
  { id: "goals", label: "Transformation Goals", href: "/goals" },
  { id: "teams", label: "Teams", href: "/teams" },
  { id: "config", label: "Config", href: "/config" },
];

export const TAB_PERMS: Record<string, AppRole[]> = {
  survey: ["superadmin", "hradmin", "manager", "viewer"],
  dashboard: ["superadmin", "hradmin", "manager", "viewer"],
  assessments: ["superadmin", "hradmin"],
  builder: ["superadmin", "hradmin", "manager"],
  reports: ["superadmin", "hradmin", "manager", "viewer"],
  nudges: ["superadmin", "hradmin"],
  // "All roles" per PRD §3. Edit-rights-within-the-tab is an open decision
  // (PRD §7) — not resolved here; RLS currently allows any authenticated
  // role to update a goal's currentValue, same as the prototype.
  goals: ["superadmin", "hradmin", "manager", "viewer"],
  teams: ["superadmin", "hradmin"],
  config: ["superadmin"],
};
