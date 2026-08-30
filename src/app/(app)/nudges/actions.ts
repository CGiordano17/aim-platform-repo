"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface CreateNudgeInput {
  questionText: string;
  linkedGoalId: string | null;
  cadence: "per-completion" | "weekly" | "monthly";
  targetDepartment: string | null;
  targetRole: string | null;
}

// RLS ("nudges_all_admin") restricts writes to superadmin/hradmin, matching
// PRD §3's Nudges tab access — the admin portal authors and monitors nudges;
// actual delivery to individuals is a separate concern (see the Dashboard's
// "Nudges for you" widget for the one response-collection path that exists
// so far).
export async function createNudge(input: CreateNudgeInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("nudges").insert({
    question_text: input.questionText,
    linked_goal_id: input.linkedGoalId,
    cadence: input.cadence,
    target_department: input.targetDepartment,
    target_role: input.targetRole,
  });
  if (error) throw new Error(`Failed to create nudge: ${error.message}`);
  revalidatePath("/nudges");
}

// Any authenticated user can respond (RLS "nudge_responses_insert_authenticated")
// — matches a nudge being something delivered *to* someone, not an
// admin-only action. Linked to the respondent row when one exists (from
// Take Assessment); null is fine if they haven't taken the assessment yet.
export async function submitNudgeResponse(nudgeId: string, value: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: respondent } = await supabase.from("respondents").select("id").eq("profile_id", user.id).maybeSingle();

  const { error } = await supabase.from("nudge_responses").insert({
    nudge_id: nudgeId,
    respondent_id: respondent?.id ?? null,
    value,
  });
  if (error) throw new Error(`Failed to submit response: ${error.message}`);
  revalidatePath("/dashboard");
  revalidatePath("/nudges");
}
