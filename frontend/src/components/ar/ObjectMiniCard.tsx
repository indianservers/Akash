"use client";
import type { StarWithPosition } from "@/types";

interface Props {
  object: StarWithPosition;
  isFavorite: boolean;
  onDetails: () => void;
  onClose: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
}

function displayName(object: StarWithPosition): string {
  return object.custom_name || object.common_name || object.scientific_name || object.catalog_id || `Object ${object.id}`;
}

function visibilityBadge(object: StarWithPosition): string {
  if ((object.altitude ?? -90) > 8) return "visible now";
  if ((object.altitude ?? -90) > -18) return "rises later";
  return "below horizon";
}

function lightPollutionEstimate(object: StarWithPosition): string {
  const mag = object.magnitude ?? 99;
  if (object.object_kind === "galaxy" || mag > 6.5) return "dark sky needed";
  if (mag <= 2.5) return "city visible";
  if (mag <= 4.5) return "suburban visible";
  return "rural sky better";
}

function bestWindow(object: StarWithPosition): string {
  const altitude = object.altitude ?? -90;
  if (altitude > 45) return "Best now";
  if (altitude > 15) return "Good this hour";
  if (altitude > -18) return "Check later tonight";
  return "Not favorable tonight";
}

export function ObjectMiniCard({
  object,
  isFavorite,
  onDetails,
  onClose,
  onToggleFavorite,
  onShare,
}: Props) {
  return (
    <div className="absolute left-3 right-3 top-32 z-30 md:left-auto md:right-4 md:top-24 md:w-80">
      <div className="object-mini-card rounded-lg p-3 shadow-2xl">
        {object.thumbnail_url && (
          <div
            className="mb-3 h-28 rounded-md border border-white/10 bg-cover bg-center"
            style={{ backgroundImage: `url(${object.thumbnail_url})` }}
          />
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-star-white">{displayName(object)}</p>
            <p className="text-xs text-white/45">
              {object.object_kind === "galaxy" ? "Galaxy" : "Star"} · Mag {object.magnitude?.toFixed(2) ?? "n/a"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-white/40 hover:text-white">
            x
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded border border-star-blue/30 bg-star-blue/10 px-2 py-1 text-[11px] text-star-blue">
            {visibilityBadge(object)}
          </span>
          <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-white/55">
            {bestWindow(object)}
          </span>
          <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-white/55">
            {lightPollutionEstimate(object)}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          <button type="button" onClick={onDetails} className="rounded-md bg-star-blue px-2 py-2 text-xs font-semibold text-space-950">
            Details
          </button>
          <button type="button" onClick={onToggleFavorite} className="rounded-md border border-white/10 px-2 py-2 text-xs text-white/65">
            {isFavorite ? "Saved" : "Save"}
          </button>
          <button type="button" onClick={onShare} className="rounded-md border border-white/10 px-2 py-2 text-xs text-white/65">
            Share
          </button>
          <button type="button" onClick={onClose} className="rounded-md border border-white/10 px-2 py-2 text-xs text-white/65">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
