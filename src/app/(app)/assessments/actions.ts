"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Question } from "@/lib/types";

// RLS ("questions_insert_admin"/"questions_update_admin") restricts writes
// to superadmin/hradmin — matches PRD §3's Assessment Builder access.
export async function saveQuestion(question: Question) {
  const supabase = await createClient();
  const row = {
    code: question.code,
    dimension: question.dimension,
    text: question.text,
    type: question.type,
    phase: question.phase,
    options: question.options ?? null,
    option_scores: question.optionScores ?? null,
    scoring_prompt: question.scoringPrompt ?? null,
    required: question.required,
  };

  // question.id is a client-generated placeholder for new questions (not a
  // real DB id yet) — upsert on the unique `code` instead, so re-saving an
  // existing question by code updates it rather than creating a duplicate.
  const { error } = await supabase.from("questions").upsert(row, { onConflict: "code" });
  if (error) throw new Error(`Failed to save question: ${error.message}`);
  revalidatePath("/assessments");
}
