"use client";

import { useState } from "react";
import type { TransformationGoal, GoalCategory } from "@/lib/types";
import { GOAL_CATEGORY_META } from "@/lib/goal-meta";
import { GoalCard } from "./GoalCard";
import { GoalDetail } from "./GoalDetail";
import { RoiLadder3D } from "./RoiLadder3D";
import { useWebGLAvailable } from "@/components/three/environment";

// Board groups by category (columns, PRD §2.4's 4 categories) with tiers
// stacked bottom-to-top within each column, mirroring
// design/active/roi-ladder.html and the phase-2 prototype implementation.
// currentValue edits go straight to Supabase via a server action — no more
// window.storage now that phase 5's real backend exists.
export function TransformationGoalsBoard({
  initialGoals,
  onUpdateCurrentValue,
  onLogReview,
}: {
  initialGoals: TransformationGoal[];
  onUpdateCurrentValue: (id: string, value: string) => Promise<void>;
  onLogReview: (goalId: string, note: string, flagged: boolean) => Promise<void>;
}) {
  const [goals, setGoals] = useState(initialGoals);
  const [detailGoal, setDetailGoal] = useState<TransformationGoal | null>(null);
  const categories = Object.keys(GOAL_CATEGORY_META) as GoalCategory[];

  // webglAvailable starts false (matching the server-rendered HTML) and
  // becomes true after React confirms hydration, via useSyncExternalStore
  // rather than an effect+setState — no hydration mismatch, no extra
  // render pass. userView is null until the visitor clicks a toggle
  // button; the actual displayed view is derived from both rather than
  // set by an effect, which is what keeps this a plain render instead of
  // a setState-during-effect.
  const webglAvailable = useWebGLAvailable();
  const [userView, setUserView] = useState<"list" | "3d" | null>(null);
  const view = userView ?? (webglAvailable ? "3d" : "list");

  const handleUpdate = (id: string, value: string) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, currentValue: value } : g)));
    onUpdateCurrentValue(id, value).catch((err) => {
      console.error("Failed to save currentValue", err);
    });
  };

  return (
    <div className="bg-hud-bg min-h-screen px-10 py-8">
      <div className="mb-6 flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-[18px] text-hud-text mb-2 tracking-wide">ROI Measurability Ladder</h1>
          <p className="font-mono text-[10px] text-hud-muted max-w-[680px] leading-relaxed">
            Organized bottom to top by what it takes to capture the data — self-reported signals at the base, deep system
            integration at the top. Current value is editable by hand for every tier until live sync comes online in later
            build phases (Nudges, Integrations).
            {view === "3d" && " Drag to orbit, scroll to zoom, click a node to open it."}
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={() => setUserView("3d")}
            disabled={!webglAvailable}
            title={webglAvailable ? undefined : "WebGL isn't available in this browser — showing the list view instead."}
            className="font-mono text-[9px] uppercase px-2.5 py-1.5 border tracking-wide disabled:opacity-30 disabled:cursor-not-allowed"
            style={view === "3d" ? { borderColor: "#5EE6FF", color: "#5EE6FF" } : { borderColor: "rgba(94,230,255,0.12)", color: "#9FB6BC" }}
          >
            3D Ladder
          </button>
          <button
            onClick={() => setUserView("list")}
            className="font-mono text-[9px] uppercase px-2.5 py-1.5 border tracking-wide"
            style={view === "list" ? { borderColor: "#5EE6FF", color: "#5EE6FF" } : { borderColor: "rgba(94,230,255,0.12)", color: "#9FB6BC" }}
          >
            List
          </button>
        </div>
      </div>

      {/* Mounted once WebGL is confirmed available, then kept mounted and
          toggled with CSS display rather than conditionally rendered —
          @react-three/drei's <Html> portals don't unmount cleanly from
          inside a Canvas tree torn down by React itself (confirmed via a
          local repro: real "removeChild" DOM errors on every toggle), so
          switching views never actually unmounts the Canvas. */}
      {webglAvailable && (
        <div className="border border-hud-line mb-4" style={{ display: view === "3d" ? "block" : "none" }}>
          <RoiLadder3D goals={goals} onSelect={setDetailGoal} />
        </div>
      )}
      {view === "list" && (
        <>
          <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}>
            {categories.map((catKey) => {
              const cat = GOAL_CATEGORY_META[catKey];
              return (
                <div
                  key={catKey}
                  className="text-center p-2 font-mono text-[10px] tracking-wide uppercase"
                  style={{ borderBottom: `2px solid ${cat.color}`, color: cat.color }}
                >
                  {cat.name}
                  <div className="text-[8px] text-hud-muted mt-0.5 normal-case tracking-normal">{cat.owner}</div>
                </div>
              );
            })}
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}>
            {categories.map((catKey) => (
              <div key={catKey}>
                {goals
                  .filter((g) => g.category === catKey)
                  .sort((a, b) => b.tier - a.tier)
                  .map((g) => (
                    <GoalCard key={g.id} goal={g} onUpdateCurrentValue={handleUpdate} onOpenDetail={setDetailGoal} />
                  ))}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="font-mono text-[8.5px] text-hud-muted text-center mt-4 mb-1 tracking-wide">
        Note: the original 16+ methods were deliberately built to avoid self-report — the Tier 0 cards above are the
        honest exception, not a pattern to extend elsewhere in the ladder.
      </div>
      {detailGoal && <GoalDetail goal={detailGoal} onClose={() => setDetailGoal(null)} onLogReview={onLogReview} />}
    </div>
  );
}
