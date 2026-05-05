"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { StarWithPosition } from "@/types";

export interface GuideVector {
  x: number;
  y: number;
  angle: number;
  inView: boolean;
  aligned: boolean;
}

interface Props {
  target: StarWithPosition | null;
  sphereRadius?: number;
  onVector: (vector: GuideVector | null) => void;
}

function edgePoint(dx: number, dy: number, width: number, height: number) {
  const margin = 84;
  const halfW = width / 2 - margin;
  const halfH = height / 2 - margin;
  const scale = Math.min(
    halfW / Math.max(Math.abs(dx), 1),
    halfH / Math.max(Math.abs(dy), 1),
  );
  return {
    x: width / 2 + dx * scale,
    y: height / 2 + dy * scale,
  };
}

export function GuideArrowTracker({ target, sphereRadius = 500, onVector }: Props) {
  const { camera, size } = useThree();
  const lastUpdate = useRef(0);
  const world = useRef(new THREE.Vector3());
  const local = useRef(new THREE.Vector3());
  const projected = useRef(new THREE.Vector3());

  useFrame(({ clock }) => {
    if (!target || target.x === undefined) {
      if (lastUpdate.current !== -1) {
        lastUpdate.current = -1;
        onVector(null);
      }
      return;
    }

    if (lastUpdate.current < 0) lastUpdate.current = 0;
    if (clock.elapsedTime - lastUpdate.current < 0.08) return;
    lastUpdate.current = clock.elapsedTime;

    world.current.set(
      (target.x ?? 0) * sphereRadius,
      (target.y ?? 0) * sphereRadius,
      (target.z ?? 0) * sphereRadius,
    );

    local.current.copy(world.current).applyMatrix4(camera.matrixWorldInverse);
    projected.current.copy(world.current).project(camera);

    const inFront = local.current.z < 0;
    const inView =
      inFront &&
      projected.current.z >= -1 &&
      projected.current.z <= 1 &&
      Math.abs(projected.current.x) <= 0.92 &&
      Math.abs(projected.current.y) <= 0.92;

    let dx: number;
    let dy: number;
    let x: number;
    let y: number;

    if (inFront) {
      x = (projected.current.x * 0.5 + 0.5) * size.width;
      y = (-projected.current.y * 0.5 + 0.5) * size.height;
      dx = x - size.width / 2;
      dy = y - size.height / 2;
    } else {
      dx = -local.current.x;
      dy = local.current.y;
      const edge = edgePoint(dx, dy, size.width, size.height);
      x = edge.x;
      y = edge.y;
    }

    const aligned = inView && Math.hypot(dx, dy) < 48;
    if (!inView) {
      const edge = edgePoint(dx, dy, size.width, size.height);
      x = edge.x;
      y = edge.y;
    }

    onVector({
      x,
      y,
      angle: Math.atan2(dy, dx) * (180 / Math.PI),
      inView,
      aligned,
    });
  });

  return null;
}
