"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { scoreTextAnswer } from "@/lib/anthropic";
import { computeScoresFromAnswers, scoreToSegment, scoreToPathway, avg, type Answers, type Segment, type Pathway } from "@/lib/scoring";
import type { Question, DimensionScores } from "@/lib/types";

export interface SubmitAssessmentInput {
  department: string;
  role: string;
  level: string;
  phase: "pre" | "post";
  answers: Answers;
}

export interface SubmitAssessmentResult {
  scores: DimensionScores;
  segment: Segment;
  pathway: Pathway;
  phase: "pre" | "post";
  name: string;
}

// Respondents are matched to the signed-in account via profile_id — a real
// improvement over prototype/App.jsx's fragile name+department string
// matching, which only existed because that prototype had no real accounts.
export async function submitAssessment(input: SubmitAssessmentInput): Promise<SubmitAssessmentResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single();
  const name = profile?.name ?? user.email ?? "Unknown";

  const { data: questionRows, error: qError } = await supabase
    .from("questions")
    .select("*")
    .in("phase", ["both", input.phase]);
  if (qError) throw new Error(`Failed to load questions: ${qError.message}`);

  const questions: Question[] = (questionRows ?? []).map((row) => ({
    id: row.id,
    code: row.code,
    dimension: row.dimension,
    text: row.text,
    type: row.type,
    phase: row.phase,
    options: row.options ?? undefined,
    optionScores: row.option_scores ?? undefined,
    scoringPrompt: row.scoring_prompt ?? undefined,
    required: row.required,
  }));

  // Answers are keyed by question id in the payload; scoring keys off the
  // same ids, matching the fetched question set exactly.
  const scores = await computeScoresFromAnswers(input.answers, questions, scoreTextAnswer);
  const segment = scoreToSegment(scores.overall);
  const prepComposite = avg([scores.prepFoundations, scores.prepWorkflow].filter((v) => v > 0));
  const pathway = scoreToPathway(scores.trust, prepComposite, scores.willingness);

  const { data: existing } = await supabase.from("respondents").select("id, completed_pre, completed_post").eq("profile_id", user.id).maybeSingle();

  if (existing) {
    const update =
      input.phase === "pre"
        ? { pre_score: scores, pre_segment: segment, pathway, completed_pre: true, department: input.department, role: input.role, level: input.level }
        : { post_score: scores, post_segment: segment, pathway, completed_post: true };
    const { error } = await supabase.from("respondents").update(update).eq("id", existing.id);
    if (error) throw new Error(`Failed to save your assessment: ${error.message}`);
  } else {
    const { error } = await supabase.from("respondents").insert({
      profile_id: user.id,
      name,
      department: input.department,
      role: input.role,
      level: input.level,
      pre_score: scores,
      pre_segment: segment,
      pathway,
      completed_pre: true,
      completed_post: false,
    });
    if (error) throw new Error(`Failed to save your assessment: ${error.message}`);
  }

  revalidatePath("/survey");
  revalidatePath("/dashboard");
  revalidatePath("/reports");

  return { scores, segment, pathway, phase: input.phase, name };
}
