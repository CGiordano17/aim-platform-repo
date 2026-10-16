"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NOTIFICATION_PROVIDERS } from "@/lib/notifications/registry";

// RLS ("integrations_all_superadmin") restricts this to superadmin, per PRD
// §3. Disconnecting is real and functional — it clears any stored tokens
// and flips status, which matters regardless of how the row was populated.
export async function disconnectIntegration(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("integrations")
    .update({ status: "disconnected", access_token: null, refresh_token: null, token_expires_at: null })
    .eq("id", id);
  if (error) throw new Error(`Failed to disconnect: ${error.message}`);
  revalidatePath("/integrations");
}

// Slack/Teams authenticate via a bot token/app credential set once by an
// admin in env vars, not a per-click OAuth consent redirect — so
// "connecting" means verifying those credentials actually work
// (NotificationProvider.testConnection) and recording the result, not
// starting an OAuth flow. Throws with a clear reason if the test fails,
// rather than silently marking it connected.
export async function connectNotificationProvider(providerId: string) {
  const provider = NOTIFICATION_PROVIDERS[providerId];
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);

  const ok = await provider.testConnection();
  if (!ok) {
    throw new Error(
      `Couldn't verify ${providerId} credentials — check the relevant env vars (see .env.example) are set and valid.`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("integrations")
    .upsert({ vendor_name: providerId, status: "connected", connected_at: new Date().toISOString() }, { onConflict: "vendor_name" });
  if (error) throw new Error(`Verified credentials but failed to record connection: ${error.message}`);
  revalidatePath("/integrations");
}
