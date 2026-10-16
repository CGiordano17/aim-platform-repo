import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { NOTIFICATION_PROVIDERS } from "./registry";
import type { IncomingAction } from "./provider";
import type { NotificationProviderKey } from "@/lib/types";

const CADENCE_INTERVAL_MS: Record<string, number> = {
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
  // "per-completion" is deliberately absent — it's event-triggered (e.g.
  // "a Workflow task just got marked augmented"), not time-based, and
  // nothing in Workflows currently fires that event. Dispatching it here
  // on a timer would be wrong, not just incomplete, so it's left for
  // whoever wires up that trigger point rather than faked with a
  // made-up interval.
};

interface TargetProfile {
  id: string;
  email: string;
}

async function getActiveProviderKeys(supabase: ReturnType<typeof createAdminClient>): Promise<NotificationProviderKey[]> {
  const { data } = await supabase.from("integrations").select("vendor_name").eq("status", "connected").in("vendor_name", ["slack", "microsoft_teams"]);
  return (data ?? []).map((r: { vendor_name: string }) => r.vendor_name as NotificationProviderKey);
}

async function resolveIdentity(
  supabase: ReturnType<typeof createAdminClient>,
  profile: TargetProfile,
  providerKey: NotificationProviderKey
): Promise<{ externalUserId: string; externalTeamId?: string } | null> {
  const { data: cached } = await supabase
    .from("notification_identities")
    .select("external_user_id, external_team_id")
    .eq("profile_id", profile.id)
    .eq("provider", providerKey)
    .maybeSingle();

  if (cached) return { externalUserId: cached.external_user_id, externalTeamId: cached.external_team_id ?? undefined };

  const provider = NOTIFICATION_PROVIDERS[providerKey];
  const resolved = await provider.resolveUserByEmail(profile.email);
  if (!resolved) return null;

  // Cache it — this is the whole reason there's no user-facing "connect
  // your account" step. Resolved once, reused on every future nudge.
  await supabase.from("notification_identities").upsert(
    { profile_id: profile.id, provider: providerKey, external_user_id: resolved.externalUserId, external_team_id: resolved.externalTeamId ?? null },
    { onConflict: "profile_id,provider" }
  );
  return resolved;
}

async function getTargetProfiles(supabase: ReturnType<typeof createAdminClient>, department: string | null, role: string | null): Promise<TargetProfile[]> {
  let query = supabase.from("profiles").select("id, email");
  if (department) query = query.eq("department", department);
  if (role) query = query.eq("role", role);
  const { data } = await query;
  return data ?? [];
}

/**
 * Sends one nudge to everyone it targets, across every connected provider,
 * recording a `nudge_deliveries` row per person per channel. Used by both
 * the cron dispatcher (dispatchDueNudges) and anything that wants to fire a
 * nudge immediately (e.g. a future "send now" admin action).
 */
export async function dispatchNudge(nudgeId: string): Promise<{ sent: number; failed: number }> {
  const supabase = createAdminClient();

  const { data: nudge } = await supabase.from("nudges").select("*").eq("id", nudgeId).single();
  if (!nudge) throw new Error(`Nudge ${nudgeId} not found.`);

  const [providerKeys, profiles] = await Promise.all([
    getActiveProviderKeys(supabase),
    getTargetProfiles(supabase, nudge.target_department, nudge.target_role),
  ]);

  let sent = 0;
  let failed = 0;

  for (const profile of profiles) {
    for (const providerKey of providerKeys) {
      try {
        const identity = await resolveIdentity(supabase, profile, providerKey);
        if (!identity) continue; // this person has no account on this channel — not an error, just skip

        const provider = NOTIFICATION_PROVIDERS[providerKey];
        const result = await provider.sendNudge({ nudgeId: nudge.id, questionText: nudge.question_text, recipient: identity });

        await supabase.from("nudge_deliveries").insert({
          nudge_id: nudge.id,
          profile_id: profile.id,
          provider: providerKey,
          external_message_id: result.externalMessageId,
          status: "sent",
        });
        sent++;
      } catch (err) {
        await supabase.from("nudge_deliveries").insert({
          nudge_id: nudge.id,
          profile_id: profile.id,
          provider: providerKey,
          status: "failed",
          error: err instanceof Error ? err.message : String(err),
        });
        failed++;
      }
    }
  }

  await supabase.from("nudges").update({ last_dispatched_at: new Date().toISOString() }).eq("id", nudge.id);
  return { sent, failed };
}

/**
 * The actual scheduled job (called from src/app/api/cron/dispatch-nudges) —
 * finds every weekly/monthly nudge that's due and dispatches it. Idempotent
 * per nudge within its interval even if the cron fires more often than the
 * cadence requires (e.g. Vercel Hobby's daily-only cron granularity still
 * produces correct weekly/monthly behavior; it just checks more often than
 * strictly necessary).
 */
export async function dispatchDueNudges(): Promise<{ nudgesDispatched: number; totalSent: number; totalFailed: number }> {
  const supabase = createAdminClient();
  const { data: nudges } = await supabase.from("nudges").select("id, cadence, last_dispatched_at").in("cadence", Object.keys(CADENCE_INTERVAL_MS));

  let nudgesDispatched = 0;
  let totalSent = 0;
  let totalFailed = 0;

  for (const nudge of nudges ?? []) {
    const interval = CADENCE_INTERVAL_MS[nudge.cadence];
    const lastDispatched = nudge.last_dispatched_at ? new Date(nudge.last_dispatched_at).getTime() : 0;
    if (Date.now() - lastDispatched < interval) continue;

    const { sent, failed } = await dispatchNudge(nudge.id);
    nudgesDispatched++;
    totalSent += sent;
    totalFailed += failed;
  }

  return { nudgesDispatched, totalSent, totalFailed };
}

/**
 * Called from the Slack/Teams webhook routes once a reply's signature has
 * been verified. There's no Supabase Auth session here — Slack/Teams is
 * calling our server directly, not a signed-in browser — so this uses the
 * service-role client and resolves identity the other direction: external
 * user id -> profile (via the same `notification_identities` cache) ->
 * respondent. Feeds the same `nudge_responses` table the Dashboard widget's
 * submitNudgeResponse already writes to, so Tier 0 goal visibility doesn't
 * care which door the response came through.
 */
export async function recordIncomingResponse(action: IncomingAction, providerKey: NotificationProviderKey): Promise<void> {
  const supabase = createAdminClient();

  const { data: identity } = await supabase
    .from("notification_identities")
    .select("profile_id")
    .eq("provider", providerKey)
    .eq("external_user_id", action.externalUserId)
    .maybeSingle();
  if (!identity) return; // unknown sender — nothing to attribute this response to

  const { data: respondent } = await supabase.from("respondents").select("id").eq("profile_id", identity.profile_id).maybeSingle();

  await supabase.from("nudge_responses").insert({ nudge_id: action.nudgeId, respondent_id: respondent?.id ?? null, value: action.value });

  await supabase
    .from("nudge_deliveries")
    .update({ status: "responded", responded_at: new Date().toISOString(), response_value: action.value })
    .eq("nudge_id", action.nudgeId)
    .eq("profile_id", identity.profile_id)
    .eq("provider", providerKey)
    .is("responded_at", null);
}
