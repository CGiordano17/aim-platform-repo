"use client";

import { useMemo, useState } from "react";
import * as THREE from "three";
import { OrbitControls, Html } from "@react-three/drei";
import type { Respondent } from "@/lib/types";
import { SEGMENT_META, type Segment } from "@/lib/scoring";
import { Scene } from "@/components/three/Scene";
import { useWebGLAvailable } from "@/components/three/environment";
import { usePrefersReducedMotion } from "@/components/three/usePrefersReducedMotion";
import { AdoptionCurve, curvePoints, SEGMENT_ORDER } from "@/components/shared/AdoptionCurve";

// The signature visualization (PRD §5), reimagined in WebGL: the exact
// same Rogers-curve math as the 2D AdoptionCurve (imported, not
// re-derived), extruded into a ribbon with each respondent rendered as a
// particle floating near their segment, scattered in depth so a crowded
// segment reads as a cluster instead of a stack of overlapping dots.
//
// Falls back to the real 2D <AdoptionCurve> — not a blank panel — when
// WebGL genuinely isn't available (enterprise devices routinely disable it
// via group policy). prefers-reduced-motion disables the camera's idle
// auto-rotate but keeps the 3D scene itself, since a static 3D render
// isn't the kind of motion that setting is about.

const CURVE_WIDTH = 10;
const CURVE_HEIGHT_SCALE = 2.4;
const BASELINE_Y = -1.1;

function sceneX(xFrac: number) {
  return (xFrac - 0.5) * CURVE_WIDTH;
}
function sceneY(xFrac: number) {
  return curvePoints(xFrac) * CURVE_HEIGHT_SCALE + BASELINE_Y;
}

// Deterministic per-respondent jitter (stable across re-renders) so a
// crowded segment scatters into a readable cluster instead of either a
// perfect stack or re-randomizing every render.
function hash01(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

const SEGMENT_STOPS = SEGMENT_ORDER.map((seg, i) => ({
  t: i / (SEGMENT_ORDER.length - 1),
  color: new THREE.Color(SEGMENT_META[seg].color),
}));

function colorForXFrac(xFrac: number): THREE.Color {
  const t = Math.min(1, Math.max(0, xFrac));
  for (let i = 0; i < SEGMENT_STOPS.length - 1; i++) {
    const a = SEGMENT_STOPS[i];
    const b = SEGMENT_STOPS[i + 1];
    if (t >= a.t && t <= b.t) {
      const localT = (t - a.t) / (b.t - a.t);
      return a.color.clone().lerp(b.color, localT);
    }
  }
  return SEGMENT_STOPS[SEGMENT_STOPS.length - 1].color.clone();
}

function useRibbonGeometry() {
  return useMemo(() => {
    const points: THREE.Vector3[] = [];
    const samples = 120;
    for (let i = 0; i <= samples; i++) {
      const x = i / samples;
      points.push(new THREE.Vector3(sceneX(x), sceneY(x), 0));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, 160, 0.045, 12, false);

    const posAttr = geometry.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);
    for (let i = 0; i < posAttr.count; i++) {
      const xFrac = (posAttr.getX(i) + CURVE_WIDTH / 2) / CURVE_WIDTH;
      const c = colorForXFrac(xFrac);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geometry;
  }, []);
}

interface ParticleDatum {
  id: string;
  isPost: boolean;
  position: [number, number, number];
  color: string;
  label: string;
}

function Particle({ datum }: { datum: ParticleDatum }) {
  const [hovered, setHovered] = useState(false);
  return (
    <mesh
      position={datum.position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[datum.isPost ? 0.075 : 0.06, 12, 12]} />
      <meshStandardMaterial
        color={datum.isPost ? datum.color : "#07090B"}
        emissive={datum.color}
        emissiveIntensity={hovered ? 1.4 : datum.isPost ? 0.55 : 0.25}
        roughness={0.35}
      />
      {hovered && (
        <Html distanceFactor={8} style={{ pointerEvents: "none" }}>
          <div className="px-2 py-1 bg-hud-panelAlt border border-hud-cyan/40 text-[10px] font-mono text-hud-text whitespace-nowrap -translate-x-1/2 -translate-y-full">
            {datum.label}
          </div>
        </Html>
      )}
    </mesh>
  );
}

function RibbonScene({
  respondents,
  showPost,
  reducedMotion,
}: {
  respondents: Pick<Respondent, "id" | "preSegment" | "postSegment">[];
  showPost: boolean;
  reducedMotion: boolean;
}) {
  const ribbonGeometry = useRibbonGeometry();

  const particles = useMemo(() => {
    const result: ParticleDatum[] = [];
    respondents.forEach((r) => {
      if (!r.preSegment) return;
      const pushParticle = (seg: Segment, isPost: boolean) => {
        const xFrac = SEGMENT_META[seg].x / 100;
        const jx = (hash01(r.id + seg + "x") - 0.5) * 0.9;
        const jy = hash01(r.id + seg + "y") * 0.55 + 0.2;
        const jz = (hash01(r.id + seg + "z") - 0.5) * 1.6 + (isPost ? 0.9 : 0);
        result.push({
          id: `${r.id}-${isPost ? "post" : "pre"}`,
          isPost,
          position: [sceneX(xFrac) + jx, sceneY(xFrac) + jy, jz],
          color: SEGMENT_META[seg].color,
          label: `${isPost ? "Post" : "Pre"}: ${SEGMENT_META[seg].label}`,
        });
      };
      // preSegment/postSegment are typed string | null on Respondent (DB-sourced,
      // same as the 2D AdoptionCurve's untyped Record<string, ...> lookup) —
      // cast here since this scene indexes SEGMENT_META, which wants the union.
      pushParticle(r.preSegment as Segment, false);
      if (showPost && r.postSegment) pushParticle(r.postSegment as Segment, true);
    });
    return result;
  }, [respondents, showPost]);

  return (
    <>
      <fog attach="fog" args={["#07090b", 7, 17]} />
      <ambientLight intensity={0.65} />
      <pointLight position={[3, 2.5, 5]} intensity={1.3} color="#5EE6FF" />
      <pointLight position={[-3, -1, 4]} intensity={0.55} color="#F0A94E" />
      <mesh geometry={ribbonGeometry}>
        <meshStandardMaterial vertexColors transparent opacity={0.85} roughness={0.4} metalness={0.15} emissiveIntensity={0.2} />
      </mesh>
      {particles.map((p) => (
        <Particle key={p.id} datum={p} />
      ))}
      <OrbitControls
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.5}
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI / 2.05}
        minPolarAngle={Math.PI / 2.7}
        enableDamping
        dampingFactor={0.06}
      />
    </>
  );
}

export function AdoptionCurve3D({
  respondents,
  showPost = false,
  height = 280,
}: {
  respondents: Pick<Respondent, "id" | "preSegment" | "postSegment">[];
  showPost?: boolean;
  height?: number;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const webglAvailable = useWebGLAvailable();

  if (!webglAvailable) {
    return <AdoptionCurve respondents={respondents} showPost={showPost} height={height} />;
  }

  return (
    <div style={{ width: "100%", height }}>
      <Scene camera={{ position: [0, 0.4, 6.5], fov: 48 }}>
        <RibbonScene respondents={respondents} showPost={showPost} reducedMotion={reducedMotion} />
      </Scene>
    </div>
  );
}
