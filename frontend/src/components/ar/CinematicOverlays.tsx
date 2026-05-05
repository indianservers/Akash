"use client";

interface Props {
  nightMode: boolean;
  selectedName?: string;
}

export function CinematicOverlays({ nightMode, selectedName }: Props) {
  return (
    <>
      <div className={`sky-vignette ${nightMode ? "sky-vignette-night" : ""}`} />
      <div className="sky-horizon-glow" />
      <div className="sky-scanlines" />
      {selectedName && (
        <div className="absolute left-1/2 top-1/2 z-10 h-28 w-28 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="selection-orbit selection-orbit-a" />
          <div className="selection-orbit selection-orbit-b" />
          <div className="selection-orbit selection-orbit-c" />
        </div>
      )}
    </>
  );
}
