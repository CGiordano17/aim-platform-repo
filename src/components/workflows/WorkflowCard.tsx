"use client";

import { useState, useTransition } from "react";
import type { Workflow } from "@/lib/types";

const STATUS_LABEL: Record<Workflow["status"], string> = {
  identified: "Identified",
  augmented: "Augmented",
  piloting: "Piloting",
  standard: "Standard",
};
const NEXT_LABEL: Record<Workflow["status"], string | null> = {
  identified: "Advance to Augmented →",
  augmented: "Advance to Piloting →",
  piloting: "Advance to Standard →",
  standard: null,
};

export function WorkflowCard({
  workflow,
  onAdvance,
  onToggleTask,
  onUpdateMetric,
}: {
  workflow: Workflow;
  onAdvance: (id: string, status: Workflow["status"]) => Promise<void>;
  onToggleTask: (id: string, tasks: Workflow["tasks"], taskId: string) => Promise<void>;
  onUpdateMetric: (id: string, field: "usage_rate" | "adoption_threshold" | "compliance_rate", value: number) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const augmentedCount = workflow.tasks.filter((t) => t.aiAugmented).length;

  return (
    <div className="mx-2.5 my-2.5 px-3 py-2.5 border border-hud-line bg-[rgba(94,230,255,0.02)]">
      <div className="text-[13px] font-semibold text-hud-text mb-0.5">{workflow.name}</div>
      <div className="font-mono text-[8.5px] text-hud-sub uppercase tracking-wide mb-2">{workflow.department ?? "—"}</div>

      {workflow.status === "identified" && (
        <div className="font-mono text-[9px] text-hud-sub mb-2">
          <span className="text-hud-cyan font-semibold">{workflow.tasks.length}</span> tasks identified
        </div>
      )}

      {workflow.status === "augmented" && (
        <div className="mb-2">
          <button onClick={() => setExpanded((e) => !e)} className="font-mono text-[9px] text-hud-sub bg-transparent border-none cursor-pointer p-0 underline">
            <span className="text-hud-cyan font-semibold">{augmentedCount}</span> of {workflow.tasks.length} tasks augmented
          </button>
          {expanded && (
            <div className="mt-2 flex flex-col gap-1">
              {workflow.tasks.map((t) => (
                <label key={t.id} className="flex items-center gap-1.5 text-[10px] text-hud-sub cursor-pointer">
                  <input
                    type="checkbox"
                    checked={t.aiAugmented}
                    onChange={() => startTransition(() => onToggleTask(workflow.id, workflow.tasks, t.id))}
                  />
                  {t.name}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {workflow.status === "piloting" && (
        <PilotingMetrics workflow={workflow} onUpdateMetric={onUpdateMetric} isPending={isPending} />
      )}

      {workflow.status === "standard" && <StandardMetrics workflow={workflow} onUpdateMetric={onUpdateMetric} isPending={isPending} />}

      {NEXT_LABEL[workflow.status] && (
        <button
          onClick={() => startTransition(() => onAdvance(workflow.id, workflow.status))}
          disabled={isPending}
          className="mt-2 w-full py-1.5 bg-hud-cyan/10 border border-hud-cyan text-hud-cyan font-mono text-[9px] uppercase cursor-pointer"
        >
          {NEXT_LABEL[workflow.status]}
        </button>
      )}
      {workflow.status === "standard" && workflow.dateScaled && (
        <div className="font-mono text-[8px] text-hud-amber mt-1.5">Required since {workflow.dateScaled}</div>
      )}
    </div>
  );
}

function PilotingMetrics({
  workflow,
  onUpdateMetric,
  isPending,
}: {
  workflow: Workflow;
  onUpdateMetric: (id: string, field: "usage_rate" | "adoption_threshold" | "compliance_rate", value: number) => Promise<void>;
  isPending: boolean;
}) {
  const usage = workflow.usageRate ?? 0;
  const threshold = workflow.adoptionThreshold ?? 60;
  return (
    <div className="mb-2">
      <div className="font-mono text-[9px] text-hud-sub mb-1">
        Usage vs. <span className="text-hud-amber">{threshold}%</span> threshold
      </div>
      <div className="h-1 bg-hud-line relative mb-1">
        <div className="absolute left-0 top-0 h-full bg-hud-cyan" style={{ width: `${Math.min(usage, 100)}%` }} />
        <div className="absolute top-[-3px] w-px h-2.5 bg-hud-amber" style={{ left: `${threshold}%` }} />
      </div>
      <div className="flex justify-between items-center gap-2 font-mono text-[8.5px] text-hud-sub">
        <input
          type="number"
          min={0}
          max={100}
          defaultValue={usage}
          disabled={isPending}
          onBlur={(e) => onUpdateMetric(workflow.id, "usage_rate", Number(e.target.value))}
          className="w-14 bg-hud-panelAlt border border-hud-line text-hud-text px-1.5 py-0.5 text-[10px]"
        />
        <span>current %</span>
        <input
          type="number"
          min={0}
          max={100}
          defaultValue={threshold}
          disabled={isPending}
          onBlur={(e) => onUpdateMetric(workflow.id, "adoption_threshold", Number(e.target.value))}
          className="w-14 bg-hud-panelAlt border border-hud-line text-hud-text px-1.5 py-0.5 text-[10px]"
        />
        <span>threshold %</span>
      </div>
    </div>
  );
}

function StandardMetrics({
  workflow,
  onUpdateMetric,
  isPending,
}: {
  workflow: Workflow;
  onUpdateMetric: (id: string, field: "usage_rate" | "adoption_threshold" | "compliance_rate", value: number) => Promise<void>;
  isPending: boolean;
}) {
  const compliance = workflow.complianceRate ?? 0;
  return (
    <div className="mb-2">
      <div className="font-mono text-[9px] text-hud-sub mb-1">Compliance</div>
      <div className="h-1 bg-hud-line relative mb-1">
        <div className="absolute left-0 top-0 h-full bg-hud-cyan" style={{ width: `${Math.min(compliance, 100)}%` }} />
      </div>
      <div className="flex items-center gap-2 font-mono text-[8.5px] text-hud-sub">
        <input
          type="number"
          min={0}
          max={100}
          defaultValue={compliance}
          disabled={isPending}
          onBlur={(e) => onUpdateMetric(workflow.id, "compliance_rate", Number(e.target.value))}
          className="w-14 bg-hud-panelAlt border border-hud-line text-hud-text px-1.5 py-0.5 text-[10px]"
        />
        <span>%</span>
      </div>
    </div>
  );
}

export { STATUS_LABEL };
