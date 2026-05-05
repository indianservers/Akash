"use client";
/**
 * Renders up to 10,000+ stars as THREE.Points with:
 *  - per-star size based on magnitude
 *  - per-star colour based on B-V colour index
 *  - a soft circular glow texture
 *  - tap/click detection via raycaster threshold
 */
import { useRef, useMemo, useEffect, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { StarWithPosition } from "@/types";
import { starColorFromBV } from "@/lib/utils";

interface Props {
  stars: StarWithPosition[];
  selectedStarId?: number | null;
  onStarClick?: (star: StarWithPosition) => void;
  sphereRadius?: number;
}

// Circular radial-gradient texture — drawn once at module load
function makeStarTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const r = size / 2;
  const grad = ctx.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.6, "rgba(255,255,255,0.3)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function magToSize(mag: number | undefined): number {
  if (mag === undefined || mag === null) return 1.5;
  // Brighter (lower mag) → larger. Range: mag -2 → 12px, mag 7 → 1.5px
  return Math.max(1.5, Math.min(12, 10 - mag * 1.2));
}

function objectSize(star: StarWithPosition): number {
  const base = magToSize(star.magnitude);
  if (star.object_kind === "galaxy") return Math.max(10, base * 2.8);
  return base;
}

function objectColor(star: StarWithPosition): string {
  if (star.object_kind === "galaxy") return "#d9c2ff";
  return starColorFromBV(star.color_index_bv);
}

export function StarField({ stars, selectedStarId, onStarClick, sphereRadius = 500 }: Props) {
  const pointsRef = useRef<THREE.Points>(null);
  const { raycaster, camera, gl } = useThree();
  const visibleStars = useMemo(() => stars.filter((s) => s.x !== undefined), [stars]);
  const texRef = useRef<THREE.Texture | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  // Build geometry buffers
  const { geometry, material, indexMap } = useMemo(() => {
    if (typeof window === "undefined") {
      return { geometry: new THREE.BufferGeometry(), material: new THREE.PointsMaterial(), indexMap: [] };
    }

    if (!texRef.current) texRef.current = makeStarTexture();

    const count = visibleStars.length;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const star = visibleStars[i];
      positions[i * 3] = (star.x ?? 0) * sphereRadius;
      positions[i * 3 + 1] = (star.y ?? 0) * sphereRadius;
      positions[i * 3 + 2] = (star.z ?? 0) * sphereRadius;

      color.set(objectColor(star));
      // Selected star → bright white-gold glow
      if (star.id === selectedStarId) color.set("#ffd700");
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = star.id === selectedStarId
        ? objectSize(star) * 2.2
        : objectSize(star);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: texRef.current } },
      vertexShader: /* glsl */`
        attribute float size;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (400.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */`
        uniform sampler2D map;
        varying vec3 vColor;
        void main() {
          vec4 tex = texture2D(map, gl_PointCoord);
          if (tex.a < 0.01) discard;
          gl_FragColor = vec4(vColor, 1.0) * tex;
        }
      `,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry: geo, material: mat, indexMap: visibleStars };
  }, [visibleStars, selectedStarId, sphereRadius]);

  const pickStar = useCallback(
    (clientX: number, clientY: number) => {
      if (!pointsRef.current || !onStarClick) return;
      const rect = gl.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      raycaster.params.Points = { threshold: 3 };
      const hits = raycaster.intersectObject(pointsRef.current);
      if (hits.length > 0) {
        const star = indexMap[hits[0].index!];
        if (star) onStarClick(star);
      }
    },
    [raycaster, camera, gl, indexMap, onStarClick],
  );

  useEffect(() => {
    const canvas = gl.domElement;

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch" && !event.isPrimary) return;
      pointerStartRef.current = { x: event.clientX, y: event.clientY };
    };

    const onPointerUp = (event: PointerEvent) => {
      const start = pointerStartRef.current;
      pointerStartRef.current = null;
      if (!start) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.sqrt(dx * dx + dy * dy) <= 8) {
        pickStar(event.clientX, event.clientY);
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
    };
  }, [gl, pickStar]);

  // Update selected star colour each frame (avoids full geometry rebuild)
  useFrame(() => {
    if (!pointsRef.current) return;
    const colorAttr = pointsRef.current.geometry.getAttribute("color") as THREE.BufferAttribute;
    const sizeAttr = pointsRef.current.geometry.getAttribute("size") as THREE.BufferAttribute;
    if (!colorAttr || !sizeAttr) return;

    const color = new THREE.Color();
    for (let i = 0; i < indexMap.length; i++) {
      const star = indexMap[i];
      const isSelected = star.id === selectedStarId;

      color.set(isSelected ? "#ffd700" : objectColor(star));
      colorAttr.setXYZ(i, color.r, color.g, color.b);
      sizeAttr.setX(i, isSelected ? objectSize(star) * 2.2 : objectSize(star));
    }
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  });

  if (visibleStars.length === 0) return null;

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}
