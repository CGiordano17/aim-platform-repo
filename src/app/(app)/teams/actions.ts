"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types";

// RLS ("profiles_write_admin") already restricts this to superadmin/hradmin
// — this action is a convenience wrapper, not the actual security boundary.
export async function updateUserRole(profileId: string, role: AppRole) {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", profileId);
  if (error) throw new Error(`Failed to update role: ${error.message}`);
  revalidatePath("/teams");
}
