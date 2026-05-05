"use client";
import { useEffect, useRef, useCallback } from "react";
import { useARStore } from "@/lib/store";
import type { StarWithPosition } from "@/types";
import type { WorkerInput, WorkerOutput } from "@/workers/astronomy.worker";

const UPDATE_INTERVAL_MS = 5000; // recalculate every 5s

export function useStarPositions(stars: StarWithPosition[], timestamp: number = Date.now()) {
  const { location, setVisibleStars } = useARStore();
  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const starsRef = useRef(stars);
  starsRef.current = stars;

  const calculate = useCallback(() => {
    if (!workerRef.current || !location || starsRef.current.length === 0) return;

    const input: WorkerInput = {
      stars: starsRef.current.map((s) => ({
        id: s.id,
        ra: s.ra,
        dec: s.dec,
        ra_unit: s.ra_unit,
        magnitude: s.magnitude,
      })),
      lat: location.lat,
      lon: location.lon,
      timestamp,
    };

    workerRef.current.postMessage(input);
  }, [location, timestamp]);

  useEffect(() => {
    if (typeof Worker === "undefined") return;

    workerRef.current = new Worker(
      new URL("../workers/astronomy.worker.ts", import.meta.url),
      { type: "module" }
    );

    workerRef.current.onmessage = (e: MessageEvent<WorkerOutput>) => {
      const { positions } = e.data;
      const posMap = new Map(positions.map((p) => [p.id, p]));

      const updated = starsRef.current.map((star) => {
        const pos = posMap.get(star.id);
        if (!pos) return star;
        return {
          ...star,
          altitude: pos.altitude,
          azimuth: pos.azimuth,
          x: pos.x,
          y: pos.y,
          z: pos.z,
          is_visible: pos.is_visible,
        };
      });

      setVisibleStars(updated);
    };

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [setVisibleStars]);

  useEffect(() => {
    if (!location) return;
    calculate();
    timerRef.current = setInterval(calculate, UPDATE_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [location, calculate, timestamp]);

  // Recalculate immediately when catalog stars arrive (large count jump)
  const prevCountRef = useRef(0);
  useEffect(() => {
    if (stars.length - prevCountRef.current > 100) {
      prevCountRef.current = stars.length;
      calculate();
    }
  }, [stars.length, calculate]);
}
