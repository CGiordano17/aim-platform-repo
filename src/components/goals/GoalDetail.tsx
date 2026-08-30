"use client";

import type { TransformationGoal } from "@/lib/types";
import { GOAL_CATEGORY_META, GOAL_TIER_META, GOAL_MATURITY_META } from "@/lib/goal-meta";
import { GoalStatement } from "./GoalStatement";

export function GoalDetail({ goal, onClose }: { goal: TransformationGoal; onClose: () => void }) {
  const cat = GOAL_CATEGORY_META[goal.category];
  const tier = GOAL_TIER_META[goal.tier];

  return (
    <div className="fixed inset-0 bg-[rgba(3,5,7,0.75)] flex items-center justify-center z-[100] p-5">
      <div className="bg-hud-panelAlt border border-hud-cyan max-w-[620px] w-full max-h-[85vh] overflow-y-auto p-7 font-body">
        <button
          onClick={onClose}
          className="float-right border border-hud-line text-hud-sub font-mono text-[10px] px-2.5 py-1 hover:border-hud-cyan hover:text-hud-cyan"
        >
          Close
        </button>
        <h2 className="text-[18px] text-hud-text mb-2">{goal.title}</h2>
        <GoalStatement statement={goal.statement} />
        {goal.measures && <div className="font-mono text-[10px] text-hud-muted my-3">Measures: &ldquo;{goal.measures}&rdquo;</div>}
        {goal.roiExample && <div className="text-[12px] italic text-hud-sub mb-4 leading-relaxed">&ldquo;{goal.roiExample}&rdquo;</div>}
        <div className="flex gap-2 flex-wrap mb-4">
          <span className="font-mono text-[9px] uppercase px-2.5 py-1 border" style={{ color: cat.color, borderColor: cat.color }}>
            {cat.name}
          </span>
          <span className="font-mono text-[9px] uppercase px-2.5 py-1 border" style={{ color: tier.color, borderColor: tier.color }}>
            Tier {goal.tier} · {tier.name}
          </span>
          <span className="font-mono text-[9px] uppercase px-2.5 py-1 border border-hud-line text-hud-sub">
            GA: {GOAL_MATURITY_META[goal.maturity]}
          </span>
        </div>
        {goal.vendorSources && goal.vendorSources.length > 0 && (
          <>
            <div className="font-mono text-[10px] text-hud-muted uppercase mb-2">Where this data lives in your stack</div>
            <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))" }}>
              {goal.vendorSources.map((v) => (
                <div key={v.name} className="bg-[#0d1318] border border-hud-line px-2.5 py-2">
                  <div className="text-[11.5px] font-semibold text-hud-text mb-1">{v.name}</div>
                  <div className="text-[10.5px] text-hud-sub leading-relaxed">{v.notes}</div>
                </div>
              ))}
            </div>
          </>
        )}
        {goal.implementationSteps && goal.implementationSteps.length > 0 && (
          <>
            <div className="font-mono text-[10px] text-hud-muted uppercase mb-2">Implementation steps</div>
            {goal.implementationSteps.map((s, i) => (
              <div
                key={s.title}
                className="flex gap-2.5 py-2.5"
                style={{ borderBottom: i < goal.implementationSteps!.length - 1 ? "1px solid rgba(94,230,255,0.12)" : "none" }}
              >
                <div className="w-[22px] h-[22px] rounded-full border border-hud-cyan text-hud-cyan flex items-center justify-center font-mono text-[11px] shrink-0">
                  {i + 1}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-hud-text">{s.title}</div>
                  <div className="text-[11.5px] text-hud-sub mt-0.5 leading-relaxed">{s.detail}</div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
