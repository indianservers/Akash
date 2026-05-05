"use client";
import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useARStore } from "@/lib/store";

const DEG = Math.PI / 180;

export function ARCamera() {
  const { camera } = useThree();
  const { orientation, isARMode } = useARStore();
  const euler = useRef(new THREE.Euler(0, 0, 0, "YXZ"));
  const quat = useRef(new THREE.Quaternion());
  const screenQuat = useRef(
    new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5))
  );

  useFrame(() => {
    if (!isARMode || !orientation) return;

    const { alpha, beta, gamma } = orientation;
    if (alpha === null || beta === null || gamma === null) return;

    // Convert device Euler angles to Three.js camera orientation
    // DeviceOrientation: Z (alpha), X (beta), Y (gamma)
    euler.current.set(
      beta * DEG,
      alpha * DEG,
      -gamma * DEG,
      "YXZ"
    );

    quat.current.setFromEuler(euler.current);
    quat.current.multiply(screenQuat.current);

    camera.quaternion.copy(quat.current);
    camera.updateMatrixWorld();
  });

  return null;
}
