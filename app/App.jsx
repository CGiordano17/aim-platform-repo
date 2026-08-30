import { useState, useEffect, useCallback } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg: "#F8F7F4",
  surface: "#FFFFFF",
  border: "#E8E6E1",
  borderStrong: "#D4D0C8",
  text: "#1A1814",
  textSub: "#6B6760",
  textMuted: "#9B9690",
  accent: "#1A1814",
  accentWarm: "#C4873A",
  accentCool: "#3A6BC4",
  accentGreen: "#2D8A5E",
  accentRed: "#C43A3A",
  innovators: "#1A1814",
  earlyAdopters: "#3A6BC4",
  earlyMajority: "#2D8A5E",
  lateMajority: "#C4873A",
  laggards: "#C43A3A",
};

// ─── STORAGE ───────────────────────────────────────────────────────────────────
// Everything lives under a few shared keys so every logged-in person sees the
// same organization data (this is a prototype: no real backend, so "shared" is
// simulated via the artifact key-value store).
const RESPONDENTS_KEY = "aim-respondents-v1";
const QUESTIONS_KEY = "aim-questions-v1";
const USERS_KEY = "aim-users-v1";

async function loadKey(key, seed) {
  try {
    const res = await window.storage.get(key, true);
    if (res && res.value) return JSON.parse(res.value);
  } catch (e) {
    // not found yet — fall through to seeding
  }
  try {
    await window.storage.set(key, JSON.stringify(seed), true);
  } catch (e) {
    console.error(`Failed to seed ${key}`, e);
  }
  return seed;
}

async function saveKey(key, value) {
  try {
    const result = await window.storage.set(key, JSON.stringify(value), true);
    if (!result) console.error(`Save returned no result for ${key}`);
  } catch (e) {
    console.error(`Failed to save ${key}`, e);
    throw e;
  }
}

// ─── SEED DATA ──────────────────────────────────────────────────────────────────
const AIM_QUESTIONS_SEED = [
  { id: "q1", code: "AIMT01", dimension: "Trust", text: "I believe that AI can enhance productivity and decision-making in my professional role.", type: "likert", phase: "both", required: true },
  { id: "q2", code: "AIMT02", dimension: "Trust", text: "AI-driven outputs can meet or exceed the quality standards expected in my organization.", type: "likert", phase: "both", required: true },
  { id: "q3", code: "AIMT03", dimension: "Trust", text: "I trust AI to provide factual and accurate information.", type: "likert", phase: "both", required: true },
  { id: "q4", code: "AIMT04", dimension: "Trust", text: "I believe that AI systems can make decisions and provide written information that is impartial, without bias, towards any group.", type: "likert", phase: "both", required: true },
  { id: "q5", code: "AIMT05", dimension: "Trust", text: "I trust that AI technologies can be designed to consistently perform as intended with minimal errors.", type: "likert", phase: "both", required: true },
  { id: "q6", code: "AIMT06", dimension: "Trust", text: "I believe AI is, or can be designed to, consider diverse perspectives and needs in its decision-making or written information.", type: "likert", phase: "both", required: true },
  { id: "q7", code: "AIMT07", dimension: "Trust", text: "I trust that AI systems are, or can be designed to be, secure and protect sensitive information.", type: "likert", phase: "both", required: true },
  { id: "q8", code: "AIMT08", dimension: "Trust", text: "I believe that AI systems are, or may be designed to be, forthcoming with the sources of information they are using.", type: "likert", phase: "both", required: true },
  { id: "q9", code: "AIMT09", dimension: "Trust", text: "I believe it is possible to create accountability measures around AI systems.", type: "likert", phase: "both", required: true },
  { id: "q10", code: "AIMW01", dimension: "Willingness", text: "I actively seek, consider, or envision ways to integrate AI into my work.", type: "likert", phase: "both", required: true },
  { id: "q11", code: "AIMW02", dimension: "Willingness", text: "If an AI tool was made available to me by my employer, I would try to use it immediately.", type: "likert", phase: "both", required: true },
  { id: "q12", code: "AIMW03", dimension: "Willingness", text: "Seeing and hearing about others using AI around me, including at my place of employment, increases my willingness to try it.", type: "likert", phase: "both", required: true },
  { id: "q13", code: "AIMW04", dimension: "Willingness", text: "I believe the skills required to use AI are, or will soon be, critical for my career growth, performance, or stability.", type: "likert", phase: "both", required: true },
  { id: "q14", code: "AIMW05", dimension: "Willingness", text: "I would only use AI in my profession if there was an expectation from my employer.", type: "likert", phase: "both", required: true },
  { id: "q15", code: "AIMW06", dimension: "Willingness", text: "Actively using or progressing AI adoption within my organization will lead to efficiencies within my organization.", type: "likert", phase: "both", required: true },
  { id: "q16", code: "AIMPF01", dimension: "Prep — Foundations", text: "I can describe the capabilities of AI technologies today and how they can augment or replace the tasks or work that a human would otherwise perform.", type: "likert", phase: "both", required: true },
  { id: "q17", code: "AIMPF02", dimension: "Prep — Foundations", text: "I can identify valuable tasks or use cases for AI assistance within my day-to-day workflow.", type: "likert", phase: "both", required: true },
  { id: "q18", code: "AIMPF03", dimension: "Prep — Foundations", text: "I can select the best AI tool or model for a particular task when multiple tools or versions are available.", type: "likert", phase: "both", required: true },
  { id: "q19", code: "AIMPF04", dimension: "Prep — Foundations", text: "I can effectively write and chain multi-step, structured prompts to achieve complex, layered outputs thus meeting my personal and professional standards for use.", type: "likert", phase: "both", required: true },
  { id: "q20", code: "AIMPF05", dimension: "Prep — Foundations", text: "I can provide an AI system or tool with the appropriate context to understand my needs comprehensively and therefore generate acceptable outputs earlier.", type: "likert", phase: "both", required: true },
  { id: "q21", code: "AIMPF06", dimension: "Prep — Foundations", text: "I can evaluate AI-generated outputs for accuracy and trustworthiness before applying within my work.", type: "likert", phase: "both", required: true },
  { id: "q22", code: "AIMPF07E", dimension: "Prep — Foundations", text: "I can protect personal, employer, and client confidentiality of my information when using AI.", type: "likert", phase: "both", required: true },
  { id: "q23", code: "AIMPF08E", dimension: "Prep — Foundations", text: "I can detect bias within an AI output before applying this in a personal or professional setting.", type: "likert", phase: "both", required: true },
  { id: "q24", code: "AIMPF09", dimension: "Prep — Foundations", text: "I can maintain the intellectual property of others when using AI in a personal or professional setting.", type: "likert", phase: "both", required: true },
  { id: "q25", code: "AIMPF10", dimension: "Prep — Foundations", text: "I can use AI to generate original content (such as code, images, presentations) that achieves my personal or professional standards.", type: "likert", phase: "both", required: true },
  { id: "q26", code: "AIMPF11", dimension: "Prep — Foundations", text: "I can use AI to reduce the time I spend on routine or administrative tasks.", type: "likert", phase: "both", required: true },
  { id: "q27", code: "AIMPF12", dimension: "Prep — Foundations", text: "I can use AI to improve the quality of my work by providing feedback or review.", type: "likert", phase: "both", required: true },
  { id: "q28", code: "AIMPF13", dimension: "Prep — Foundations", text: "I can explain the capabilities of GenAI and how this technology compares to other forms of AI and or Machine Learning.", type: "likert", phase: "both", required: true },
  { id: "q29", code: "AIMPW01", dimension: "Prep — Workflow", text: "I can use AI to complete a singular task that I would have typically completed myself.", type: "likert", phase: "both", required: true },
  { id: "q30", code: "AIMPW02", dimension: "Prep — Workflow", text: "I can design AI workflows to perform several, interconnected tasks, meeting my personal or professional standards.", type: "likert", phase: "both", required: true },
  { id: "q31", code: "AIMPW03", dimension: "Prep — Workflow", text: "I can break down a complex task into smaller steps that AI can assist with.", type: "likert", phase: "both", required: true },
  { id: "q32", code: "AIMPW05", dimension: "Prep — Workflow", text: "I can chain the output from one AI tool as the input to another AI tool without losing context, intent, or meaning.", type: "likert", phase: "both", required: true },
  { id: "q33", code: "AIMPW06", dimension: "Prep — Workflow", text: "I can use AI to synthesize insights from multiple sources or data inputs, and it meets my personal or professional standards.", type: "likert", phase: "both", required: true },
  { id: "q34", code: "AIMPW07", dimension: "Prep — Workflow", text: "I can integrate AI tools into my existing systems or platforms with efficiency.", type: "likert", phase: "both", required: true },
  { id: "q35", code: "AIMPW08E", dimension: "Prep — Workflow", text: "I can proactively identify failure points or risks when integrating AI across multiple steps.", type: "likert", phase: "both", required: true },
  { id: "q36", code: "AIMPC01", dimension: "Prep — Foundations", text: "How often do you currently use an AI tool in a typical work week?", type: "multiple_choice", phase: "both", required: true,
    options: ["Never", "Rarely (a few times a month)", "Sometimes (weekly)", "Often (most days)", "Constantly (multiple times a day)"],
    optionScores: [1, 2, 3, 4, 5] },
  { id: "q37", code: "AIMPW09", dimension: "Prep — Workflow", text: "Describe a specific task you've used AI for recently, and what you had to do to get a usable result.", type: "text", phase: "both", required: true,
    scoringPrompt: "Score this response 1 (low) to 5 (high) on how much genuine hands-on AI workflow experience it demonstrates: does it name a real, specific task, describe concrete steps or iteration, and show understanding of what made the output usable? Vague or generic answers score low; specific, detailed ones score high." },
];

