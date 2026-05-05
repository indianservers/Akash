"use client";

const MARKERS = [
  { label: "N", degree: 0 },
  { label: "NE", degree: 45 },
  { label: "E", degree: 90 },
  { label: "SE", degree: 135 },
  { label: "S", degree: 180 },
  { label: "SW", degree: 225 },
  { label: "W", degree: 270 },
  { label: "NW", degree: 315 },
];

interface Props {
  heading: number;
  nightMode: boolean;
}

function wrapOffset(markerDegree: number, heading: number): number {
  let delta = markerDegree - heading;
  while (delta < -180) delta += 360;
  while (delta > 180) delta -= 360;
  return delta;
}

export function HorizonBand({ heading, nightMode }: Props) {
  const normalized = ((heading % 360) + 360) % 360;
  const accent = nightMode ? "text-red-300 border-red-400/40" : "text-star-blue border-star-blue/40";

  return (
    <div className="absolute left-3 right-3 top-16 z-20 pointer-events-none md:left-1/2 md:right-auto md:w-[520px] md:-translate-x-1/2">
      <div className={`horizon-band-shell relative h-12 overflow-hidden rounded-lg border bg-black/35 backdrop-blur-sm ${accent}`}>
        <div className="absolute left-1/2 top-0 h-full w-px bg-current opacity-80" />
        <div className="absolute left-1/2 top-1 text-[10px] font-mono text-current -translate-x-1/2">
          {Math.round(normalized)}°
        </div>
        {MARKERS.map((marker) => {
          const left = 50 + (wrapOffset(marker.degree, normalized) / 120) * 50;
          if (left < -8 || left > 108) return null;
          return (
            <div
              key={marker.label}
              className="absolute top-5 flex -translate-x-1/2 flex-col items-center gap-1 text-current"
              style={{ left: `${left}%` }}
            >
              <span className="h-2 w-px bg-current opacity-50" />
              <span className="text-xs font-semibold">{marker.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
