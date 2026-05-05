"use client";
import { useEffect, useRef, useCallback } from "react";
import { useARStore } from "@/lib/store";

const THROTTLE_MS = 33; // ~30fps

export function useDeviceOrientation() {
  const { setOrientation, orientationPermission } = useARStore();
  const lastUpdate = useRef(0);
  const animFrame = useRef<number>(0);
  const latest = useRef<{ alpha: number | null; beta: number | null; gamma: number | null } | null>(null);

  const flush = useCallback(() => {
    if (latest.current) {
      setOrientation(latest.current);
    }
    animFrame.current = 0;
  }, [setOrientation]);

  useEffect(() => {
    if (orientationPermission !== "granted") return;

    const handler = (e: DeviceOrientationEvent) => {
      const now = Date.now();
      if (now - lastUpdate.current < THROTTLE_MS) return;
      lastUpdate.current = now;

      latest.current = {
        alpha: e.alpha,
        beta: e.beta,
        gamma: e.gamma,
      };

      if (!animFrame.current) {
        animFrame.current = requestAnimationFrame(flush);
      }
    };

    window.addEventListener("deviceorientation", handler, true);
    return () => {
      window.removeEventListener("deviceorientation", handler, true);
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, [orientationPermission, flush]);
}
