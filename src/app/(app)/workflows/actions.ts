"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { WorkflowTask } from "@/lib/types";

const STATUS_ORDER = ["identified", "augmented", "piloting", "standard"] as const;
type WorkflowStatus = (typeof STATUS_ORDER)[number];

export interface CreateWorkflowInput {
  name: string;
  department: string;
  owner: string;
  taskNames: string[];
}

// RLS ("workflows_write_authenticated") currently allows any authenticated
// role, matching PRD §3's "All roles" + the open edit-rights question in §7
// — see the comment in src/lib/nav.ts.
export async function createWorkflow(input: CreateWorkflowInput) {
  const supabase = await createClient();
  const tasks: WorkflowTask[] = input.taskNames.filter((t) => t.trim()).map((name, i) => ({ id: `t${i}`, name: name.trim(), aiAugmented: false }));

  const { error } = await supabase.from("workflows").insert({
    name: input.name,
    department: input.department || null,
    owner: input.owner || null,
    tasks,
    status: "identified",
    date_identified: new Date().toISOString().slice(0, 10),
  });
  if (error) throw new Error(`Failed to create workflow: ${error.message}`);
  revalidatePath("/workflows");
}

// Advancing a stage is always an explicit admin action — never automatic,
// even once a piloting workflow's usageRate crosses adoptionThreshold. PRD
// §7 leaves "is paving automatic-at-threshold or does it require explicit
// functional-leader approval" unresolved; requiring a manual click here
// doesn't foreclose either answer, while auto-advancing would have.
export async function advanceWorkflowStatus(id: string, currentStatus: WorkflowStatus) {
  const idx = STATUS_ORDER.indexOf(currentStatus);
  if (idx === -1 || idx === STATUS_ORDER.length - 1) return;
  const nextStatus = STATUS_ORDER[idx + 1];

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const dateField = nextStatus === "augmented" ? { date_augmented: today } : nextStatus === "standard" ? { date_scaled: today } : {};

  const { error } = await supabase.from("workflows").update({ status: nextStatus, ...dateField }).eq("id", id);
  if (error) throw new Error(`Failed to advance workflow: ${error.message}`);
  revalidatePath("/workflows");
}

export async function toggleTaskAugmented(id: string, tasks: WorkflowTask[], taskId: string) {
  const supabase = await createClient();
  const nextTasks = tasks.map((t) => (t.id === taskId ? { ...t, aiAugmented: !t.aiAugmented } : t));
  const { error } = await supabase.from("workflows").update({ tasks: nextTasks }).eq("id", id);
  if (error) throw new Error(`Failed to update task: ${error.message}`);
  revalidatePath("/workflows");
}

export async function updateWorkflowMetrics(id: string, field: "usage_rate" | "adoption_threshold" | "compliance_rate", value: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("workflows").update({ [field]: value }).eq("id", id);
  if (error) throw new Error(`Failed to update workflow: ${error.message}`);
  revalidatePath("/workflows");
}
