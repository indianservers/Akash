"use client";
import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export function ManualControls() {
  return (
    <OrbitControls
      enableZoom
      enablePan={false}
      enableDamping
      dampingFactor={0.05}
      rotateSpeed={0.4}
      minDistance={1}
      maxDistance={10}
    />
  );
}
