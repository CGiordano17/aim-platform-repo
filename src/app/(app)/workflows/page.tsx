import { createClient } from "@/lib/supabase/server";
import type { Workflow } from "@/lib/types";
import { WorkflowsBoard } from "@/components/workflows/WorkflowsBoard";
import { createWorkflow, advanceWorkflowStatus, toggleTaskAugmented, updateWorkflowMetrics } from "./actions";

function mapRow(row: Record<string, unknown>): Workflow {
  return {
    id: row.id as string,
    name: row.name as string,
    department: row.department as string | null,
    owner: row.owner as string | null,
    tasks: (row.tasks as Workflow["tasks"]) ?? [],
    status: row.status as Workflow["status"],
    usageRate: row.usage_rate as number | null,
    adoptionThreshold: row.adoption_threshold as number | null,
    complianceRate: row.compliance_rate as number | null,
    linkedGoalIds: (row.linked_goal_ids as string[]) ?? [],
    dateIdentified: row.date_identified as string | null,
    dateAugmented: row.date_augmented as string | null,
    dateScaled: row.date_scaled as string | null,
  };
}

export default async function WorkflowsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("workflows").select("*").order("created_at", { ascending: false });

  if (error) {
    return <div className="p-10 text-hud-text font-body text-sm">Couldn&apos;t load workflows: {error.message}</div>;
  }

  return (
    <WorkflowsBoard
      initialWorkflows={(data ?? []).map(mapRow)}
      onCreate={createWorkflow}
      onAdvance={advanceWorkflowStatus}
      onToggleTask={toggleTaskAugmented}
      onUpdateMetric={updateWorkflowMetrics}
    />
  );
}
