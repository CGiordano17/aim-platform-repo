// Shared capability checks for every WebGL/three.js visualization in the
// app. Nothing here is theoretical: enterprise-managed devices routinely
// disable WebGL via group policy, and browsers honor prefers-reduced-motion
// for accessibility — every 3D component in this app must degrade to a real
// working 2D equivalent rather than a blank panel in either case.

import { useSyncExternalStore } from "react";

export function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

const noopSubscribe = () => () => {};

// useSyncExternalStore (not useEffect+useState) is the React-sanctioned way
// to read a value that can differ between server and client render: it
// returns getServerSnapshot's value (false) for the server/first-client-pass
// render so hydration never mismatches, then re-renders with the real
// client value once React confirms hydration is done — no manual "flip
// after mount" effect, and no react-hooks/set-state-in-effect lint error.
export function useWebGLAvailable(): boolean {
  return useSyncExternalStore(noopSubscribe, isWebGLAvailable, () => false);
}
