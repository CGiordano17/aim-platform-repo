import { createClient } from "@/lib/supabase/server";
import type { TransformationGoal } from "@/lib/types";
import { TransformationGoalsBoard } from "@/components/goals/TransformationGoalsBoard";
import { updateGoalCurrentValue, logGoalReview } from "./actions";

// Maps a snake_case DB row (supabase/migrations/0001_init.sql) back to the
// camelCase TransformationGoal shape used throughout the UI layer.
function mapRow(row: Record<string, unknown>): TransformationGoal {
  return {
    id: row.id as string,
    title: row.title as string,
    category: row.category as TransformationGoal["category"],
    tier: row.tier as TransformationGoal["tier"],
    maturity: row.maturity as TransformationGoal["maturity"],
    statement: row.statement as TransformationGoal["statement"],
    measurementSource: row.measurement_source as TransformationGoal["measurementSource"],
    measures: row.measures as string | null,
    sourceDetail: row.source_detail as string | null,
    currentValue: row.current_value as string | null,
    targetValue: row.target_value as string | null,
    unit: row.unit as string | null,
    linkedWorkflowIds: (row.linked_workflow_ids as string[]) ?? [],
    linkedNudgeIds: (row.linked_nudge_ids as string[]) ?? [],
    vendorSources: (row.vendor_sources as TransformationGoal["vendorSources"]) ?? [],
    implementationSteps: (row.implementation_steps as TransformationGoal["implementationSteps"]) ?? [],
    roiExample: row.roi_example as string | null,
    lastUpdated: row.last_updated as string | null,
    updatedBy: row.updated_by as string | null,
  };
}

export default async function GoalsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("transformation_goals").select("*").order("tier", { ascending: false });

  if (error) {
    return (
      <div className="p-10 text-hud-text font-body">
        <p className="text-sm">Couldn&apos;t load Transformation Goals: {error.message}</p>
        <p className="text-xs text-hud-muted mt-2">
          Has the schema been migrated and seeded? See supabase/migrations/0001_init.sql and{" "}
          <code>npm run db:seed</code>.
        </p>
      </div>
    );
  }

  const goals = (data ?? []).map(mapRow);

  return <TransformationGoalsBoard initialGoals={goals} onUpdateCurrentValue={updateGoalCurrentValue} onLogReview={logGoalReview} />;
}
