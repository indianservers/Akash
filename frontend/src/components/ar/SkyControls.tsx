"use client";
/**
 * First-person sky navigation — Google Earth style.
 * - Mouse/touch drag  → rotate view (yaw + pitch)
 * - Scroll wheel      → zoom (FOV change)
 * - Pinch gesture     → zoom on mobile
 * - Inertia/damping   → smooth release feel
 * - AR mode           → device orientation as base; drag adds an offset on top
 */
import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useARStore } from "@/lib/store";

const SENSITIVITY = 0.0035;
const DAMPING = 0.85;
const MIN_FOV = 15;
const MAX_FOV = 90;
const DEG = Math.PI / 180;

export function SkyControls() {
  const { camera, gl } = useThree();
  const { isARMode, orientation, selectedStar } = useARStore();

  const s = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
    yaw: 0,      // manual horizontal
    pitch: 0,    // manual vertical
    velYaw: 0,
    velPitch: 0,
    pinchDist: 0,
    focusId: null as number | null,
    focusYaw: 0,
    focusPitch: 0,
  });

  // Every frame: apply camera rotation
  useFrame(() => {
    const { current: st } = s;

    if (!isARMode && selectedStar?.x !== undefined && selectedStar.id !== st.focusId) {
      st.focusId = selectedStar.id;
      st.focusYaw = Math.atan2(selectedStar.x ?? 0, -(selectedStar.z ?? -1));
      st.focusPitch = Math.asin(Math.max(-1, Math.min(1, selectedStar.y ?? 0)));
      st.velYaw = 0;
      st.velPitch = 0;
    }

    // Inertia when not dragging
    if (!st.dragging) {
      st.velYaw *= DAMPING;
      st.velPitch *= DAMPING;
      if (Math.abs(st.velYaw) > 0.00005) st.yaw += st.velYaw;
      if (Math.abs(st.velPitch) > 0.00005) st.pitch += st.velPitch;
      if (!isARMode && st.focusId !== null) {
        st.yaw = THREE.MathUtils.lerp(st.yaw, st.focusYaw, 0.08);
        st.pitch = THREE.MathUtils.lerp(st.pitch, st.focusPitch, 0.08);
      }
    }

    // Clamp vertical
    st.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, st.pitch));

    camera.rotation.order = "YXZ";

    if (
      isARMode &&
      orientation &&
      orientation.alpha !== null &&
      orientation.beta !== null &&
      orientation.gamma !== null
    ) {
      // Device orientation (sensor) + manual drag offset
      camera.rotation.y = -(orientation.alpha! * DEG) + st.yaw;
      camera.rotation.x = orientation.beta! * DEG + st.pitch;
      camera.rotation.z = -orientation.gamma! * DEG;
    } else {
      // Pure manual mode
      camera.rotation.y = st.yaw;
      camera.rotation.x = st.pitch;
      camera.rotation.z = 0;
    }
  });

  useEffect(() => {
    const canvas = gl.domElement;
    const { current: st } = s;

    const setCameraFov = (fov: number) => {
      const cam = camera as THREE.PerspectiveCamera;
      cam.fov = Math.max(MIN_FOV, Math.min(MAX_FOV, fov));
      cam.updateProjectionMatrix();
      window.dispatchEvent(new CustomEvent("sky-fov", { detail: cam.fov }));
    };

    // ── Pointer (mouse + single touch) ────────────────────────────────────
    const onPointerDown = (e: PointerEvent) => {
      // Ignore if multi-touch pinch
      if (e.pointerType === "touch" && e.isPrimary === false) return;
      st.dragging = true;
      st.lastX = e.clientX;
      st.lastY = e.clientY;
      st.velYaw = 0;
      st.velPitch = 0;
      st.focusId = null;
      canvas.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!st.dragging) return;
      if (e.pointerType === "touch" && e.isPrimary === false) return;
      const dx = e.clientX - st.lastX;
      const dy = e.clientY - st.lastY;
      st.lastX = e.clientX;
      st.lastY = e.clientY;
      st.velYaw = -dx * SENSITIVITY;
      st.velPitch = -dy * SENSITIVITY;
      st.focusId = null;
      st.yaw += st.velYaw;
      st.pitch += st.velPitch;
    };

    const onPointerUp = (e: PointerEvent) => {
      st.dragging = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
    };

    // ── Scroll wheel zoom ──────────────────────────────────────────────────
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cam = camera as THREE.PerspectiveCamera;
      const delta = e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY; // normalize line scroll
      setCameraFov(cam.fov + delta * 0.04);
    };

    // ── Pinch zoom (two-finger touch) ─────────────────────────────────────
    const activeTouches = new Map<number, Touch>();

    const onTouchStart = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) activeTouches.set(t.identifier, t);
      if (activeTouches.size === 2) {
        const [a, b] = [...activeTouches.values()];
        const dx = a.clientX - b.clientX, dy = a.clientY - b.clientY;
        st.pinchDist = Math.sqrt(dx * dx + dy * dy);
        // Pause single-finger drag while pinching
        st.dragging = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) activeTouches.set(t.identifier, t);
      if (activeTouches.size === 2) {
        e.preventDefault();
        const [a, b] = [...activeTouches.values()];
        const dx = a.clientX - b.clientX, dy = a.clientY - b.clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const cam = camera as THREE.PerspectiveCamera;
        setCameraFov(cam.fov + (st.pinchDist - dist) * 0.12);
        st.pinchDist = dist;
      }
    };

    const onZoomLevel = (event: Event) => {
      const level = Math.max(1, Math.min(50, (event as CustomEvent<number>).detail));
      const nextFov = MAX_FOV - ((level - 1) / 49) * (MAX_FOV - MIN_FOV);
      setCameraFov(nextFov);
    };

    const onTouchEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) activeTouches.delete(t.identifier);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);
    window.addEventListener("sky-zoom-level", onZoomLevel);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("sky-zoom-level", onZoomLevel);
    };
  }, [camera, gl, isARMode, orientation]);

  return null;
}
