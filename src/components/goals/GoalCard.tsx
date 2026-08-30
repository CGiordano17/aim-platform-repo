"use client";

import { useState, useTransition } from "react";
import type { TransformationGoal } from "@/lib/types";
import { GOAL_TIER_META, GOAL_MATURITY_META } from "@/lib/goal-meta";
import { GoalStatement } from "./GoalStatement";

export function GoalCard({
  goal,
  onUpdateCurrentValue,
  onOpenDetail,
}: {
  goal: TransformationGoal;
  onUpdateCurrentValue: (id: string, value: string) => void;
  onOpenDetail: (goal: TransformationGoal) => void;
}) {
  const tier = GOAL_TIER_META[goal.tier];
  const [value, setValue] = useState(goal.currentValue ?? "");
  const [isPending, startTransition] = useTransition();

  const commit = () => {
    if (value === (goal.currentValue ?? "")) return;
    startTransition(() => onUpdateCurrentValue(goal.id, value));
  };

  return (
    <div
      className="bg-hud-panel border border-hud-line mb-2 px-3.5 py-3 font-body"
      style={{ borderLeftWidth: 3, borderLeftColor: tier.color }}
    >
      <div className="text-[14px] font-bold text-hud-text mb-1.5">{goal.title}</div>
      <GoalStatement statement={goal.statement} />
      <div className="flex gap-1.5 flex-wrap mt-2.5">
        <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 border" style={{ color: tier.color, borderColor: tier.color }}>
          Tier {goal.tier} · {tier.name}
        </span>
        <span className="font-mono text-[8px] uppercase text-hud-muted px-1.5 py-0.5 border border-hud-muted">
          GA: {GOAL_MATURITY_META[goal.maturity]}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-hud-line">
        <label className="font-mono text-[8px] text-hud-muted uppercase">Current</label>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          placeholder="—"
          disabled={isPending}
          className="flex-1 min-w-0 bg-hud-panelAlt border border-hud-line text-hud-text px-2 py-1 font-mono text-[11px] focus:outline-none focus:border-hud-cyan"
        />
        <button
          onClick={() => onOpenDetail(goal)}
          className="shrink-0 border border-hud-line text-hud-sub font-mono text-[9px] uppercase px-2.5 py-1 hover:border-hud-cyan hover:text-hud-cyan"
        >
          Detail
        </button>
      </div>
    </div>
  );
}
