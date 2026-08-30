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
