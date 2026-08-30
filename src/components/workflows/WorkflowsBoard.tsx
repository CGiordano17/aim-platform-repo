"use client";

import { useState } from "react";
import type { Workflow } from "@/lib/types";
import type { CreateWorkflowInput } from "@/app/(app)/workflows/actions";
import { WorkflowCard, STATUS_LABEL } from "./WorkflowCard";

const STATUS_ORDER: Workflow["status"][] = ["identified", "augmented", "piloting", "standard"];
const STATUS_SUB: Record<Workflow["status"], string> = {
  identified: "Flagged high-value, broken into tasks",
  augmented: "Tasks designed with AI assist",
  piloting: "Dirt path forming — usage tracked",
  standard: "Paved — required, tracked for compliance",
};

export function WorkflowsBoard({
  initialWorkflows,
  onCreate,
  onAdvance,
  onToggleTask,
  onUpdateMetric,
}: {
  initialWorkflows: Workflow[];
  onCreate: (input: CreateWorkflowInput) => Promise<void>;
  onAdvance: (id: string, status: Workflow["status"]) => Promise<void>;
  onToggleTask: (id: string, tasks: Workflow["tasks"], taskId: string) => Promise<void>;
  onUpdateMetric: (id: string, field: "usage_rate" | "adoption_threshold" | "compliance_rate", value: number) => Promise<void>;
}) {
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [owner, setOwner] = useState("");
  const [taskNames, setTaskNames] = useState("");

  // Create/advance change which column a workflow's server-generated id
  // belongs in — simplest correct approach is a full reload rather than
  // reconciling optimistic client state against the real row. Task-toggle
  // and metric edits update in place since those don't move anything
  // between columns.
  const handleCreate = async () => {
    if (!name.trim()) return;
    await onCreate({ name: name.trim(), department: department.trim(), owner: owner.trim(), taskNames: taskNames.split(/[,\n]/) });
    setName("");
    setDepartment("");
    setOwner("");
    setTaskNames("");
    setShowForm(false);
    window.location.reload();
  };

  const handleAdvance = async (id: string, status: Workflow["status"]) => {
    await onAdvance(id, status);
    window.location.reload();
  };

  const handleToggleTask = async (id: string, tasks: Workflow["tasks"], taskId: string) => {
    setWorkflows((prev) => prev.map((w) => (w.id === id ? { ...w, tasks: w.tasks.map((t) => (t.id === taskId ? { ...t, aiAugmented: !t.aiAugmented } : t)) } : w)));
    await onToggleTask(id, tasks, taskId);
  };

  const handleUpdateMetric = async (id: string, field: "usage_rate" | "adoption_threshold" | "compliance_rate", value: number) => {
    const keyMap = { usage_rate: "usageRate", adoption_threshold: "adoptionThreshold", compliance_rate: "complianceRate" } as const;
    setWorkflows((prev) => prev.map((w) => (w.id === id ? { ...w, [keyMap[field]]: value } : w)));
    await onUpdateMetric(id, field, value);
  };

  const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, workflows.filter((w) => w.status === s).length]));
  const inputClass = "w-full px-3 py-2 border border-hud-line text-[13px] text-hud-text bg-hud-panelAlt box-border focus:outline-none focus:border-hud-cyan";

  return (
    <div className="px-10 py-9 font-body">
      <div className="flex justify-between items-start mb-2 flex-wrap gap-3">
        <div>
          <h1 className="text-[28px] font-light text-hud-text mb-1 tracking-tight">Workflow Scale-Up</h1>
          <p className="text-sm text-hud-sub">The &ldquo;dirt path → pave it&rdquo; lifecycle (PRD §2.3)</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="px-4 py-2 bg-hud-cyan/10 border border-hud-cyan text-hud-cyan text-[13px] cursor-pointer">
          + New Workflow
        </button>
      </div>
      <div className="flex gap-6 font-mono text-[10px] text-hud-sub mb-6">
        {STATUS_ORDER.map((s) => (
          <div key={s}>
            {STATUS_LABEL[s].toUpperCase()} <b className="text-hud-cyan">{counts[s]}</b>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-hud-panel border border-hud-line p-6 mb-5 flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Workflow name" />
            <input className={inputClass} value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department" />
            <input className={inputClass} value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Owner" />
          </div>
          <textarea
            className={`${inputClass} resize-y min-h-[70px]`}
            value={taskNames}
            onChange={(e) => setTaskNames(e.target.value)}
            placeholder="Tasks, one per line (e.g. Draft initial proposal)"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-transparent border border-hud-line text-hud-sub text-[13px] cursor-pointer">
              Cancel
            </button>
            <button onClick={handleCreate} className="px-4 py-2 bg-hud-cyan/10 border border-hud-cyan text-hud-cyan text-[13px] cursor-pointer">
              Create Workflow
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3.5">
        {STATUS_ORDER.map((status) => (
          <div key={status} className="bg-hud-panel border border-hud-line">
            <div className="font-mono text-[10px] uppercase tracking-wide text-hud-sub px-3 py-2.5 border-b border-hud-line flex justify-between">
              {STATUS_LABEL[status]} <b className="text-hud-cyan">{counts[status]}</b>
            </div>
            <div className="font-mono text-[8px] text-hud-muted px-3 py-2 border-b border-hud-line uppercase tracking-wide">{STATUS_SUB[status]}</div>
            {workflows
              .filter((w) => w.status === status)
              .map((w) => (
                <WorkflowCard key={w.id} workflow={w} onAdvance={handleAdvance} onToggleTask={handleToggleTask} onUpdateMetric={handleUpdateMetric} />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
