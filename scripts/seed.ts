// Seeds the client's real content (Transformation Goals ROI grid, Readiness
// assessment questions) into a Supabase project. Run with:
//   npm run db:seed
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
// environment (see .env.example) — this uses the service role key to bypass
// RLS, since it's a trusted server-only operation.
//
// Deliberately does NOT seed the prototype's MOCK_RESPONDENTS_SEED or
// USERS_SEED / demo passcode accounts — those were fake illustrative data
// (Jordan Ellis, Maya Patel, etc.) and a shared "1234" passcode meant for a
// browser-only demo. Real respondents and real user accounts belong in real
// infrastructure only via real signup/Supabase Auth, not injected as seed
// data alongside genuine client content.

import { createClient } from "@supabase/supabase-js";
import { TRANSFORMATION_GOALS_SEED } from "../src/lib/data/transformation-goals-seed";
import { QUESTIONS_SEED } from "../src/lib/data/questions-seed";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — copy .env.example to .env and fill in your Supabase project's values first.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function seedGoals() {
  const rows = TRANSFORMATION_GOALS_SEED.map((g) => ({
    id: g.id,
    title: g.title,
    category: g.category,
    tier: g.tier,
    maturity: g.maturity,
    statement: g.statement,
    measurement_source: g.measurementSource,
    measures: g.measures ?? null,
    source_detail: g.sourceDetail ?? null,
    current_value: g.currentValue,
    target_value: g.targetValue ?? null,
    unit: g.unit ?? null,
    linked_workflow_ids: g.linkedWorkflowIds,
    linked_nudge_ids: g.linkedNudgeIds,
    vendor_sources: g.vendorSources ?? [],
    implementation_steps: g.implementationSteps ?? [],
    roi_example: g.roiExample ?? null,
  }));

  const { error, count } = await supabase.from("transformation_goals").upsert(rows, { onConflict: "id", count: "exact" });
  if (error) throw new Error(`Seeding transformation_goals failed: ${error.message}`);
  console.log(`Seeded ${count ?? rows.length} transformation_goals rows.`);
}

async function seedQuestions() {
  const rows = QUESTIONS_SEED.map((q) => ({
    code: q.code,
    dimension: q.dimension,
    text: q.text,
    type: q.type,
    phase: q.phase,
    options: q.options ?? null,
    option_scores: q.optionScores ?? null,
    scoring_prompt: q.scoringPrompt ?? null,
    required: q.required,
  }));

  const { error, count } = await supabase.from("questions").upsert(rows, { onConflict: "code", count: "exact" });
  if (error) throw new Error(`Seeding questions failed: ${error.message}`);
  console.log(`Seeded ${count ?? rows.length} questions rows.`);
}

async function main() {
  await seedGoals();
  await seedQuestions();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
