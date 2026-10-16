"use client";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import type { Workflow } from "@/lib/types";
import { Scene } from "@/components/three/Scene";
import { useWebGLAvailable } from "@/components/three/environment";
import { usePrefersReducedMotion } from "@/components/three/usePrefersReducedMotion";

// A compact 3D strip above the real Kanban board: four pipe segments for
// Identified → Augmented → Piloting → Standard, each workflow a node
// parked in its current stage. Nodes don't animate *between* segments —
// advancement is always a manual admin action (PRD §7), never automatic,
// so implying autonomous movement across stages would misrepresent that.
// The gentle bob within a segment is just "alive", not "in transit".

const STATUS_ORDER: Workflow["status"][] = ["identified", "augmented", "piloting", "standard"];
const STATUS_LABEL: Record<Workflow["status"], string> = {
  identified: "Identified",
  augmented: "Augmented",
  piloting: "Piloting",
  standard: "Standard",
};
const STATUS_COLOR: Record<Workflow["status"], string> = {
  identified: "#9FB6BC",
  augmented: "#F0A94E",
  piloting: "#5EE6FF",
  standard: "#7FE0A0",
};

const SEGMENT_WIDTH = 3.4;
const SEGMENT_GAP = 0.35;
const TOTAL_WIDTH = STATUS_ORDER.length * SEGMENT_WIDTH + (STATUS_ORDER.length - 1) * SEGMENT_GAP;

function segmentStartX(index: number) {
  return -TOTAL_WIDTH / 2 + index * (SEGMENT_WIDTH + SEGMENT_GAP);
}

function hash01(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function WorkflowNode({ workflow, baseX, color, reducedMotion }: { workflow: Workflow; baseX: number; color: string; reducedMotion: boolean }) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const phase = useMemo(() => hash01(workflow.id) * Math.PI * 2, [workflow.id]);
  const baseY = useMemo(() => (hash01(workflow.id + "y") - 0.5) * 0.9, [workflow.id]);
  const baseZ = useMemo(() => (hash01(workflow.id + "z") - 0.5) * 1.1, [workflow.id]);

  useFrame(({ clock }) => {
    if (reducedMotion || !meshRef.current) return;
    meshRef.current.position.y = baseY + Math.sin(clock.elapsedTime * 0.8 + phase) * 0.12;
  });

  return (
    <mesh
      ref={meshRef}
      position={[baseX, baseY, baseZ]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.4 : 1}
    >
      <sphereGeometry args={[0.16, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? 1.2 : 0.5} roughness={0.35} />
      {hovered && (
        <Html distanceFactor={8} style={{ pointerEvents: "none" }}>
          <div className="px-2 py-1 bg-hud-panelAlt border border-hud-cyan/40 text-[10px] font-mono text-hud-text whitespace-nowrap -translate-x-1/2 -translate-y-full">
            <div className="font-semibold">{workflow.name}</div>
            <div className="text-hud-muted">{workflow.department ?? "—"}</div>
          </div>
        </Html>
      )}
    </mesh>
  );
}

function PipelineScene({ workflows, reducedMotion }: { workflows: Workflow[]; reducedMotion: boolean }) {
  const nodes = useMemo(() => {
    const perStatusIndex = new Map<string, number>();
    return workflows.map((w) => {
      const idx = STATUS_ORDER.indexOf(w.status);
      const inStage = perStatusIndex.get(w.status) ?? 0;
      perStatusIndex.set(w.status, inStage + 1);
      const spread = (hash01(w.id + "x") - 0.5) * (SEGMENT_WIDTH - 0.6);
      const baseX = segmentStartX(idx) + SEGMENT_WIDTH / 2 + spread;
      return { workflow: w, baseX, color: STATUS_COLOR[w.status] };
    });
  }, [workflows]);

  return (
    <>
      <fog attach="fog" args={["#07090b", 9, 20]} />
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 4, 6]} intensity={1} color="#5EE6FF" />

      {STATUS_ORDER.map((status, i) => {
        const x0 = segmentStartX(i);
        const color = STATUS_COLOR[status];
        return (
          <group key={status}>
            <mesh position={[x0 + SEGMENT_WIDTH / 2, 0, 0]}>
              <boxGeometry args={[SEGMENT_WIDTH, 1.6, 1.8]} />
              <meshStandardMaterial color={color} transparent opacity={0.06} roughness={1} />
            </mesh>
            <lineSegments position={[x0 + SEGMENT_WIDTH / 2, 0, 0]}>
              <edgesGeometry args={[new THREE.BoxGeometry(SEGMENT_WIDTH, 1.6, 1.8)]} />
              <lineBasicMaterial color={color} transparent opacity={0.35} />
            </lineSegments>
            <Html position={[x0 + SEGMENT_WIDTH / 2, -1.25, 0]} center distanceFactor={9} style={{ pointerEvents: "none" }}>
              <div className="font-mono text-[9px] uppercase tracking-wide whitespace-nowrap" style={{ color }}>
                {STATUS_LABEL[status]}
              </div>
            </Html>
          </group>
        );
      })}

      {nodes.map(({ workflow, baseX, color }) => (
        <WorkflowNode key={workflow.id} workflow={workflow} baseX={baseX} color={color} reducedMotion={reducedMotion} />
      ))}

      <OrbitControls
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.35}
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={Math.PI / 2.6}
        enableDamping
        dampingFactor={0.07}
      />
    </>
  );
}

function PipelineFallback({ workflows }: { workflows: Workflow[] }) {
  const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, workflows.filter((w) => w.status === s).length]));
  const max = Math.max(1, ...STATUS_ORDER.map((s) => counts[s]));
  return (
    <div className="flex gap-4 px-6 py-5">
      {STATUS_ORDER.map((s) => (
        <div key={s} className="flex-1">
          <div className="font-mono text-[9px] uppercase tracking-wide mb-1.5" style={{ color: STATUS_COLOR[s] }}>
            {STATUS_LABEL[s]} · {counts[s]}
          </div>
          <div className="h-1.5 bg-hud-line">
            <div className="h-full" style={{ width: `${(counts[s] / max) * 100}%`, background: STATUS_COLOR[s] }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PipelineFlow3D({ workflows, height = 260 }: { workflows: Workflow[]; height?: number }) {
  const reducedMotion = usePrefersReducedMotion();
  const webglAvailable = useWebGLAvailable();

  if (!webglAvailable) {
    return <PipelineFallback workflows={workflows} />;
  }

  return (
    <div style={{ width: "100%", height }}>
      <Scene camera={{ position: [0, 1.5, 9], fov: 48 }}>
        <PipelineScene workflows={workflows} reducedMotion={reducedMotion} />
      </Scene>
    </div>
  );
}
