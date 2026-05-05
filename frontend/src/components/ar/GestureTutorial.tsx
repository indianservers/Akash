"use client";

interface Props {
  onDone: () => void;
}

export function GestureTutorial({ onDone }: Props) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/55 p-5 backdrop-blur-sm">
      <div className="object-mini-card max-w-sm rounded-lg p-5 text-center">
        <p className="text-[11px] uppercase tracking-[0.32em] text-star-blue">Sky controls</p>
        <h2 className="mt-2 text-xl font-bold text-star-white">Explore like a telescope</h2>
        <div className="mt-5 grid gap-3 text-left">
          <TutorialRow title="Drag" detail="Move across the sky." />
          <TutorialRow title="Pinch / wheel" detail="Zoom from naked-eye to telescope view." />
          <TutorialRow title="Tap object" detail="Open the quick observing card." />
          <TutorialRow title="Time slider" detail="Preview tonight's sky." />
        </div>
        <button
          type="button"
          onClick={onDone}
          className="mt-5 w-full rounded-md bg-star-blue py-3 text-sm font-bold text-space-950"
        >
          Start observing
        </button>
      </div>
    </div>
  );
}

function TutorialRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
      <p className="text-sm font-semibold text-star-white">{title}</p>
      <p className="mt-0.5 text-xs text-white/45">{detail}</p>
    </div>
  );
}
