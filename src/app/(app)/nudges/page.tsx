import { createClient } from "@/lib/supabase/server";
import { NudgeAdmin, type NudgeRow } from "@/components/nudges/NudgeAdmin";
import { createNudge } from "./actions";

export default async function NudgesPage() {
  const supabase = await createClient();

  const [{ data: nudgeRows, error }, { data: goalRows }, { data: responseRows }] = await Promise.all([
    supabase.from("nudges").select("*, transformation_goals(title)").order("created_at", { ascending: false }),
    supabase.from("transformation_goals").select("id, title").eq("tier", 0).order("title"),
    supabase.from("nudge_responses").select("nudge_id, value, responded_at").order("responded_at", { ascending: false }),
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

  const nudges: NudgeRow[] = (nudgeRows ?? []).map((row) => {
    const responses = responsesByNudge.get(row.id) ?? [];
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
    };
  });

  return <NudgeAdmin nudges={nudges} tierZeroGoals={goalRows ?? []} onCreate={createNudge} />;
}