const MOCK_RESPONDENTS_SEED = [
  { id: "r01", name: "Jordan Ellis", department: "Engineering", role: "Senior Engineer", level: "IC",
    preScore: { trust: 4.6, willingness: 4.8, prepFoundations: 4.4, prepWorkflow: 4.2, prepTech: 4.5, overall: 4.5 },
    postScore: { trust: 4.8, willingness: 4.9, prepFoundations: 4.7, prepWorkflow: 4.6, prepTech: 4.8, overall: 4.76 },
    preSegment: "innovator", postSegment: "innovator", pathway: "superpowered", completedPre: true, completedPost: true },
  { id: "r02", name: "Maya Patel", department: "Sales", role: "Account Executive", level: "IC",
    preScore: { trust: 4.1, willingness: 4.3, prepFoundations: 3.8, prepWorkflow: 3.6, prepTech: 3.2, overall: 3.8 },
    postScore: { trust: 4.5, willingness: 4.6, prepFoundations: 4.2, prepWorkflow: 4.0, prepTech: 3.7, overall: 4.2 },
    preSegment: "early_adopter", postSegment: "innovator", pathway: "augmented", completedPre: true, completedPost: true },
  { id: "r03", name: "Chris Wong", department: "Marketing", role: "Marketing Manager", level: "Manager",
    preScore: { trust: 3.5, willingness: 3.8, prepFoundations: 3.2, prepWorkflow: 3.0, prepTech: 2.8, overall: 3.26 },
    postScore: { trust: 3.9, willingness: 4.1, prepFoundations: 3.7, prepWorkflow: 3.5, prepTech: 3.2, overall: 3.68 },
    preSegment: "early_majority", postSegment: "early_adopter", pathway: "augmented", completedPre: true, completedPost: true },
  { id: "r04", name: "Sarah Kim", department: "HR", role: "HR Business Partner", level: "IC",
    preScore: { trust: 3.1, willingness: 3.2, prepFoundations: 2.8, prepWorkflow: 2.5, prepTech: 2.2, overall: 2.76 },
    postScore: { trust: 3.5, willingness: 3.6, prepFoundations: 3.2, prepWorkflow: 3.0, prepTech: 2.7, overall: 3.2 },
    preSegment: "late_majority", postSegment: "early_majority", pathway: "enabled", completedPre: true, completedPost: true },
  { id: "r05", name: "Tom Bradley", department: "Finance", role: "Financial Analyst", level: "IC",
    preScore: { trust: 2.4, willingness: 2.2, prepFoundations: 2.0, prepWorkflow: 1.8, prepTech: 1.6, overall: 2.0 },
    postScore: { trust: 2.9, willingness: 2.8, prepFoundations: 2.4, prepWorkflow: 2.2, prepTech: 2.0, overall: 2.46 },
    preSegment: "laggard", postSegment: "late_majority", pathway: "enabled", completedPre: true, completedPost: true },
  { id: "r06", name: "Lisa Chen", department: "Engineering", role: "Tech Lead", level: "Senior IC",
    preScore: { trust: 4.4, willingness: 4.2, prepFoundations: 4.3, prepWorkflow: 4.1, prepTech: 4.5, overall: 4.3 },
    preSegment: "innovator", pathway: "superpowered", completedPre: true, completedPost: false },
  { id: "r07", name: "Marcus Johnson", department: "Sales", role: "Sales Director", level: "Director",
    preScore: { trust: 3.8, willingness: 4.0, prepFoundations: 3.5, prepWorkflow: 3.3, prepTech: 3.0, overall: 3.52 },
    preSegment: "early_majority", pathway: "augmented", completedPre: true, completedPost: false },
  { id: "r08", name: "Anna Lopez", department: "Operations", role: "Operations Manager", level: "Manager",
    preScore: { trust: 2.8, willingness: 2.9, prepFoundations: 2.4, prepWorkflow: 2.2, prepTech: 2.0, overall: 2.46 },
    preSegment: "laggard", pathway: "enabled", completedPre: true, completedPost: false },
];

const DEMO_PASSCODE = "1234"; // prototype only — see auth note in Teams tab
const USERS_SEED = [
  { id: "u1", name: "Alex Rivera", email: "alex@company.com", role: "superadmin", department: "Platform", passcode: DEMO_PASSCODE },
  { id: "u2", name: "Jordan Kim", email: "jordan@company.com", role: "hradmin", department: "People Ops", passcode: DEMO_PASSCODE },
  { id: "u3", name: "Sam Chen", email: "sam@company.com", role: "manager", department: "Engineering", passcode: DEMO_PASSCODE },
];

// ─── PERMISSIONS ────────────────────────────────────────────────────────────────
// Which roles can see which tabs. "Real" auth would enforce this server-side too;
// here it only gates the client UI (see caveat in the Teams tab).
const TAB_PERMS = {
  survey: ["superadmin", "hradmin", "manager", "viewer"],
  dashboard: ["superadmin", "hradmin", "manager", "viewer"],
  assessments: ["superadmin", "hradmin"],
  builder: ["superadmin", "hradmin", "manager"],
  reports: ["superadmin", "hradmin", "manager", "viewer"],
  nudges: ["superadmin", "hradmin"],
  teams: ["superadmin", "hradmin"],
  config: ["superadmin"],
};

// ─── SCORING ─────────────────────────────────────────────────────────────────────
const avg = (arr) => (arr && arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;

// Resolves a question's free-text dimension label to a stable scoring bucket by
// keyword match rather than exact string equality. This means renaming "Trust"
// to "trust " or "Trust & Confidence" still lands in the same bucket, and any
// dimension that genuinely doesn't match a known AIM category becomes a visible
// "custom:*" bucket instead of being silently dropped from scoring.
function canonicalDimensionKey(dimensionText) {
  const norm = (dimensionText || "").toLowerCase();
  if (norm.includes("trust")) return "trust";
  if (norm.includes("willing")) return "willingness";
  if (norm.includes("tech")) return "prepTech";
  if (norm.includes("foundation")) return "prepFoundations";
  if (norm.includes("workflow") || norm.includes("work flow")) return "prepWorkflow";
  const slug = norm.trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "unmapped";
  return `custom:${slug}`;
}

function defaultOptionScores(options) {
  const n = options.length;
  if (n <= 1) return options.map(() => 3);
  return options.map((_, i) => round1(1 + (4 * i) / (n - 1)));
}

// Calls Claude to score an open-text answer 1–5 against the question's rubric.
// Falls back to a neutral midpoint score if the call or parse fails, so one bad
// network call doesn't block someone's whole submission.
async function scoreTextAnswer(question, answerText) {
  const rubric =
    question.scoringPrompt ||
    `Score this response 1 (low) to 5 (high) on how well it demonstrates the competency in this AIM assessment question: "${question.text}"`;
  const prompt = `${rubric}\n\nRespondent's answer:\n"""${answerText}"""\n\nRespond with ONLY a JSON object, no other text: {"score": <integer 1-5>, "rationale": "<one short sentence>"}`;
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await response.json();
    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .replace(/```json|```/g, "")
      .trim();
    const parsed = JSON.parse(text);
    const score = Number(parsed.score);
    return { score: Number.isFinite(score) ? Math.max(1, Math.min(5, score)) : 3, rationale: parsed.rationale || "" };
  } catch (e) {
    console.error("Text scoring failed, using fallback midpoint", e);
    return { score: 3, rationale: "Automatic scoring unavailable — default midpoint applied." };
  }
}

