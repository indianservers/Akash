"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { StarWithPosition } from "@/types";

interface Props {
  galaxies: StarWithPosition[];
  selectedObjectId?: number | null;
  sphereRadius?: number;
}

function makeGalaxyTexture(type: string | undefined): THREE.Texture {
  const size = 192;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const center = size / 2;
  const isElliptical = type?.includes("Elliptical") || type?.includes("Lenticular");
  const isIrregular = type?.includes("Irregular");

  ctx.translate(center, center);
  ctx.rotate(isIrregular ? -0.45 : 0.35);
  ctx.scale(isElliptical ? 1.45 : 1.85, isElliptical ? 0.85 : 0.55);

  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, center * 0.62);
  glow.addColorStop(0, "rgba(255,245,220,0.95)");
  glow.addColorStop(0.22, "rgba(217,194,255,0.68)");
  glow.addColorStop(0.62, "rgba(126,184,247,0.16)");
  glow.addColorStop(1, "rgba(2,3,8,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, center * 0.62, 0, Math.PI * 2);
  ctx.fill();

  if (!isElliptical) {
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 2;
    for (let arm = 0; arm < 2; arm++) {
      ctx.beginPath();
      for (let i = 0; i < 80; i++) {
        const t = i / 79;
        const angle = arm * Math.PI + t * Math.PI * 1.6;
        const r = 8 + t * center * 0.46;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r * 0.5;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function scaleFor(galaxy: StarWithPosition): number {
  const magnitude = galaxy.magnitude ?? 9;
  return Math.max(14, Math.min(42, 46 - magnitude * 3));
}

export function GalaxyField({ galaxies, selectedObjectId, sphereRadius = 500 }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const textures = useMemo(() => {
    const map = new Map<string, THREE.Texture>();
    for (const galaxy of galaxies) {
      const key = galaxy.star_type;
      if (!map.has(key)) map.set(key, makeGalaxyTexture(key));
    }
    return map;
  }, [galaxies]);

  const visibleGalaxies = useMemo(
    () => galaxies.filter((galaxy) => galaxy.x !== undefined),
    [galaxies],
  );

  useFrame(({ camera }) => {
    groupRef.current?.children.forEach((child) => {
      child.quaternion.copy(camera.quaternion);
    });
  });

  return (
    <group ref={groupRef}>
      {visibleGalaxies.map((galaxy) => {
        const size = scaleFor(galaxy) * (galaxy.id === selectedObjectId ? 1.4 : 1);
        return (
          <sprite
            key={galaxy.id}
            position={[
              (galaxy.x ?? 0) * sphereRadius,
              (galaxy.y ?? 0) * sphereRadius,
              (galaxy.z ?? 0) * sphereRadius,
            ]}
            scale={[size, size, 1]}
          >
            <spriteMaterial
              map={textures.get(galaxy.star_type)}
              color={galaxy.id === selectedObjectId ? "#ffd700" : "#ffffff"}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              opacity={0.92}
            />
          </sprite>
        );
      })}
    </group>
  );
}
