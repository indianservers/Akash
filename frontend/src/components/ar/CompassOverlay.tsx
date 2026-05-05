"use client";

interface Props {
  heading: number;
}

const DIRECTIONS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

function headingLabel(deg: number): string {
  const idx = Math.round(((deg % 360) + 360) % 360 / 45) % 8;
  return DIRECTIONS[idx];
}

export function CompassOverlay({ heading }: Props) {
  const normalized = ((heading % 360) + 360) % 360;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
      <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-1 flex items-center gap-2">
        <svg
          className="w-4 h-4 text-star-blue"
          style={{ transform: `rotate(${normalized}deg)` }}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2L8 10h3v10h2V10h3z" />
        </svg>
        <span className="text-star-white text-sm font-mono">
          {Math.round(normalized)}° {headingLabel(normalized)}
        </span>
      </div>
    </div>
  );
}