// Turns raw answers (of any question type) into dimension scores + overall.
// answers: Record<questionId, number | string>  (likert: number, multiple_choice:
// selected option text, text: free text)
async function computeScoresFromAnswers(answers, questions) {
  const buckets = {};
  for (const q of questions) {
    const val = answers[q.id];
    if (val == null || val === "") continue;
    let numeric = null;
    if (q.type === "likert") {
      numeric = Number(val);
    } else if (q.type === "multiple_choice") {
      const idx = (q.options || []).indexOf(val);
      const scores = q.optionScores && q.optionScores.length === (q.options || []).length ? q.optionScores : defaultOptionScores(q.options || []);
      numeric = idx >= 0 ? scores[idx] : null;
    } else if (q.type === "text") {
      const result = await scoreTextAnswer(q, String(val));
      numeric = result.score;
    }
    if (numeric == null || Number.isNaN(numeric)) continue;
    const key = canonicalDimensionKey(q.dimension);
    (buckets[key] = buckets[key] || []).push(numeric);
  }

  const trust = avg(buckets.trust);
  const willingness = avg(buckets.willingness);
  const prepFoundations = avg(buckets.prepFoundations);
  const prepWorkflow = avg(buckets.prepWorkflow);
  // Fall back to approximating prepTech from the two prep dimensions only if no
  // question is actually mapped to a "tech" dimension.
  const prepTech = buckets.prepTech ? avg(buckets.prepTech) : avg([prepFoundations, prepWorkflow].filter((v) => v > 0));

  const customKeys = Object.keys(buckets).filter((k) => k.startsWith("custom:"));
  const custom = {};
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

const scoreToSegment = (overall) => {
  if (overall >= 4.3) return "innovator";
  if (overall >= 3.7) return "early_adopter";
  if (overall >= 3.0) return "early_majority";
  if (overall >= 2.3) return "late_majority";
  return "laggard";
};

const scoreToPathway = (trust, prep, willingness) => {
  if (trust >= 4.1 && prep >= 4.0 && willingness >= 4.1) return "superpowered";
  if (trust >= 3.1 && prep >= 2.6 && willingness >= 3.1) return "augmented";
  return "enabled";
};

const SEGMENT_META = {
  innovator: { label: "Innovators", color: T.innovators, pct: 2.5, x: 90 },
  early_adopter: { label: "Early Adopters", color: T.earlyAdopters, pct: 13.5, x: 72 },
  early_majority: { label: "Early Majority", color: T.earlyMajority, pct: 34, x: 50 },
  late_majority: { label: "Late Majority", color: T.lateMajority, pct: 34, x: 28 },
  laggard: { label: "Laggards", color: T.laggards, pct: 16, x: 10 },
};

const PATHWAY_META = {
  enabled: { label: "AI Enabled", color: T.accentRed, desc: "Foundational training with high structure and support" },
  augmented: { label: "AI Augmented", color: T.accentCool, desc: "Mid-level enablement focused on workflows and daily tasks" },
  superpowered: { label: "AI Superpowered", color: T.accentGreen, desc: "Advanced enablement for strategic application and innovation" },
};

// ─── ADOPTION CURVE SVG ─────────────────────────────────────────────────────────
const AdoptionCurve = ({ respondents, showPost = false, height = 280 }) => {
  const W = 600;
  const H = height;
  const curvePoints = (x) => {
    const segments = [
      { start: 0, end: 0.08, h: 0.35 },
      { start: 0.08, end: 0.25, h: 0.65 },
      { start: 0.25, end: 0.62, h: 1.0 },
      { start: 0.62, end: 0.88, h: 1.0 },
      { start: 0.88, end: 1.0, h: 0.55 },
    ];
    for (const seg of segments) {
      if (x >= seg.start && x <= seg.end) {
        const t = (x - seg.start) / (seg.end - seg.start);
        return seg.h * Math.sin(t * Math.PI);
      }
    }
    return 0;
  };
  const pathD = () => {
    let d = `M 0 ${H * 0.85}`;
    for (let i = 0; i <= 200; i++) {
      const x = i / 200;
      const y = curvePoints(x);
      d += ` L ${x * W * 0.92 + W * 0.04} ${H * 0.85 - y * H * 0.65}`;
    }
    return d;
  };
  const segmentX = (seg) => (SEGMENT_META[seg].x / 100) * W * 0.92 + W * 0.04;
  const segmentY = (seg) => {
    const y = curvePoints(SEGMENT_META[seg].x / 100);
    return H * 0.85 - y * H * 0.65 - 16;
  };
  const dotsBySegment = {};
  respondents.forEach((r) => {
    const key = r.preSegment;
    if (!dotsBySegment[key]) dotsBySegment[key] = [];
    dotsBySegment[key].push({ r, isPost: false });
    if (showPost && r.postSegment) {
      const pkey = r.postSegment;
      if (!dotsBySegment[pkey]) dotsBySegment[pkey] = [];
      dotsBySegment[pkey].push({ r, isPost: true });
    }
  });

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="curveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={T.laggards} stopOpacity="0.15" />
          <stop offset="28%" stopColor={T.lateMajority} stopOpacity="0.15" />
          <stop offset="50%" stopColor={T.earlyMajority} stopOpacity="0.15" />
          <stop offset="72%" stopColor={T.earlyAdopters} stopOpacity="0.15" />
          <stop offset="100%" stopColor={T.innovators} stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <path d={`${pathD()} L ${W * 0.96} ${H * 0.85} Z`} fill="url(#curveGrad)" />
      <path d={pathD()} fill="none" stroke={T.borderStrong} strokeWidth="2" />
      <line x1={W * 0.04} y1={H * 0.85} x2={W * 0.96} y2={H * 0.85} stroke={T.border} strokeWidth="1" />
      {["laggard", "late_majority", "early_majority", "early_adopter", "innovator"].map((seg) => {
        const meta = SEGMENT_META[seg];
        const cx = segmentX(seg);
        const cy = segmentY(seg);
        const dots = dotsBySegment[seg] || [];
        return (
          <g key={seg}>
            <text x={cx} y={H * 0.93} textAnchor="middle" fontSize="10" fill={meta.color} fontWeight="600" fontFamily="system-ui">
              {meta.label}
            </text>
            <text x={cx} y={H * 0.99} textAnchor="middle" fontSize="9" fill={T.textMuted} fontFamily="system-ui">
              {meta.pct}%
            </text>
            {dots.map((d, i) => {
              const row = Math.floor(i / 6);
              const inRow = dots.slice(row * 6, row * 6 + 6).length;
              const idxInRow = i % 6;
              const offset = (idxInRow - (Math.min(inRow, 6) - 1) / 2) * 14;
              return (
                <g key={`${d.r.id}-${d.isPost}`}>
                  <circle cx={cx + offset} cy={cy - row * 14} r="5" fill={d.isPost ? meta.color : "white"} stroke={meta.color} strokeWidth={d.isPost ? 0 : 2} opacity={d.isPost ? 0.9 : 1} />
                  {d.isPost && (
                    <text x={cx + offset} y={cy - row * 14 + 3} textAnchor="middle" fontSize="7" fill="white" fontFamily="system-ui">
                      →
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
      {showPost && (
        <g>
          <circle cx={W * 0.04} cy={H * 0.06} r="5" fill="white" stroke={T.textSub} strokeWidth="2" />
          <text x={W * 0.04 + 10} y={H * 0.06 + 4} fontSize="10" fill={T.textSub} fontFamily="system-ui">
            Pre-assessment
          </text>
          <circle cx={W * 0.04} cy={H * 0.12} r="5" fill={T.earlyMajority} />
          <text x={W * 0.04 + 10} y={H * 0.12 + 4} fontSize="10" fill={T.textSub} fontFamily="system-ui">
            Post-assessment
          </text>
        </g>
      )}
    </svg>
  );
};

// ─── SHARED UI PIECES ───────────────────────────────────────────────────────────
const ScoreBar = ({ label, pre, post, color }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
      <span style={{ fontSize: 12, color: T.textSub, letterSpacing: "0.02em" }}>{label}</span>
      <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{pre.toFixed(1)}</span>
        {post != null && post > 0 && (
          <span style={{ fontSize: 13, fontWeight: 600, color: T.accentGreen }}>
            → {post.toFixed(1)} <span style={{ fontSize: 11, color: T.accentGreen }}>(+{(post - pre).toFixed(1)})</span>
          </span>
        )}
      </div>
    </div>
    <div style={{ height: 3, background: T.border, borderRadius: 2, position: "relative" }}>
      <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${(pre / 5) * 100}%`, background: T.borderStrong, borderRadius: 2, transition: "width 0.6s" }} />
      {post != null && post > 0 && (
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${(post / 5) * 100}%`, background: color, borderRadius: 2, opacity: 0.7, transition: "width 0.6s" }} />
      )}
    </div>
  </div>
);

const DistributionBar = ({ respondents, scoreKey }) => {
  const counts = { innovator: 0, early_adopter: 0, early_majority: 0, late_majority: 0, laggard: 0 };
  respondents.forEach((r) => {
    const seg = r[scoreKey];
    if (seg) counts[seg]++;
  });
  return (
    <div style={{ display: "flex", gap: 0, height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
      {["laggard", "late_majority", "early_majority", "early_adopter", "innovator"].map((seg) => (
        <div key={seg} style={{ flex: counts[seg] || 0.0001, background: SEGMENT_META[seg].color, opacity: 0.8 }} title={`${SEGMENT_META[seg].label}: ${counts[seg]}`} />
      ))}
    </div>
  );
};

const StatCard = ({ label, value, sub, delta }) => (
  <div style={{ padding: "20px 24px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 2 }}>
    <div style={{ fontSize: 10, color: T.textMuted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>{label}</div>
    <div style={{ fontSize: 32, fontWeight: 300, color: T.text, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
    {delta && <div style={{ fontSize: 12, color: T.accentGreen, marginTop: 4 }}>{delta}</div>}
    {sub && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{sub}</div>}
  </div>
);

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 10, color: T.textMuted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>{children}</div>
);

// ─── DASHBOARD ──────────────────────────────────────────────────────────────────
const Dashboard = ({ respondents }) => {
  const completed = respondents.filter((r) => r.completedPost).length;
  const preAvg = avg(respondents.map((r) => r.preScore.overall));
  const postAvg = completed ? avg(respondents.filter((r) => r.postScore).map((r) => r.postScore.overall)) : 0;
  const dims = [
    { label: "Trust", key: "trust", color: T.accentCool },
    { label: "Willingness", key: "willingness", color: T.accentWarm },
    { label: "Preparedness", key: "prepFoundations", color: T.accentGreen },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 300, color: T.text, margin: "0 0 4px", letterSpacing: "-0.03em" }}>AIM Readiness Overview</h1>
        <p style={{ fontSize: 14, color: T.textSub, margin: 0 }}>AI Measurement framework — pre and post assessment tracking</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, marginBottom: 1, background: T.border }}>
        <StatCard label="Total Respondents" value={String(respondents.length)} sub="completed pre-assessment" />
        <StatCard label="Post Complete" value={`${completed}`} sub={respondents.length ? `${Math.round((completed / respondents.length) * 100)}% completion rate` : "—"} />
        <StatCard label="Avg Pre Score" value={preAvg ? preAvg.toFixed(2) : "—"} sub="across all dimensions" />
        <StatCard label="Avg Uplift" value={postAvg ? `+${(postAvg - preAvg).toFixed(2)}` : "—"} delta={postAvg ? `${(((postAvg - preAvg) / preAvg) * 100).toFixed(1)}% improvement` : undefined} sub="pre → post delta" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 1, background: T.border, marginBottom: 1 }}>
        <div style={{ background: T.surface, padding: 28 }}>
          <SectionLabel>Technology Adoption Curve — Full Organization</SectionLabel>
          <AdoptionCurve respondents={respondents} showPost height={220} />
        </div>
        <div style={{ background: T.surface, padding: 28 }}>
          <SectionLabel>Segment Distribution</SectionLabel>
          {["innovator", "early_adopter", "early_majority", "late_majority", "laggard"].map((seg) => {
            const preCount = respondents.filter((r) => r.preSegment === seg).length;
            const postCount = respondents.filter((r) => r.postSegment === seg).length;
            const meta = SEGMENT_META[seg];
            return (
              <div key={seg} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: T.text }}>{meta.label}</span>
                    <span style={{ fontSize: 12, color: T.textSub }}>
                      {preCount} → <span style={{ color: meta.color, fontWeight: 600 }}>{postCount}</span>
                    </span>
                  </div>
                  <div style={{ height: 2, background: T.border, borderRadius: 1 }}>
                    <div style={{ height: "100%", width: `${respondents.length ? (preCount / respondents.length) * 100 : 0}%`, background: meta.color, opacity: 0.4, borderRadius: 1 }} />
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 10, color: T.textMuted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Training Pathway Placement</div>
            {["enabled", "augmented", "superpowered"].map((p) => {
              const count = respondents.filter((r) => r.pathway === p).length;
              const meta = PATHWAY_META[p];
              return (
                <div key={p} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: T.text }}>{meta.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: meta.color }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{ background: T.surface, padding: 28, border: `1px solid ${T.border}` }}>
        <SectionLabel>Dimension Scores — Organization Average</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
          {dims.map((d) => (
            <ScoreBar key={d.label} label={d.label} pre={avg(respondents.map((r) => r.preScore[d.key]))} post={completed ? avg(respondents.filter((r) => r.postScore).map((r) => r.postScore[d.key])) : 0} color={d.color} />
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── REPORTS ────────────────────────────────────────────────────────────────────
const Reports = ({ respondents }) => {
  const [level, setLevel] = useState("organization");
  const departments = [...new Set(respondents.map((r) => r.department))];
  const [selectedDept, setSelectedDept] = useState(departments[0] || "");
  const [selectedRespondent, setSelectedRespondent] = useState(respondents[0] || null);

  useEffect(() => {
    if (!selectedDept && departments.length) setSelectedDept(departments[0]);
    if (!selectedRespondent && respondents.length) setSelectedRespondent(respondents[0]);
  }, [respondents]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!respondents.length) {
    return (
      <div style={{ padding: 40, background: T.surface, border: `1px solid ${T.border}`, textAlign: "center", color: T.textMuted, fontSize: 13 }}>
        No respondents yet. Once people take the assessment, reports appear here.
      </div>
    );
  }

  const completed = respondents.filter((r) => r.completedPost).length;
  const preAvg = avg(respondents.map((r) => r.preScore.overall));
  const postAvg = completed ? avg(respondents.filter((r) => r.postScore).map((r) => r.postScore.overall)) : 0;
  const segCounts = { innovator: 0, early_adopter: 0, early_majority: 0, late_majority: 0, laggard: 0 };
  respondents.forEach((r) => segCounts[r.preSegment]++);
  const topSeg = Object.entries(segCounts).sort((a, b) => b[1] - a[1])[0];
  const superpoweredPct = Math.round((respondents.filter((r) => r.pathway === "superpowered").length / respondents.length) * 100);

  const OrgReport = () => (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, marginBottom: 1, background: T.border }}>
        <StatCard label="Org Avg Score" value={preAvg.toFixed(2)} sub="overall AIM score" />
        <StatCard label="Top Segment" value={SEGMENT_META[topSeg[0]].label} sub={`${Math.round((topSeg[1] / respondents.length) * 100)}% of respondents`} />
        <StatCard label="Post Uplift" value={postAvg ? `+${(postAvg - preAvg).toFixed(2)}` : "—"} delta={postAvg ? `${(((postAvg - preAvg) / preAvg) * 100).toFixed(1)}% improvement` : undefined} sub="pre → post delta" />
        <StatCard label="Superpowered" value={`${superpoweredPct}%`} sub="eligible for advanced track" />
      </div>
      <div style={{ background: T.surface, padding: 28, border: `1px solid ${T.border}`, marginBottom: 1 }}>
        <SectionLabel>Adoption Curve — All Respondents, Pre &amp; Post</SectionLabel>
        <AdoptionCurve respondents={respondents} showPost height={260} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: T.border }}>
        {departments.map((dept) => {
          const deptR = respondents.filter((r) => r.department === dept);
          const dAvg = avg(deptR.map((r) => r.preScore.overall));
          return (
            <div key={dept} style={{ background: T.surface, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: T.text }}>{dept}</span>
                <span style={{ fontSize: 20, fontWeight: 300, color: T.text }}>{dAvg.toFixed(2)}</span>
              </div>
              <DistributionBar respondents={deptR} scoreKey="preSegment" />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["laggard", "late_majority", "early_majority", "early_adopter", "innovator"].map((seg) => {
                  const count = deptR.filter((r) => r.preSegment === seg).length;
                  if (!count) return null;
                  return (
                    <span key={seg} style={{ fontSize: 10, color: SEGMENT_META[seg].color }}>
                      {count} {SEGMENT_META[seg].label.split(" ")[0]}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const DeptReport = () => {
    const deptR = respondents.filter((r) => r.department === selectedDept);
    const dPreAvg = deptR.length ? avg(deptR.map((r) => r.preScore.overall)) : 0;
    const postComplete = deptR.filter((r) => r.completedPost);
    const dPostAvg = postComplete.length ? avg(postComplete.map((r) => r.postScore.overall)) : 0;
    return (
      <div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {departments.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDept(d)}
              style={{ padding: "6px 14px", fontSize: 12, cursor: "pointer", background: selectedDept === d ? T.text : "none", color: selectedDept === d ? "white" : T.textSub, border: `1px solid ${selectedDept === d ? T.text : T.border}`, borderRadius: 2 }}
            >
              {d}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, marginBottom: 1, background: T.border }}>
          <StatCard label="Dept Avg Pre" value={dPreAvg.toFixed(2)} />
          <StatCard label="Dept Avg Post" value={dPostAvg ? dPostAvg.toFixed(2) : "—"} delta={dPostAvg ? `+${(dPostAvg - dPreAvg).toFixed(2)} uplift` : undefined} />
          <StatCard label="Respondents" value={String(deptR.length)} sub={`${postComplete.length} post complete`} />
        </div>
        <div style={{ background: T.surface, padding: 28, border: `1px solid ${T.border}`, marginBottom: 1 }}>
          <SectionLabel>Adoption Curve — {selectedDept}</SectionLabel>
          <AdoptionCurve respondents={deptR} showPost height={220} />
        </div>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {["Name", "Role", "Pre Segment", "Post Segment", "Pre Score", "Post Score", "Uplift", "Pathway"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deptR.map((r) => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${T.border}`, cursor: "pointer" }} onClick={() => { setSelectedRespondent(r); setLevel("individual"); }}>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: T.text, fontWeight: 500 }}>{r.name}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: T.textSub }}>{r.role}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 11, color: SEGMENT_META[r.preSegment].color, fontWeight: 600 }}>{SEGMENT_META[r.preSegment].label}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {r.postSegment ? <span style={{ fontSize: 11, color: SEGMENT_META[r.postSegment].color, fontWeight: 600 }}>{SEGMENT_META[r.postSegment].label}</span> : <span style={{ fontSize: 11, color: T.textMuted }}>Pending</span>}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: T.text }}>{r.preScore.overall.toFixed(2)}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: T.text }}>{r.postScore ? r.postScore.overall.toFixed(2) : "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: r.postScore ? T.accentGreen : T.textMuted }}>{r.postScore ? `+${(r.postScore.overall - r.preScore.overall).toFixed(2)}` : "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: PATHWAY_META[r.pathway].color }}>{PATHWAY_META[r.pathway].label}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const IndividualReport = () => {
    const r = selectedRespondent;
    if (!r) return null;
    const customPre = r.preScore.custom || {};
    const customPost = (r.postScore && r.postScore.custom) || {};
    const customKeys = [...new Set([...Object.keys(customPre), ...Object.keys(customPost)])];
    return (
      <div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 20 }}>
          <select style={{ padding: "6px 12px", fontSize: 13, border: `1px solid ${T.border}`, background: T.surface, color: T.text, borderRadius: 2 }} value={r.id} onChange={(e) => setSelectedRespondent(respondents.find((x) => x.id === e.target.value))}>
            {respondents.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name} — {x.department}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 1, background: T.border, marginBottom: 1 }}>
          <div style={{ background: T.surface, padding: 28 }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 400, color: T.text, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{r.name}</h2>
              <p style={{ fontSize: 13, color: T.textSub, margin: 0 }}>
                {r.role} · {r.department} · {r.level}
              </p>
            </div>
            <SectionLabel>Adoption Curve Position</SectionLabel>
            <AdoptionCurve respondents={[r]} showPost={r.completedPost} height={180} />
          </div>
          <div style={{ background: T.surface, padding: 28 }}>
            <SectionLabel>AIM Profile</SectionLabel>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4 }}>PRE SEGMENT</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: SEGMENT_META[r.preSegment].color }}>{SEGMENT_META[r.preSegment].label}</div>
            </div>
            {r.postSegment && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4 }}>POST SEGMENT</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: SEGMENT_META[r.postSegment].color }}>{SEGMENT_META[r.postSegment].label}</div>
              </div>
            )}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4 }}>RECOMMENDED PATHWAY</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: PATHWAY_META[r.pathway].color }}>{PATHWAY_META[r.pathway].label}</div>
              <div style={{ fontSize: 11, color: T.textSub, marginTop: 2 }}>{PATHWAY_META[r.pathway].desc}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4 }}>OVERALL SCORE</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 300, color: T.text }}>{r.preScore.overall.toFixed(2)}</span>
                {r.postScore && <span style={{ fontSize: 16, color: T.accentGreen }}>→ {r.postScore.overall.toFixed(2)}</span>}
              </div>
            </div>
          </div>
        </div>
        <div style={{ background: T.surface, padding: 28, border: `1px solid ${T.border}` }}>
          <SectionLabel>Dimension Breakdown</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 40px" }}>
            <ScoreBar label="Trust" pre={r.preScore.trust} post={r.postScore?.trust} color={T.accentCool} />
            <ScoreBar label="Willingness" pre={r.preScore.willingness} post={r.postScore?.willingness} color={T.accentWarm} />
            <ScoreBar label="Prep — Foundations" pre={r.preScore.prepFoundations} post={r.postScore?.prepFoundations} color={T.accentGreen} />
            <ScoreBar label="Prep — Workflow" pre={r.preScore.prepWorkflow} post={r.postScore?.prepWorkflow} color={T.accentGreen} />
          </div>
          {customKeys.length > 0 && (
            <div style={{ marginTop: 8, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Custom Dimensions</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 40px" }}>
                {customKeys.map((k) => (
                  <ScoreBar key={k} label={k.replace(/-/g, " ")} pre={customPre[k] || 0} post={customPost[k]} color={T.accentWarm} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 300, color: T.text, margin: "0 0 4px", letterSpacing: "-0.03em" }}>Reports</h1>
        <p style={{ fontSize: 14, color: T.textSub, margin: "0 0 20px" }}>Pre and post assessment results across all reporting levels</p>
        <div style={{ display: "flex", gap: 0, border: `1px solid ${T.border}`, borderRadius: 2, overflow: "hidden", width: "fit-content" }}>
          {["organization", "department", "individual"].map((l, i) => (
            <button key={l} onClick={() => setLevel(l)} style={{ padding: "8px 20px", fontSize: 13, cursor: "pointer", background: level === l ? T.text : T.surface, color: level === l ? "white" : T.textSub, border: "none", borderLeft: i > 0 ? `1px solid ${T.border}` : "none" }}>
              {l.charAt(0).toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {level === "organization" && <OrgReport />}
      {level === "department" && <DeptReport />}
      {level === "individual" && <IndividualReport />}
    </div>
  );
};

// ─── ASSESSMENT BUILDER ─────────────────────────────────────────────────────────
const AssessmentBuilder = ({ questions, onQuestionsChange }) => {
  const [editingQ, setEditingQ] = useState(null);
  const [originalDimension, setOriginalDimension] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [filterDim, setFilterDim] = useState("All");
  const dimensions = ["All", ...new Set(questions.map((q) => q.dimension))];
  const filtered = filterDim === "All" ? questions : questions.filter((q) => q.dimension === filterDim);

  const blank = { id: `q${Date.now()}`, code: "", dimension: "Trust", text: "", type: "likert", phase: "both", options: ["", "", ""], optionScores: [1, 3, 5], scoringPrompt: "", required: true };

  const QuestionEditor = ({ q, onSave, onClose }) => {
    const [form, setForm] = useState(q);
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const setOpt = (i, v) => {
      const o = [...(form.options || [])];
      o[i] = v;
      set("options", o);
    };
    const setOptScore = (i, v) => {
      const s = [...(form.optionScores && form.optionScores.length === (form.options || []).length ? form.optionScores : defaultOptionScores(form.options || []))];
      s[i] = Math.max(1, Math.min(5, Number(v) || 1));
      set("optionScores", s);
    };
    const addOpt = () => {
      const opts = [...(form.options || []), ""];
      set("options", opts);
      set("optionScores", defaultOptionScores(opts));
    };
    const removeOpt = (i) => {
      const opts = (form.options || []).filter((_, j) => j !== i);
      set("options", opts);
      set("optionScores", defaultOptionScores(opts));
    };

    const oldKey = canonicalDimensionKey(originalDimension);
    const newKey = canonicalDimensionKey(form.dimension);
    const dimensionChanged = originalDimension && oldKey !== newKey;

    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(26,24,20,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 2, padding: 32, width: 560, maxHeight: "85vh", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 500, color: T.text, margin: 0 }}>{q.id === blank.id ? "New Question" : "Edit Question"}</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: T.textMuted }}>×</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Question Code</label>
                <input style={{ width: "100%", padding: "8px 12px", border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 13, color: T.text, background: T.bg, boxSizing: "border-box" }} value={form.code} onChange={(e) => set("code", e.target.value)} placeholder="e.g. AIMT01" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Dimension</label>
                <input style={{ width: "100%", padding: "8px 12px", border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 13, color: T.text, background: T.bg, boxSizing: "border-box" }} value={form.dimension} onChange={(e) => set("dimension", e.target.value)} />
              </div>
            </div>
            {dimensionChanged && (
              <div style={{ padding: "10px 12px", background: "#FCEFE9", border: `1px solid ${T.accentWarm}`, borderRadius: 2, fontSize: 11, color: T.accentWarm, lineHeight: 1.5 }}>
                Heads up: this changes which score bucket future answers to this question count toward (was "{oldKey}", now "{newKey}"). Responses already recorded keep their original scores and won't change.
              </div>
            )}
            <div>
              <label style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Question Text</label>
              <textarea style={{ width: "100%", padding: "8px 12px", border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 13, color: T.text, background: T.bg, resize: "vertical", minHeight: 70, fontFamily: "system-ui", boxSizing: "border-box" }} value={form.text} onChange={(e) => set("text", e.target.value)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Question Type</label>
                <select style={{ width: "100%", padding: "8px 12px", border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 13, color: T.text, background: T.bg }} value={form.type} onChange={(e) => set("type", e.target.value)}>
                  <option value="likert">Likert Scale (1–5)</option>
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="text">Open Text (LLM scored)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Phase</label>
                <select style={{ width: "100%", padding: "8px 12px", border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 13, color: T.text, background: T.bg }} value={form.phase} onChange={(e) => set("phase", e.target.value)}>
                  <option value="pre">Pre only</option>
                  <option value="post">Post only</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>
            {form.type === "likert" && (
              <div style={{ padding: 16, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 2 }}>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Likert Scale Preview</div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
                  {[{ val: 1, label: "Strongly\nDisagree" }, { val: 2, label: "Disagree" }, { val: 3, label: "Neither Agree\nnor Disagree" }, { val: 4, label: "Agree" }, { val: 5, label: "Strongly\nAgree" }].map((item) => (
                    <div key={item.val} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${T.border}`, margin: "0 auto 6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: T.textSub }}>{item.val}</div>
                      <div style={{ fontSize: 9, color: T.textMuted, whiteSpace: "pre-line", lineHeight: 1.3 }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {form.type === "multiple_choice" && (
              <div>
                <label style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Options &amp; Score Weight (1–5)
                </label>
                {(form.options || []).map((opt, i) => {
                  const scores = form.optionScores && form.optionScores.length === (form.options || []).length ? form.optionScores : defaultOptionScores(form.options || []);
                  return (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                      <input style={{ flex: 1, padding: "8px 12px", border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 13, color: T.text, background: T.bg }} value={opt} onChange={(e) => setOpt(i, e.target.value)} placeholder={`Option ${i + 1}`} />
                      <input
                        type="number"
                        min={1}
                        max={5}
                        step={0.5}
                        style={{ width: 56, padding: "8px 8px", border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 13, color: T.text, background: T.bg, textAlign: "center" }}
                        value={scores[i]}
                        onChange={(e) => setOptScore(i, e.target.value)}
                        title="Score this option contributes (1-5)"
                      />
                      {(form.options || []).length > 2 && (
                        <button onClick={() => removeOpt(i)} style={{ padding: "0 10px", background: "none", border: `1px solid ${T.border}`, borderRadius: 2, cursor: "pointer", color: T.textMuted, fontSize: 16 }}>×</button>
                      )}
                    </div>
                  );
                })}
                <button onClick={addOpt} style={{ padding: "6px 14px", background: "none", border: `1px dashed ${T.borderStrong}`, borderRadius: 2, cursor: "pointer", fontSize: 12, color: T.textSub, marginTop: 4 }}>+ Add option</button>
              </div>
            )}
            {form.type === "text" && (
              <div style={{ padding: 16, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 2 }}>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>LLM Scoring</div>
                <p style={{ fontSize: 12, color: T.textSub, margin: "0 0 10px", lineHeight: 1.5 }}>
                  Open text responses are sent to Claude with the rubric below and scored 1–5 automatically when someone submits the assessment.
                </p>
                <div>
                  <label style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 5 }}>Scoring Rubric</label>
                  <textarea
                    style={{ width: "100%", padding: "8px 12px", border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 12, color: T.text, background: T.surface, resize: "vertical", minHeight: 70, fontFamily: "system-ui", boxSizing: "border-box" }}
                    value={form.scoringPrompt || ""}
                    onChange={(e) => set("scoringPrompt", e.target.value)}
                    placeholder="e.g. Score this response on demonstrated understanding of AI safety principles, 1=none to 5=expert"
                  />
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 8 }}>
              <button onClick={onClose} style={{ padding: "8px 20px", background: "none", border: `1px solid ${T.border}`, borderRadius: 2, cursor: "pointer", fontSize: 13, color: T.textSub }}>Cancel</button>
              <button onClick={() => { onSave(form); onClose(); }} style={{ padding: "8px 20px", background: T.text, border: "none", borderRadius: 2, cursor: "pointer", fontSize: 13, color: "white" }}>
                Save Question
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 300, color: T.text, margin: "0 0 4px", letterSpacing: "-0.03em" }}>Assessment Builder</h1>
          <p style={{ fontSize: 14, color: T.textSub, margin: 0 }}>
            AIM pre-assessment — {questions.length} questions across {new Set(questions.map((q) => q.dimension)).size} dimensions
          </p>
        </div>
        <button
          onClick={() => {
            setOriginalDimension("");
            setEditingQ(blank);
            setShowEditor(true);
          }}
          style={{ padding: "8px 16px", background: T.text, border: "none", borderRadius: 2, cursor: "pointer", fontSize: 13, color: "white" }}
        >
          + New Question
        </button>
      </div>
      <div style={{ display: "flex", gap: 1, marginBottom: 1, background: T.border, overflowX: "auto" }}>
        {dimensions.map((d) => (
          <button key={d} onClick={() => setFilterDim(d)} style={{ padding: "8px 16px", fontSize: 12, cursor: "pointer", background: filterDim === d ? T.text : T.surface, color: filterDim === d ? "white" : T.textSub, border: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
            {d}
          </button>
        ))}
      </div>
      <div style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        {filtered.map((q, i) => (
          <div key={q.id} style={{ padding: "16px 20px", borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : "none", display: "flex", gap: 16, alignItems: "flex-start" }}>
            <span style={{ fontSize: 10, color: T.textMuted, fontFamily: "monospace", paddingTop: 2, flexShrink: 0, minWidth: 70 }}>{q.code}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, color: T.text, margin: "0 0 6px", lineHeight: 1.5 }}>{q.text}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, padding: "2px 8px", border: `1px solid ${T.border}`, borderRadius: 2, color: T.textSub }}>{q.dimension}</span>
                <span style={{ fontSize: 10, padding: "2px 8px", border: `1px solid ${T.border}`, borderRadius: 2, color: q.type === "likert" ? T.accentCool : q.type === "text" ? T.accentWarm : T.textSub }}>
                  {q.type === "likert" ? "Likert 1–5" : q.type === "multiple_choice" ? "Multiple Choice" : "Open Text / LLM"}
                </span>
                <span style={{ fontSize: 10, padding: "2px 8px", border: `1px solid ${T.border}`, borderRadius: 2, color: q.phase === "both" ? T.accentGreen : T.accentWarm }}>
                  {q.phase === "both" ? "Pre & Post" : q.phase === "pre" ? "Pre only" : "Post only"}
                </span>
                {canonicalDimensionKey(q.dimension).startsWith("custom:") && (
                  <span style={{ fontSize: 10, padding: "2px 8px", border: `1px solid ${T.accentRed}`, borderRadius: 2, color: T.accentRed }} title="This dimension doesn't map to a known AIM category — it still counts toward the overall score as its own bucket, but won't appear in the standard Trust/Willingness/Prep breakdown.">
                    Custom dimension
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setOriginalDimension(q.dimension);
                setEditingQ(q);
                setShowEditor(true);
              }}
              style={{ padding: "4px 12px", background: "none", border: `1px solid ${T.border}`, borderRadius: 2, cursor: "pointer", fontSize: 12, color: T.textSub, flexShrink: 0 }}
            >
              Edit
            </button>
          </div>
        ))}
      </div>
      {showEditor && editingQ && (
        <QuestionEditor
          q={editingQ}
          onSave={(q) => {
            const next = questions.find((x) => x.id === q.id) ? questions.map((x) => (x.id === q.id ? q : x)) : [...questions, q];
            onQuestionsChange(next);
          }}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
};

// ─── SCORING ENGINE ─────────────────────────────────────────────────────────────
const ScoringEngine = () => (
  <div>
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ fontSize: 28, fontWeight: 300, color: T.text, margin: "0 0 4px", letterSpacing: "-0.03em" }}>Scoring Engine</h1>
      <p style={{ fontSize: 14, color: T.textSub, margin: 0 }}>
        Live cut scores and pathway placement rules — every submitted assessment runs through this logic automatically, including multiple-choice weights and LLM-scored open text.
      </p>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, marginBottom: 1, background: T.border }}>
      {["enabled", "augmented", "superpowered"].map((p) => {
        const meta = PATHWAY_META[p];
        const rules = {
          enabled: { trust: "≤ 3.0", prep: "≤ 2.5", willingness: "≤ 3.0" },
          augmented: { trust: "3.1 – 4.0", prep: "2.6 – 3.9", willingness: "3.1 – 4.0" },
          superpowered: { trust: "≥ 4.1", prep: "≥ 4.0", willingness: "≥ 4.1" },
        };
        return (
          <div key={p} style={{ background: T.surface, padding: 24, borderTop: `3px solid ${meta.color}` }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: meta.color, marginBottom: 4 }}>{meta.label}</div>
            <p style={{ fontSize: 12, color: T.textSub, margin: "0 0 20px", lineHeight: 1.5 }}>{meta.desc}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[{ label: "Trust", val: rules[p].trust }, { label: "Preparedness", val: rules[p].prep }, { label: "Willingness", val: rules[p].willingness }].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", paddingBottom: 10, borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 12, color: T.textSub }}>{r.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.text, fontFamily: "monospace" }}>{r.val}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: 12, background: T.bg, borderRadius: 2 }}>
              <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Adoption Curve Range</div>
              <div style={{ fontSize: 12, color: T.text }}>{p === "enabled" ? "Late Majority + Laggards" : p === "augmented" ? "Early Majority + Early Adopters" : "Innovators + Early Adopters"}</div>
            </div>
          </div>
        );
      })}
    </div>
    <div style={{ background: T.surface, padding: 24, border: `1px solid ${T.border}`, marginBottom: 1 }}>
      <SectionLabel>Adoption Curve Segment Thresholds</SectionLabel>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${T.border}` }}>
            {["Segment", "Overall Score Range", "% of Population", "Recommended Pathway"].map((h) => (
              <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            { seg: "innovator", range: "4.3 – 5.0", pathway: "superpowered" },
            { seg: "early_adopter", range: "3.7 – 4.2", pathway: "superpowered" },
            { seg: "early_majority", range: "3.0 – 3.6", pathway: "augmented" },
            { seg: "late_majority", range: "2.3 – 2.9", pathway: "enabled" },
            { seg: "laggard", range: "1.0 – 2.2", pathway: "enabled" },
          ].map((row) => (
            <tr key={row.seg} style={{ borderBottom: `1px solid ${T.border}` }}>
              <td style={{ padding: "12px 16px" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: SEGMENT_META[row.seg].color }}>{SEGMENT_META[row.seg].label}</span>
              </td>
              <td style={{ padding: "12px 16px", fontSize: 13, fontFamily: "monospace", color: T.text }}>{row.range}</td>
              <td style={{ padding: "12px 16px", fontSize: 13, color: T.textSub }}>{SEGMENT_META[row.seg].pct}%</td>
              <td style={{ padding: "12px 16px" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: PATHWAY_META[row.pathway].color }}>{PATHWAY_META[row.pathway].label}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div style={{ background: T.surface, padding: 24, border: `1px solid ${T.border}` }}>
      <SectionLabel>How Non-Likert Questions Score</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Multiple choice</div>
          <p style={{ fontSize: 12, color: T.textSub, lineHeight: 1.6, margin: 0 }}>
            Each option carries an editable 1–5 point value, set per-question in the Assessment Builder. The selected option's value feeds the same dimension average as a likert answer.
          </p>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Open text</div>
          <p style={{ fontSize: 12, color: T.textSub, lineHeight: 1.6, margin: 0 }}>
            The response is sent to Claude with the question's rubric and scored 1–5 at submission time. If the scoring call fails, a neutral midpoint (3) is used so one bad request never blocks a submission.
          </p>
        </div>
      </div>
    </div>
  </div>
);

// ─── TAKE ASSESSMENT ────────────────────────────────────────────────────────────
const LikertInput = ({ value, onChange }) => {
  const labels = ["Strongly\nDisagree", "Disagree", "Neither Agree\nnor Disagree", "Agree", "Strongly\nAgree"];
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, maxWidth: 480, margin: "0 auto" }}>
      {[1, 2, 3, 4, 5].map((v, i) => (
        <button key={v} onClick={() => onChange(v)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: `1.5px solid ${value === v ? T.text : T.borderStrong}`, background: value === v ? T.text : "transparent", color: value === v ? "white" : T.textSub, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 600, transition: "all 0.15s" }}>
            {v}
          </div>
          <div style={{ fontSize: 10, color: T.textMuted, whiteSpace: "pre-line", lineHeight: 1.3, textAlign: "center" }}>{labels[i]}</div>
        </button>
      ))}
    </div>
  );
};

const MultipleChoiceInput = ({ options, value, onChange }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 480, margin: "0 auto" }}>
    {(options || []).map((opt) => (
      <button
        key={opt}
        onClick={() => onChange(opt)}
        style={{
          padding: "13px 16px",
          textAlign: "left",
          background: value === opt ? T.text : T.surface,
          color: value === opt ? "white" : T.text,
          border: `1.5px solid ${value === opt ? T.text : T.border}`,
          borderRadius: 2,
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        {opt}
      </button>
    ))}
  </div>
);

const TextAnswerInput = ({ value, onChange }) => (
  <div style={{ maxWidth: 480, margin: "0 auto" }}>
    <textarea
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type your answer…"
      style={{ width: "100%", minHeight: 120, padding: "12px 14px", border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 13, color: T.text, background: T.surface, fontFamily: "system-ui", resize: "vertical", boxSizing: "border-box" }}
    />
    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>This answer will be scored automatically.</div>
  </div>
);

const TakeAssessment = ({ questions, respondents, onSubmitComplete }) => {
  const [stage, setStage] = useState("intake"); // intake | questions | result
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [level, setLevel] = useState("IC");
  const [phase, setPhase] = useState("pre");
  const [matchedRespondent, setMatchedRespondent] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const flowQuestions = questions.filter((q) => q.phase === "both" || q.phase === phase);
  const departments = [...new Set(respondents.map((r) => r.department))];

  const startAssessment = () => {
    setError("");
    if (!name.trim() || !department.trim()) {
      setError("Name and department are required to start.");
      return;
    }
    const existing = respondents.find((r) => r.name.toLowerCase() === name.trim().toLowerCase() && r.department.toLowerCase() === department.trim().toLowerCase());
    if (existing && existing.completedPre) {
      setMatchedRespondent(existing);
      setPhase("post");
      setRole(existing.role);
      setLevel(existing.level);
    } else {
      setMatchedRespondent(null);
      setPhase("pre");
    }
    setQIndex(0);
    setAnswers({});
    setStage("questions");
  };

  const setAnswer = (qId, val) => setAnswers((a) => ({ ...a, [qId]: val }));

  const goNext = () => {
    if (qIndex < flowQuestions.length - 1) setQIndex((i) => i + 1);
    else submit();
  };
  const goBack = () => {
    if (qIndex > 0) setQIndex((i) => i - 1);
    else setStage("intake");
  };

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const scores = await computeScoresFromAnswers(answers, flowQuestions);
      const segment = scoreToSegment(scores.overall);
      const prepComposite = avg([scores.prepFoundations, scores.prepWorkflow].filter((v) => v > 0));
      const pathway = scoreToPathway(scores.trust, prepComposite, scores.willingness);

      let updated;
      if (matchedRespondent) {
        updated = respondents.map((r) => {
          if (r.id !== matchedRespondent.id) return r;
          if (phase === "pre") return { ...r, preScore: scores, preSegment: segment, pathway, completedPre: true };
          return { ...r, postScore: scores, postSegment: segment, pathway, completedPost: true };
        });
      } else {
        const newRespondent = {
          id: `r_${Date.now()}`,
          name: name.trim(),
          department: department.trim(),
          role: role.trim() || "—",
          level: level.trim() || "IC",
          preScore: scores,
          preSegment: segment,
          pathway,
          completedPre: true,
          completedPost: false,
        };
        updated = [...respondents, newRespondent];
      }

      await onSubmitComplete(updated);
      const savedRecord = updated.find((r) => (matchedRespondent ? r.id === matchedRespondent.id : r.name === name.trim() && r.department === department.trim()));
      setResult({ respondent: savedRecord, scores, segment, pathway, phase });
      setStage("result");
    } catch (e) {
      console.error(e);
      setError("Something went wrong scoring or saving your response. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setStage("intake");
    setName("");
    setDepartment("");
    setRole("");
    setLevel("IC");
    setAnswers({});
    setQIndex(0);
    setResult(null);
    setMatchedRespondent(null);
    setError("");
  };

  if (stage === "intake") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: T.textMuted, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>AIM Assessment</div>
          <h1 style={{ fontSize: 26, fontWeight: 300, color: T.text, margin: "0 0 8px", letterSpacing: "-0.02em" }}>Let's find your starting point</h1>
          <p style={{ fontSize: 13, color: T.textSub, margin: 0, lineHeight: 1.5 }}>
            A short mix of scale, choice, and short-answer questions across Trust, Willingness, and Preparedness. If you've already taken the pre-assessment, entering the same name and department routes you to the post-assessment.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, background: T.surface, border: `1px solid ${T.border}`, padding: 24 }}>
          <div>
            <label style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Name</label>
            <input style={{ width: "100%", padding: "9px 12px", border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 13, color: T.text, background: T.bg, boxSizing: "border-box" }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Department</label>
            <input style={{ width: "100%", padding: "9px 12px", border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 13, color: T.text, background: T.bg, boxSizing: "border-box" }} value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Engineering" list="dept-list" />
            <datalist id="dept-list">
              {departments.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Role</label>
              <input style={{ width: "100%", padding: "9px 12px", border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 13, color: T.text, background: T.bg, boxSizing: "border-box" }} value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Product Manager" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Level</label>
              <select style={{ width: "100%", padding: "9px 12px", border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 13, color: T.text, background: T.bg }} value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="IC">Individual Contributor</option>
                <option value="Senior IC">Senior IC</option>
                <option value="Manager">Manager</option>
                <option value="Director">Director</option>
                <option value="Executive">Executive</option>
              </select>
            </div>
          </div>
          {error && <div style={{ fontSize: 12, color: T.accentRed }}>{error}</div>}
          <button onClick={startAssessment} style={{ padding: "11px 0", background: T.text, border: "none", borderRadius: 2, cursor: "pointer", fontSize: 13, color: "white", fontWeight: 500, marginTop: 4 }}>
            Start Assessment
          </button>
        </div>
      </div>
    );
  }

  if (stage === "questions") {
    const q = flowQuestions[qIndex];
    const progress = ((qIndex + 1) / flowQuestions.length) * 100;
    const currentVal = answers[q.id];
    const hasAnswer = q.type === "text" ? String(currentVal || "").trim().length > 0 : currentVal != null;
    return (
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{q.dimension}</span>
          <span style={{ fontSize: 11, color: T.textMuted }}>{qIndex + 1} / {flowQuestions.length}</span>
        </div>
        <div style={{ height: 3, background: T.border, borderRadius: 2, marginBottom: 40 }}>
          <div style={{ height: "100%", width: `${progress}%`, background: T.text, borderRadius: 2, transition: "width 0.2s" }} />
        </div>
        <p style={{ fontSize: 19, fontWeight: 400, color: T.text, lineHeight: 1.5, margin: "0 0 48px", minHeight: 60 }}>{q.text}</p>
        {q.type === "likert" && <LikertInput value={currentVal} onChange={(v) => setAnswer(q.id, v)} />}
        {q.type === "multiple_choice" && <MultipleChoiceInput options={q.options} value={currentVal} onChange={(v) => setAnswer(q.id, v)} />}
        {q.type === "text" && <TextAnswerInput value={currentVal} onChange={(v) => setAnswer(q.id, v)} />}
        {error && <div style={{ fontSize: 12, color: T.accentRed, marginTop: 20, textAlign: "center" }}>{error}</div>}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 56 }}>
          <button onClick={goBack} style={{ padding: "9px 20px", background: "none", border: `1px solid ${T.border}`, borderRadius: 2, cursor: "pointer", fontSize: 13, color: T.textSub }}>
            Back
          </button>
          <button
            onClick={() => {
              if (!hasAnswer) {
                setError("Please answer to continue.");
                return;
              }
              setError("");
              goNext();
            }}
            disabled={saving}
            style={{ padding: "9px 24px", background: T.text, border: "none", borderRadius: 2, cursor: saving ? "default" : "pointer", fontSize: 13, color: "white", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Scoring…" : qIndex === flowQuestions.length - 1 ? "Submit" : "Next"}
          </button>
        </div>
      </div>
    );
  }

  if (stage === "result" && result) {
    const meta = SEGMENT_META[result.segment];
    const pathMeta = PATHWAY_META[result.pathway];
    return (
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: T.textMuted, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>
            {result.phase === "pre" ? "Pre-assessment complete" : "Post-assessment complete"}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 300, color: T.text, margin: "0 0 8px", letterSpacing: "-0.02em" }}>Thanks, {result.respondent.name.split(" ")[0]}.</h1>
          <p style={{ fontSize: 13, color: T.textSub, margin: 0 }}>Here's where you land today.</p>
        </div>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: 28, marginBottom: 16 }}>
          <AdoptionCurve respondents={[result.respondent]} showPost={result.respondent.completedPost} height={200} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: T.border, marginBottom: 16 }}>
          <div style={{ background: T.surface, padding: 20 }}>
            <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Segment</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: meta.color }}>{meta.label}</div>
          </div>
          <div style={{ background: T.surface, padding: 20 }}>
            <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Recommended Pathway</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: pathMeta.color }}>{pathMeta.label}</div>
          </div>
        </div>
        <div style={{ background: T.surface, padding: 24, border: `1px solid ${T.border}`, marginBottom: 24 }}>
          <SectionLabel>Your Dimension Scores</SectionLabel>
          <ScoreBar label="Trust" pre={result.scores.trust} color={T.accentCool} />
          <ScoreBar label="Willingness" pre={result.scores.willingness} color={T.accentWarm} />
          <ScoreBar label="Prep — Foundations" pre={result.scores.prepFoundations} color={T.accentGreen} />
          <ScoreBar label="Prep — Workflow" pre={result.scores.prepWorkflow} color={T.accentGreen} />
        </div>
        <button onClick={reset} style={{ padding: "10px 22px", background: "none", border: `1px solid ${T.border}`, borderRadius: 2, cursor: "pointer", fontSize: 13, color: T.textSub }}>
          Done
        </button>
      </div>
    );
  }

  return null;
};

// ─── TEAMS (user directory + auth admin) ────────────────────────────────────────
const Teams = ({ users, onUsersChange, currentUser }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "viewer", department: "", passcode: "" });
  const [error, setError] = useState("");
  const canManage = currentUser.role === "superadmin";

  const addUser = () => {
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.passcode.trim()) {
      setError("Name, email, and passcode are required.");
      return;
    }
    if (users.some((u) => u.email.toLowerCase() === form.email.trim().toLowerCase())) {
      setError("A user with that email already exists.");
      return;
    }
    const newUser = { id: `u_${Date.now()}`, name: form.name.trim(), email: form.email.trim(), role: form.role, department: form.department.trim() || "—", passcode: form.passcode.trim() };
    onUsersChange([...users, newUser]);
    setForm({ name: "", email: "", role: "viewer", department: "", passcode: "" });
    setShowForm(false);
  };

  const removeUser = (id) => {
    if (id === currentUser.id) return;
    onUsersChange(users.filter((u) => u.id !== id));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 300, color: T.text, margin: "0 0 4px", letterSpacing: "-0.03em" }}>Team Manager</h1>
          <p style={{ fontSize: 14, color: T.textSub, margin: 0 }}>{users.length} accounts with portal access</p>
        </div>
        {canManage && (
          <button onClick={() => setShowForm((s) => !s)} style={{ padding: "8px 16px", background: T.text, border: "none", borderRadius: 2, cursor: "pointer", fontSize: 13, color: "white" }}>
            + Add Person
          </button>
        )}
      </div>
      <div style={{ marginBottom: 20, padding: "12px 16px", background: "#FCEFE9", border: `1px solid ${T.accentWarm}`, borderRadius: 2, fontSize: 12, color: T.accentWarm, lineHeight: 1.6 }}>
        Prototype auth: passcodes are stored in plain text in shared storage and checked client-side — this proves the login/role-gating flow but isn't secure enough for real people's credentials. A production version needs a real auth backend (hashed passcodes or SSO, server-enforced permissions).
      </div>
      {showForm && canManage && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: 20, marginBottom: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input style={{ padding: "8px 12px", border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 13, background: T.bg, color: T.text }} placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <input style={{ padding: "8px 12px", border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 13, background: T.bg, color: T.text }} placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <input style={{ padding: "8px 12px", border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 13, background: T.bg, color: T.text }} placeholder="Department" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} />
            <select style={{ padding: "8px 12px", border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 13, background: T.bg, color: T.text }} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
              <option value="viewer">Viewer</option>
              <option value="manager">Manager</option>
              <option value="hradmin">HR Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
            <input style={{ padding: "8px 12px", border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 13, background: T.bg, color: T.text }} placeholder="Passcode" value={form.passcode} onChange={(e) => setForm((f) => ({ ...f, passcode: e.target.value }))} />
          </div>
          {error && <div style={{ fontSize: 12, color: T.accentRed }}>{error}</div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setShowForm(false)} style={{ padding: "7px 16px", background: "none", border: `1px solid ${T.border}`, borderRadius: 2, cursor: "pointer", fontSize: 13, color: T.textSub }}>Cancel</button>
            <button onClick={addUser} style={{ padding: "7px 16px", background: T.text, border: "none", borderRadius: 2, cursor: "pointer", fontSize: 13, color: "white" }}>Save</button>
          </div>
        </div>
      )}
      <div style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {["Name", "Email", "Department", "Role", "Passcode", ""].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: "12px 16px", fontSize: 13, color: T.text, fontWeight: 500 }}>{u.name}{u.id === currentUser.id ? " (you)" : ""}</td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: T.textSub }}>{u.email}</td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: T.textSub }}>{u.department}</td>
                <td style={{ padding: "12px 16px", fontSize: 11, color: T.textSub, textTransform: "uppercase", letterSpacing: "0.05em" }}>{u.role}</td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: T.textMuted, fontFamily: "monospace" }}>{u.passcode}</td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  {canManage && u.id !== currentUser.id && (
                    <button onClick={() => removeUser(u.id)} style={{ padding: "4px 10px", background: "none", border: `1px solid ${T.border}`, borderRadius: 2, cursor: "pointer", fontSize: 11, color: T.accentRed }}>Remove</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── LOGIN ──────────────────────────────────────────────────────────────────────
const Login = ({ users, onLogin }) => {
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || user.passcode !== passcode) {
      setError("Email or passcode didn't match. Try again.");
      return;
    }
    setError("");
    onLogin(user);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
      <div style={{ width: 380 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: T.textMuted, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12 }}>AIM Platform</div>
          <h1 style={{ fontSize: 32, fontWeight: 300, color: T.text, margin: "0 0 8px", letterSpacing: "-0.03em" }}>AI Measurement</h1>
          <p style={{ fontSize: 14, color: T.textSub, margin: 0 }}>Workforce readiness assessment and adoption tracking</p>
        </div>
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Email</label>
            <input
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 13, color: T.text, background: T.surface, boxSizing: "border-box" }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Passcode</label>
            <input
              type="password"
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 13, color: T.text, background: T.surface, boxSizing: "border-box" }}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="••••"
            />
          </div>
          {error && <div style={{ fontSize: 12, color: T.accentRed }}>{error}</div>}
          <button onClick={submit} style={{ padding: "11px 0", background: T.text, border: "none", borderRadius: 2, cursor: "pointer", fontSize: 13, color: "white", fontWeight: 500, marginTop: 4 }}>
            Sign in
          </button>
          <div style={{ marginTop: 16, padding: "12px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 11, color: T.textMuted, lineHeight: 1.7 }}>
            Demo accounts (passcode <span style={{ fontFamily: "monospace" }}>{DEMO_PASSCODE}</span>):
            <br />
            alex@company.com — Super Admin
            <br />
            jordan@company.com — HR Admin
            <br />
            sam@company.com — Manager
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── PLACEHOLDER SECTIONS ───────────────────────────────────────────────────────
const PlaceholderSection = ({ title, sub }) => (
  <div>
    <h1 style={{ fontSize: 28, fontWeight: 300, color: T.text, margin: "0 0 4px", letterSpacing: "-0.03em" }}>{title}</h1>
    <p style={{ fontSize: 14, color: T.textSub }}>{sub}</p>
    <div style={{ padding: 40, background: T.surface, border: `1px solid ${T.border}`, textAlign: "center", color: T.textMuted, fontSize: 13 }}>Coming in next build</div>
  </div>
);

// ─── NAV ────────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "survey", label: "Take Assessment" },
  { id: "dashboard", label: "Overview" },
  { id: "assessments", label: "Assessment Builder" },
  { id: "builder", label: "Scoring Engine" },
  { id: "reports", label: "Reports" },
  { id: "nudges", label: "Nudges" },
  { id: "teams", label: "Teams" },
  { id: "config", label: "Config" },
];

// ─── ROOT APP ───────────────────────────────────────────────────────────────────
export default function App() {
  const [users, setUsers] = useState(null);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("survey");
  const [respondents, setRespondents] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const u = await loadKey(USERS_KEY, USERS_SEED);
      if (!cancelled) setUsers(u);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [r, q] = await Promise.all([loadKey(RESPONDENTS_KEY, MOCK_RESPONDENTS_SEED), loadKey(QUESTIONS_KEY, AIM_QUESTIONS_SEED)]);
        if (!cancelled) {
          setRespondents(r);
          setQuestions(q);
        }
      } catch (e) {
        if (!cancelled) {
          setDataError("Couldn't load saved data. Starting with defaults.");
          setRespondents(MOCK_RESPONDENTS_SEED);
          setQuestions(AIM_QUESTIONS_SEED);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const persistRespondents = useCallback(async (next) => {
    setRespondents(next);
    await saveKey(RESPONDENTS_KEY, next);
  }, []);

  const persistQuestions = useCallback(async (next) => {
    setQuestions(next);
    await saveKey(QUESTIONS_KEY, next);
  }, []);

  const persistUsers = useCallback(async (next) => {
    setUsers(next);
    await saveKey(USERS_KEY, next);
  }, []);

  if (users === null) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: T.textMuted, fontFamily: "system-ui" }}>
        Loading…
      </div>
    );
  }

  if (!user) return <Login users={users} onLogin={(u) => setUser(u)} />;

  const loading = respondents === null || questions === null;
  const visibleNav = NAV_ITEMS.filter((n) => (TAB_PERMS[n.id] || []).includes(user.role));
  const activeTab = visibleNav.some((n) => n.id === tab) ? tab : visibleNav[0]?.id;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "system-ui,-apple-system,sans-serif", display: "flex" }}>
      {/* SIDEBAR */}
      <div style={{ width: 200, background: T.surface, borderRight: `1px solid ${T.border}`, padding: "28px 0", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "0 20px 24px", borderBottom: `1px solid ${T.border}`, marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: T.textMuted, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>AIM Platform</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: T.text, letterSpacing: "-0.01em" }}>Admin Portal</div>
        </div>
        {visibleNav.map((n) => (
          <button
            key={n.id}
            onClick={() => setTab(n.id)}
            style={{
              display: "block",
              width: "100%",
              padding: "9px 20px",
              textAlign: "left",
              background: "none",
              border: "none",
              borderLeft: activeTab === n.id ? `2px solid ${T.text}` : "2px solid transparent",
              fontSize: 13,
              color: activeTab === n.id ? T.text : T.textSub,
              cursor: "pointer",
              fontWeight: activeTab === n.id ? 500 : 400,
              fontFamily: "system-ui",
            }}
          >
            {n.label}
          </button>
        ))}
        <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: T.text, marginBottom: 2 }}>{user.name}</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10 }}>{user.role}</div>
          <button onClick={() => setUser(null)} style={{ fontSize: 11, color: T.textMuted, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            Sign out
          </button>
        </div>
      </div>
      {/* MAIN */}
      <div style={{ flex: 1, padding: "36px 40px", overflowY: "auto", maxHeight: "100vh" }}>
        {loading ? (
          <div style={{ fontSize: 13, color: T.textMuted }}>Loading organization data…</div>
        ) : (
          <>
            {dataError && (
              <div style={{ marginBottom: 20, padding: "10px 16px", background: "#FCEFE9", border: `1px solid ${T.accentRed}`, borderRadius: 2, fontSize: 12, color: T.accentRed }}>{dataError}</div>
            )}
            {activeTab === "survey" && <TakeAssessment questions={questions} respondents={respondents} onSubmitComplete={persistRespondents} />}
            {activeTab === "dashboard" && <Dashboard respondents={respondents} />}
            {activeTab === "assessments" && <AssessmentBuilder questions={questions} onQuestionsChange={persistQuestions} />}
            {activeTab === "builder" && <ScoringEngine />}
            {activeTab === "reports" && <Reports respondents={respondents} />}
            {activeTab === "nudges" && <PlaceholderSection title="Nudge Library" sub="Skill reinforcement nudges — behavioral prompts and tool adoption questions" />}
            {activeTab === "teams" && <Teams users={users} onUsersChange={persistUsers} currentUser={user} />}
            {activeTab === "config" && <PlaceholderSection title="Configuration" sub="Thresholds, feature flags, and privacy settings" />}
          </>
        )}
      </div>
    </div>
  );
}
