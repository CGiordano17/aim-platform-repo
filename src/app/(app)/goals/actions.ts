"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// RLS (supabase/migrations/0001_init.sql, "goals_update_authenticated")
// currently allows any authenticated role to update currentValue — matches
// the prototype's provisional behavior pending the PRD §7 open decision on
// stricter per-tab edit rights.
export async function updateGoalCurrentValue(id: string, value: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("transformation_goals")
    .update({ current_value: value, last_updated: new Date().toISOString(), updated_by: user?.id ?? null })
    .eq("id", id);

  if (error) throw new Error(`Failed to update goal ${id}: ${error.message}`);
  revalidatePath("/goals");
}

// Tier 1 manual-entry admin form (PRD build phase 4) — RLS
// ("goal_review_entries_insert_admin") restricts this to superadmin/hradmin,
// since it's expert review, not open editing like currentValue above.
export async function logGoalReview(goalId: string, note: string, flagged: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("goal_review_entries").insert({
    goal_id: goalId,
    reviewer_id: user?.id ?? null,
    note: note.trim() || null,
    flagged,
  });

  if (error) throw new Error(`Failed to log review for goal ${goalId}: ${error.message}`);
  revalidatePath("/goals");
}
