import type { GoalCategory, GoalMaturity } from "@/lib/types";

// Dark HUD tokens (PRD §5) as raw hex, since Tailwind's arbitrary-color
// utilities can't reference theme tokens dynamically per-row the way these
// meta tables are consumed (border-left color keyed by tier, etc).
const HUD = {
  cyan: "#5EE6FF",
  amber: "#F0A94E",
  green: "#7FE0A0",
  violet: "#C79EF0",
  rose: "#F08FB0",
  sub: "#9FB6BC",
  muted: "#6E8790",
};

export const GOAL_CATEGORY_META: Record<GoalCategory, { name: string; owner: string; color: string }> = {
  productivity: { name: "Productivity & Efficiency", owner: "COO · CHRO · Operations", color: HUD.cyan },
  quality: { name: "Quality & Risk", owner: "Functional leads · GC · CISO", color: HUD.violet },
  revenue: { name: "Revenue & Impact", owner: "CEO · CRO · CCO", color: HUD.amber },
  capability: { name: "Workforce Capability", owner: "CLO · CHRO", color: HUD.rose },
};

export const GOAL_TIER_META: { name: string; sub: string; color: string }[] = [
  { name: "Self-reported", sub: "Nudge / Assessment", color: HUD.amber },
  { name: "Manual tagging", sub: "Human flags it / expert review", color: HUD.sub },
  { name: "Native vendor reporting", sub: "Admin console you already have", color: HUD.cyan },
  { name: "Deep system integration", sub: "API telemetry / cross-system model", color: HUD.violet },
];

export const GOAL_MATURITY_META: Record<GoalMaturity, string> = {
  literate: "Literate",
  applied: "Applied",
  operational: "Operational",
  transformational: "Transformational",
};
