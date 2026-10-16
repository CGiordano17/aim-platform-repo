"use client";

import { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Scene } from "./Scene";
import { useWebGLAvailable } from "./environment";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

// A faint HUD-void — sparse drifting points behind the whole protected app
// shell. Pure decoration: never informational, never interactive, and
// skipped outright (not faked with CSS) when WebGL is unavailable or the
// visitor asked for reduced motion stays mostly still either way — this
// is the one scene where "do nothing" is a perfectly honest fallback,
// unlike the Dashboard curve or the ROI ladder, which carry real data.
function DriftingField({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  // useState's lazy initializer (not useMemo) for the one-time random
  // scatter: React guarantees it runs exactly once per mount, which is the
  // sanctioned escape hatch for impure one-off work — a useMemo callback
  // is expected to stay pure since React may re-invoke or discard it.
  const [positions] = useState(() => {
    const count = 360;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 30;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 18;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
    }
    return arr;
  });

  useFrame((_, delta) => {
    if (reducedMotion || !groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.012;
    groupRef.current.rotation.x += delta * 0.003;
  });

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#5EE6FF" size={0.05} sizeAttenuation transparent opacity={0.35} depthWrite={false} />
      </points>
    </group>
  );
}

export function AppShellBackdrop() {
  const reducedMotion = usePrefersReducedMotion();
  const webglAvailable = useWebGLAvailable();

  if (!webglAvailable) return null;

  return (
    <div className="fixed inset-0" style={{ zIndex: -1, pointerEvents: "none" }} aria-hidden>
      <Scene camera={{ position: [0, 0, 11], fov: 55 }} style={{ width: "100%", height: "100%" }}>
        <fog attach="fog" args={["#07090b", 11, 26]} />
        <ambientLight intensity={0.4} />
        <DriftingField reducedMotion={reducedMotion} />
      </Scene>
    </div>
  );
}
