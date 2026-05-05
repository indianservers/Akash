"use client";
import type { StarWithPosition } from "@/types";

interface Props {
  target: StarWithPosition | null;
  orientation: { alpha: number | null; beta: number | null; gamma: number | null } | null;
  isARMode: boolean;
  onClear: () => void;
}

function displayName(target: StarWithPosition): string {
  return target.custom_name || target.common_name || target.scientific_name || target.catalog_id || `Object ${target.id}`;
}

function normalizeDelta(degrees: number): number {
  let delta = degrees;
  while (delta < -180) delta += 360;
  while (delta > 180) delta -= 360;
  return delta;
}

function arrowFor(delta: number): string {
  if (Math.abs(delta) < 6) return "↑";
  if (delta > 0) return "→";
  return "←";
}

function directionText(delta: number): string {
  if (Math.abs(delta) < 6) return "Aligned horizontally";
  return `${Math.abs(Math.round(delta))}° ${delta > 0 ? "right" : "left"}`;
}

function altitudeText(targetAltitude: number | undefined, beta: number | null | undefined): string {
  if (targetAltitude === undefined) return "Altitude unknown";
  if (beta === null || beta === undefined) return `Aim to ${Math.round(targetAltitude)}° altitude`;
  const estimatedAimAltitude = Math.max(-90, Math.min(90, 90 - beta));
  const delta = targetAltitude - estimatedAimAltitude;
  if (Math.abs(delta) < 7) return "Tilt aligned";
  return `${Math.abs(Math.round(delta))}° ${delta > 0 ? "up" : "down"}`;
}

export function TargetGuideOverlay({ target, orientation, isARMode, onClear }: Props) {
  if (!target) return null;

  const heading = orientation?.alpha ?? null;
  const targetAzimuth = target.azimuth;
  const deltaAz = heading !== null && targetAzimuth !== undefined
    ? normalizeDelta(targetAzimuth - heading)
    : null;
  const aligned = deltaAz !== null && Math.abs(deltaAz) < 6 && Math.abs((target.altitude ?? 0) - (90 - (orientation?.beta ?? 90))) < 8;

  return (
    <div className="target-guide">
      <div className="target-guide-header">
        <div>
          <p className="target-guide-kicker">Guiding to</p>
          <p className="target-guide-name">{displayName(target)}</p>
        </div>
        <button type="button" onClick={onClear}>Stop</button>
      </div>

      <div className={`target-guide-arrow ${aligned ? "target-guide-arrow-locked" : ""}`}>
        {deltaAz === null ? "◎" : arrowFor(deltaAz)}
      </div>

      <div className="target-guide-grid">
        <div>
          <span>Turn</span>
          <strong>{deltaAz === null ? "Enable sensors" : directionText(deltaAz)}</strong>
        </div>
        <div>
          <span>Tilt</span>
          <strong>{altitudeText(target.altitude, orientation?.beta)}</strong>
        </div>
      </div>

      <p className="target-guide-note">
        {isARMode
          ? aligned
            ? "Target should be near the center reticle."
            : "Move the phone until the arrow becomes centered."
          : "Manual mode is flying the map to this target."}
      </p>
    </div>
  );
}
