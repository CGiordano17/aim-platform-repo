import type { DimensionScores, Question } from "@/lib/types";

// Ported from prototype/App.jsx's scoring engine (PRD §2.2) — same algorithm,
// now called from a server action instead of client-side, and the text
// scoring call moved server-side (see src/lib/anthropic.ts) per PRD §6.2.

export const avg = (arr: number[]) => (arr && arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
export const round1 = (n: number) => Math.round(n * 10) / 10;
export const round2 = (n: number) => Math.round(n * 100) / 100;

// Resolves a question's free-text dimension label to a stable scoring bucket
// by keyword match rather than exact string equality — renaming a dimension
// doesn't silently break scoring, and a genuinely new dimension becomes a
// visible custom:* bucket instead of being dropped.
export function canonicalDimensionKey(dimensionText: string): string {
  const norm = (dimensionText || "").toLowerCase();
  if (norm.includes("trust")) return "trust";
  if (norm.includes("willing")) return "willingness";
  if (norm.includes("tech")) return "prepTech";
  if (norm.includes("foundation")) return "prepFoundations";
  if (norm.includes("workflow") || norm.includes("work flow")) return "prepWorkflow";
  const slug = norm.trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "unmapped";
  return `custom:${slug}`;
}

export function defaultOptionScores(options: string[]): number[] {
  const n = options.length;
  if (n <= 1) return options.map(() => 3);
  return options.map((_, i) => round1(1 + (4 * i) / (n - 1)));
}

export type Answers = Record<string, string | number>;

// scoreTextAnswer is injected (server-side Claude call, src/lib/anthropic.ts)
// so this function has no direct network dependency and stays easy to test.
export async function computeScoresFromAnswers(
  answers: Answers,
  questions: Question[],
  scoreTextAnswer: (question: Question, answerText: string) => Promise<number>
): Promise<DimensionScores> {
  const buckets: Record<string, number[]> = {};

  for (const q of questions) {
    const val = answers[q.id];
    if (val == null || val === "") continue;
    let numeric: number | null = null;

    if (q.type === "likert") {
      numeric = Number(val);
    } else if (q.type === "multiple_choice") {
      const idx = (q.options || []).indexOf(String(val));
      const scores = q.optionScores && q.optionScores.length === (q.options || []).length ? q.optionScores : defaultOptionScores(q.options || []);
      numeric = idx >= 0 ? scores[idx] : null;
    } else if (q.type === "text") {
      numeric = await scoreTextAnswer(q, String(val));
    }

    if (numeric == null || Number.isNaN(numeric)) continue;
    const key = canonicalDimensionKey(q.dimension);
    (buckets[key] = buckets[key] || []).push(numeric);
  }

  const trust = avg(buckets.trust ?? []);
  const willingness = avg(buckets.willingness ?? []);
  const prepFoundations = avg(buckets.prepFoundations ?? []);
  const prepWorkflow = avg(buckets.prepWorkflow ?? []);
  const prepTech = buckets.prepTech ? avg(buckets.prepTech) : avg([prepFoundations, prepWorkflow].filter((v) => v > 0));

  const customKeys = Object.keys(buckets).filter((k) => k.startsWith("custom:"));
  const custom: Record<string, number> = {};
  customKeys.forEach((k) => {
    custom[k.slice(7)] = round1(avg(buckets[k]));
  });

  const allDimValues = [trust, willingness, prepFoundations, prepWorkflow, prepTech, ...customKeys.map((k) => avg(buckets[k]))].filter((v) => v > 0);
  const overall = round2(avg(allDimValues));

  return {
    trust: round1(trust),
    willingness: round1(willingness),
    prepFoundations: round1(prepFoundations),
    prepWorkflow: round1(prepWorkflow),
    prepTech: round1(prepTech),
    overall,
    custom,
  };
}

export type Segment = "innovator" | "early_adopter" | "early_majority" | "late_majority" | "laggard";
export type Pathway = "enabled" | "augmented" | "superpowered";

export function scoreToSegment(overall: number): Segment {
  if (overall >= 4.3) return "innovator";
  if (overall >= 3.7) return "early_adopter";
  if (overall >= 3.0) return "early_majority";
  if (overall >= 2.3) return "late_majority";
  return "laggard";
}

export function scoreToPathway(trust: number, prep: number, willingness: number): Pathway {
  if (trust >= 4.1 && prep >= 4.0 && willingness >= 4.1) return "superpowered";
  if (trust >= 3.1 && prep >= 2.6 && willingness >= 3.1) return "augmented";
  return "enabled";
}

// PRD §2.2 — standard Rogers percentages and this platform's score ranges.
export const SEGMENT_META: Record<Segment, { label: string; color: string; pct: number; x: number }> = {
  innovator: { label: "Innovators", color: "#EAF6F8", pct: 2.5, x: 90 },
  early_adopter: { label: "Early Adopters", color: "#5EE6FF", pct: 13.5, x: 72 },
  early_majority: { label: "Early Majority", color: "#7FE0A0", pct: 34, x: 50 },
  late_majority: { label: "Late Majority", color: "#F0A94E", pct: 34, x: 28 },
  laggard: { label: "Laggards", color: "#F08FB0", pct: 16, x: 10 },
};

export const PATHWAY_META: Record<Pathway, { label: string; color: string; desc: string; trust: string; prep: string; willingness: string; curveRange: string }> = {
  enabled: { label: "AI Enabled", color: "#F08FB0", desc: "Foundational training with high structure and support", trust: "≤ 3.0", prep: "≤ 2.5", willingness: "≤ 3.0", curveRange: "Late Majority + Laggards" },
  augmented: { label: "AI Augmented", color: "#5EE6FF", desc: "Mid-level enablement focused on workflows and daily tasks", trust: "3.1 – 4.0", prep: "2.6 – 3.9", willingness: "3.1 – 4.0", curveRange: "Early Majority + Early Adopters" },
  superpowered: { label: "AI Superpowered", color: "#7FE0A0", desc: "Advanced enablement for strategic application and innovation", trust: "≥ 4.1", prep: "≥ 4.0", willingness: "≥ 4.1", curveRange: "Innovators + Early Adopters" },
};

export const SEGMENT_THRESHOLDS: { seg: Segment; range: string; pathway: Pathway }[] = [
  { seg: "innovator", range: "4.3 – 5.0", pathway: "superpowered" },
  { seg: "early_adopter", range: "3.7 – 4.2", pathway: "superpowered" },
  { seg: "early_majority", range: "3.0 – 3.6", pathway: "augmented" },
  { seg: "late_majority", range: "2.3 – 2.9", pathway: "enabled" },
  { seg: "laggard", range: "1.0 – 2.2", pathway: "enabled" },
];
