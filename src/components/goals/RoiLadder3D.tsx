"use client";

import { useMemo, useState } from "react";
import { OrbitControls, Html, Line } from "@react-three/drei";
import type { TransformationGoal, GoalCategory } from "@/lib/types";
import { GOAL_CATEGORY_META, GOAL_TIER_META } from "@/lib/goal-meta";
import { Scene } from "@/components/three/Scene";

// The ROI Measurability Ladder (PRD §2.4) as an actual navigable 3D
// structure: categories as vertical rails (X axis), tiers as rungs rising
// from self-report at the base to deep integration at the top (Y axis) —
// matching the flat board's own bottom-to-top framing, just literalized.
// Each goal is a node at its (category, tier) position; click opens the
// same <GoalDetail> the flat board uses, so this is a real second way to
// browse real data, not a decorative replacement for it.

const CATEGORY_ORDER: GoalCategory[] = ["productivity", "quality", "revenue", "capability"];
const X_SPACING = 3.2;
const Y_PER_TIER = 1.8;
const Y_BASE = -2.4;

function categoryX(cat: GoalCategory) {
  const i = CATEGORY_ORDER.indexOf(cat);
  return (i - (CATEGORY_ORDER.length - 1) / 2) * X_SPACING;
}
function tierY(tier: number) {
  return Y_BASE + tier * Y_PER_TIER;
}

function hash01(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function GoalNode({ goal, position, onSelect }: { goal: TransformationGoal; position: [number, number, number]; onSelect: (goal: TransformationGoal) => void }) {
  const [hovered, setHovered] = useState(false);
  const color = GOAL_CATEGORY_META[goal.category].color;

  return (
    <mesh
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(goal);
      }}
      scale={hovered ? 1.35 : 1}
    >
      <octahedronGeometry args={[0.32, 0]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? 1.1 : 0.45} roughness={0.3} metalness={0.25} />
      {hovered && (
        <Html distanceFactor={9} style={{ pointerEvents: "none" }}>
          <div className="px-2.5 py-1.5 bg-hud-panelAlt border border-hud-cyan/40 text-[10px] font-mono text-hud-text whitespace-nowrap -translate-x-1/2 -translate-y-full max-w-[220px]">
            <div className="font-semibold mb-0.5">{goal.title}</div>
            <div className="text-hud-muted">
              Tier {goal.tier} · {GOAL_CATEGORY_META[goal.category].name}
            </div>
          </div>
        </Html>
      )}
    </mesh>
  );
}

function LadderStructure({ goals, onSelect }: { goals: TransformationGoal[]; onSelect: (goal: TransformationGoal) => void }) {
  const width = (CATEGORY_ORDER.length - 1) * X_SPACING;

  // Multiple goals can land in the same (category, tier) cell — stack them
  // with a small deterministic offset instead of overlapping exactly.
  const positioned = useMemo(() => {
    const cellCounts = new Map<string, number>();
    return goals.map((g) => {
      const key = `${g.category}-${g.tier}`;
      const indexInCell = cellCounts.get(key) ?? 0;
      cellCounts.set(key, indexInCell + 1);
      const jx = (hash01(g.id + "x") - 0.5) * 0.9;
      const jz = indexInCell * 0.75 + (hash01(g.id + "z") - 0.5) * 0.3;
      return { goal: g, position: [categoryX(g.category) + jx, tierY(g.tier), jz] as [number, number, number] };
    });
  }, [goals]);

  return (
    <>
      <fog attach="fog" args={["#07090b", 9, 22]} />
      <ambientLight intensity={0.6} />
      <pointLight position={[4, 5, 6]} intensity={1.1} color="#5EE6FF" />
      <pointLight position={[-4, -1, 5]} intensity={0.5} color="#F0A94E" />

      {/* Category rails */}
      {CATEGORY_ORDER.map((cat) => {
        const meta = GOAL_CATEGORY_META[cat];
        const x = categoryX(cat);
        return (
          <group key={cat}>
            <Line points={[[x, Y_BASE - 0.6, 0], [x, tierY(3) + 0.9, 0]]} color={meta.color} transparent opacity={0.3} lineWidth={1} />
            <Html position={[x, Y_BASE - 1.1, 0]} center distanceFactor={9} style={{ pointerEvents: "none" }}>
              <div className="font-mono text-[9px] uppercase tracking-wide whitespace-nowrap" style={{ color: meta.color }}>
                {meta.name}
              </div>
            </Html>
          </group>
        );
      })}

      {/* Tier rungs */}
      {GOAL_TIER_META.map((tier, i) => (
        <group key={i}>
          <Line
            points={[[-width / 2 - 0.9, tierY(i), 0], [width / 2 + 0.9, tierY(i), 0]]}
            color={tier.color}
            transparent
            opacity={0.22}
            lineWidth={1}
          />
          <Html position={[-width / 2 - 1.6, tierY(i), 0]} center distanceFactor={9} style={{ pointerEvents: "none" }}>
            <div className="font-mono text-[9px] uppercase tracking-wide whitespace-nowrap" style={{ color: tier.color }}>
              T{i} · {tier.name}
            </div>
          </Html>
        </group>
      ))}

      {positioned.map(({ goal, position }) => (
        <GoalNode key={goal.id} goal={goal} position={position} onSelect={onSelect} />
      ))}

      <OrbitControls enableDamping dampingFactor={0.08} minDistance={5} maxDistance={20} />
    </>
  );
}

export function RoiLadder3D({
  goals,
  onSelect,
  height = 460,
}: {
  goals: TransformationGoal[];
  onSelect: (goal: TransformationGoal) => void;
  height?: number;
}) {
  return (
    <div style={{ width: "100%", height }}>
      <Scene camera={{ position: [6, 2.5, 11], fov: 48 }}>
        <LadderStructure goals={goals} onSelect={onSelect} />
      </Scene>
    </div>
  );
}
