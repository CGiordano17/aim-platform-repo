"use client";

import { Canvas, type CanvasProps } from "@react-three/fiber";
import { Suspense, type ReactNode } from "react";

// Shared defaults for every WebGL visualization in the app: capped device
// pixel ratio (full-res 3x retina rendering of a background decoration
// burns battery for no visible gain), a transparent clear color so the
// scene composites over the existing hud-panel/hud-bg CSS rather than
// fighting it, and low-power GPU preference since nothing here is a game.
export function Scene({
  children,
  camera,
  className,
  style,
  ...rest
}: {
  children: ReactNode;
  camera?: { position: [number, number, number]; fov?: number };
  className?: string;
  style?: React.CSSProperties;
} & Omit<CanvasProps, "camera" | "children" | "className" | "style">) {
  return (
    <Canvas
      className={className}
      style={style}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      camera={{ position: camera?.position ?? [0, 0, 8], fov: camera?.fov ?? 45 }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      {...rest}
    >
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
}
