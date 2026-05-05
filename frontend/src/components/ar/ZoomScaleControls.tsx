"use client";

interface Props {
  fov: number;
  nightMode: boolean;
}

const MIN_FOV = 15;
const MAX_FOV = 90;

function fovToLevel(fov: number): number {
  return Math.round(1 + ((MAX_FOV - fov) / (MAX_FOV - MIN_FOV)) * 49);
}

function dispatchZoom(level: number) {
  window.dispatchEvent(new CustomEvent("sky-zoom-level", { detail: Math.max(1, Math.min(50, level)) }));
}

export function ZoomScaleControls({ fov, nightMode }: Props) {
  const level = fovToLevel(fov);

  return (
    <div className="absolute right-4 top-16 z-20 flex flex-col items-end gap-2">
      <div className={`zoom-scale-panel ${nightMode ? "zoom-scale-panel-night" : ""}`}>
        <button type="button" onClick={() => dispatchZoom(level + 3)} title="Zoom in">
          +
        </button>
        <input
          aria-label="Zoom level"
          type="range"
          min="1"
          max="50"
          step="1"
          value={level}
          onChange={(event) => dispatchZoom(Number(event.target.value))}
        />
        <button type="button" onClick={() => dispatchZoom(level - 3)} title="Zoom out">
          -
        </button>
      </div>
      <button
        type="button"
        onClick={() => dispatchZoom(level < 18 ? 28 : level < 38 ? 50 : 1)}
        className="observatory-chip text-xs text-star-blue"
        title="Cycle zoom scale"
      >
        Scale {level}/50
      </button>
    </div>
  );
}
