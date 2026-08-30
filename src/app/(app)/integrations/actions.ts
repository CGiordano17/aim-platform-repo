"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// RLS ("integrations_all_superadmin") restricts this to superadmin, per PRD
// §3. Disconnecting is real and functional even though no connector is
// registered yet to actually *start* a connection with (see
// src/lib/integrations/registry.ts) — it clears any stored tokens, which
// matters regardless of how the row was populated.
export async function disconnectIntegration(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("integrations")
    .update({ status: "disconnected", access_token: null, refresh_token: null, token_expires_at: null })
    .eq("id", id);
  if (error) throw new Error(`Failed to disconnect: ${error.message}`);
  revalidatePath("/integrations");
}
