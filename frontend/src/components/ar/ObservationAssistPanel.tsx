"use client";
import type { ObserverLocation, StarWithPosition } from "@/types";

type Collections = Record<string, number[]>;

interface Props {
  location: ObserverLocation | null;
  selectedObject: StarWithPosition | null;
  orientation: { alpha: number | null; beta: number | null; gamma: number | null } | null;
  isARMode: boolean;
  audioEnabled: boolean;
  collections: Collections;
  onAudioToggle: (enabled: boolean) => void;
  onSaveToCollection: (collection: string) => void;
}

const COLLECTIONS = ["Tonight", "Galaxies", "My Named Stars"];

function bortleEstimate(location: ObserverLocation | null): { className: string; score: number; note: string } {
  if (!location) return { className: "Unknown", score: 0.35, note: "Enable location for sky quality." };

  const cityLike =
    location.accuracy !== undefined && location.accuracy < 80
      ? Math.abs(location.lat) < 35 && Math.abs(location.lon) > 60
      : false;
  const fallbackDelhi = Math.abs(location.lat - 28.6139) < 0.2 && Math.abs(location.lon - 77.209) < 0.2;

  if (fallbackDelhi || cityLike) {
    return { className: "Bortle 7-8", score: 0.78, note: "Urban sky. Bright stars only; galaxies need optics." };
  }
  if (Math.abs(location.lat) > 45) {
    return { className: "Bortle 4-5", score: 0.48, note: "Moderate sky. Binocular objects possible." };
  }
  return { className: "Bortle 5-6", score: 0.6, note: "Suburban estimate. Darker horizon helps." };
}

function recommendation(object: StarWithPosition | null): string {
  if (!object) return "Select an object for optics advice.";
  const mag = object.magnitude ?? 99;
  if (object.object_kind === "galaxy") return mag <= 6.5 ? "Binoculars under dark sky" : "Telescope recommended";
  if (mag <= 3) return "Naked-eye object";
  if (mag <= 6.5) return "Binoculars improve contrast";
  return "Telescope recommended";
}

function sensorScore(
  orientation: Props["orientation"],
  isARMode: boolean,
): { label: string; value: number; hint: string } {
  if (!isARMode) return { label: "Manual", value: 0.45, hint: "Sensor mode is off." };
  if (!orientation || orientation.alpha === null) return { label: "Waiting", value: 0.25, hint: "Move phone slowly." };
  const tilt = Math.abs(orientation.gamma ?? 0);
  if (tilt > 60) return { label: "Needs calibration", value: 0.38, hint: "Figure-eight motion improves heading." };
  if (tilt > 38) return { label: "Fair", value: 0.62, hint: "Hold phone flatter for stable AR." };
  return { label: "Good", value: 0.9, hint: "Sensors look stable." };
}

export function ObservationAssistPanel({
  location,
  selectedObject,
  orientation,
  isARMode,
  audioEnabled,
  collections,
  onAudioToggle,
  onSaveToCollection,
}: Props) {
  const sky = bortleEstimate(location);
  const sensor = sensorScore(orientation, isARMode);

  return (
    <div className="absolute right-3 bottom-4 z-20 hidden w-80 pointer-events-none lg:block">
      <div className="sky-command-deck pointer-events-auto rounded-lg p-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/35">Observer assist</p>
          <button
            type="button"
            onClick={() => onAudioToggle(!audioEnabled)}
            className={`rounded-md border px-2 py-1 text-[11px] ${
              audioEnabled ? "border-star-blue bg-star-blue/15 text-star-white" : "border-white/10 text-white/45"
            }`}
          >
            Sound {audioEnabled ? "on" : "off"}
          </button>
        </div>

        <div className="mt-3 rounded-md border border-white/10 bg-black/20 p-3">
          <div className="flex items-center gap-3">
            <div className="light-map">
              <span style={{ transform: `scale(${0.55 + sky.score * 0.8})` }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-star-white">{sky.className}</p>
              <p className="text-xs text-white/45">{sky.note}</p>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <InfoTile label="Optics" value={recommendation(selectedObject)} />
          <InfoTile label="Sensor" value={sensor.label} />
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-star-blue" style={{ width: `${sensor.value * 100}%` }} />
        </div>
        <p className="mt-1 text-[11px] text-white/35">{sensor.hint}</p>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {COLLECTIONS.map((collection) => (
            <button
              key={collection}
              type="button"
              onClick={() => onSaveToCollection(collection)}
              disabled={!selectedObject}
              className="rounded-md border border-white/10 bg-black/20 px-2 py-2 text-[11px] text-white/55 disabled:opacity-35"
            >
              <span className="block truncate">{collection}</span>
              <span className="text-white/30">{collections[collection]?.length ?? 0}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-2">
      <p className="text-[10px] uppercase tracking-wider text-white/35">{label}</p>
      <p className="mt-1 text-xs font-semibold text-star-white">{value}</p>
    </div>
  );
}
