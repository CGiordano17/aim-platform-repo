import { createClient } from "@/lib/supabase/server";
import { NudgeAdmin, type NudgeRow } from "@/components/nudges/NudgeAdmin";
import { createNudge, dispatchNudgeNow } from "./actions";

export default async function NudgesPage() {
  const supabase = await createClient();

  const [{ data: nudgeRows, error }, { data: goalRows }, { data: responseRows }, { data: deliveryRows }] = await Promise.all([
    supabase.from("nudges").select("*, transformation_goals(title)").order("created_at", { ascending: false }),
    supabase.from("transformation_goals").select("id, title").eq("tier", 0).order("title"),
    supabase.from("nudge_responses").select("nudge_id, value, responded_at").order("responded_at", { ascending: false }),
    supabase.from("nudge_deliveries").select("nudge_id, provider, status"),
  ]);

  if (error) {
    return <div className="p-10 text-hud-text font-body text-sm">Couldn&apos;t load nudges: {error.message}</div>;
  }

  const responsesByNudge = new Map<string, { value: string; respondedAt: string }[]>();
  (responseRows ?? []).forEach((r) => {
    const list = responsesByNudge.get(r.nudge_id) ?? [];
    list.push({ value: r.value, respondedAt: r.responded_at });
    responsesByNudge.set(r.nudge_id, list);
  });

  // Delivery stats (Slack/Teams push) are separate from nudge_responses
  // above (which also includes replies via the Dashboard widget) — this is
  // specifically "did the organic-delivery path actually reach people."
  const deliveryStatsByNudge = new Map<string, { sent: number; failed: number; responded: number; providers: Set<string> }>();
  (deliveryRows ?? []).forEach((d) => {
    const stats = deliveryStatsByNudge.get(d.nudge_id) ?? { sent: 0, failed: 0, responded: 0, providers: new Set<string>() };
    if (d.status === "failed") stats.failed++;
    else stats.sent++;
    if (d.status === "responded") stats.responded++;
    stats.providers.add(d.provider);
    deliveryStatsByNudge.set(d.nudge_id, stats);
  });

  const nudges: NudgeRow[] = (nudgeRows ?? []).map((row) => {
    const responses = responsesByNudge.get(row.id) ?? [];
    const delivery = deliveryStatsByNudge.get(row.id);
    return {
      id: row.id,
      questionText: row.question_text,
      linkedGoalId: row.linked_goal_id,
      linkedGoalTitle: (row.transformation_goals as { title: string } | null)?.title ?? null,
      cadence: row.cadence,
      targetDepartment: row.target_department,
      targetRole: row.target_role,
      responseCount: responses.length,
      recentResponses: responses.slice(0, 5),
      lastDispatchedAt: row.last_dispatched_at,
      delivery: delivery
        ? { sent: delivery.sent, failed: delivery.failed, responded: delivery.responded, providers: Array.from(delivery.providers) }
        : null,
    };
  });

  return <NudgeAdmin nudges={nudges} tierZeroGoals={goalRows ?? []} onCreate={createNudge} onSendNow={dispatchNudgeNow} />;
}
