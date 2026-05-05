"use client";
import { useMemo } from "react";
import * as THREE from "three";
import type { StarWithPosition } from "@/types";

interface Props {
  object: StarWithPosition | null;
  sphereRadius?: number;
}

export function SelectedObjectTrail({ object, sphereRadius = 500 }: Props) {
  const geometry = useMemo(() => {
    if (!object || object.x === undefined) return null;
    const target = new THREE.Vector3(
      (object.x ?? 0) * sphereRadius,
      (object.y ?? 0) * sphereRadius,
      (object.z ?? 0) * sphereRadius,
    );
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 36; i++) {
      const t = i / 36;
      points.push(target.clone().multiplyScalar(t));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [object, sphereRadius]);

  const line = useMemo(() => {
    if (!geometry) return null;
    return new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({
        color: object?.object_kind === "galaxy" ? "#d9c2ff" : "#7eb8f7",
        transparent: true,
        opacity: 0.45,
      }),
    );
  }, [geometry, object?.object_kind]);

  if (!line) return null;
  return <primitive object={line} />;
}
