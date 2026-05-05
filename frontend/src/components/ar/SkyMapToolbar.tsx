"use client";
import { useState } from "react";
import type { StarWithPosition } from "@/types";

export type SkyCategory =
  | "all-sky"
  | "visible"
  | "naked-eye"
  | "galaxies"
  | "deep-sky"
  | "stars"
  | "bright"
  | "named"
  | "favorites"
  | "available"
  | "milky-way"
  | "blue-white"
  | "gold-red";

type CategoryOption = {
  id: SkyCategory;
  label: string;
  description: string;
};

const CATEGORIES: CategoryOption[] = [
  { id: "all-sky", label: "360 sky", description: "Full celestial sphere" },
  { id: "visible", label: "Visible now", description: "Above your horizon" },
  { id: "naked-eye", label: "Earth eyes", description: "Seen without telescope" },
  { id: "galaxies", label: "Galaxies", description: "Real Messier/NGC objects" },
  { id: "deep-sky", label: "Deep Sky", description: "Galaxies and far objects" },
  { id: "stars", label: "Stars", description: "Catalog stars only" },
  { id: "bright", label: "Bright anchors", description: "Magnitude 2.5 or brighter" },
  { id: "named", label: "Named registry", description: "Custom named stars" },
  { id: "favorites", label: "Favorites", description: "Bookmarked objects" },
  { id: "available", label: "Available", description: "Ready for naming" },
  { id: "milky-way", label: "Milky Way", description: "Galaxy name + star name" },
  { id: "blue-white", label: "Blue/white", description: "Hotter stars" },
  { id: "gold-red", label: "Gold/red", description: "Warmer stars" },
];

export type TourId = "local-group" | "brightest-galaxies" | "tonight-best";

type TourOption = {
  id: TourId;
  label: string;
  description: string;
};

const TOURS: TourOption[] = [
  { id: "local-group", label: "Local Group", description: "Nearby real galaxies" },
  { id: "brightest-galaxies", label: "Brightest galaxies", description: "Easy-to-find deep sky" },
  { id: "tonight-best", label: "Tonight's best", description: "High and bright now" },
];

interface Props {
  activeCategory: SkyCategory;
  activeTour: TourId | null;
  magnitudeLimit: number;
  nightMode: boolean;
  showConstellations: boolean;
  showMilkyWay: boolean;
  showZodiac: boolean;
  showPlanetariumGuides: boolean;
  showPlanets: boolean;
  presentationMode: boolean;
  timeOffsetHours: number;
  stars: StarWithPosition[];
  onCategoryChange: (category: SkyCategory) => void;
  onMagnitudeLimitChange: (limit: number) => void;
  onNightModeChange: (enabled: boolean) => void;
  onConstellationToggle: (enabled: boolean) => void;
  onMilkyWayToggle: (enabled: boolean) => void;
  onZodiacToggle: (enabled: boolean) => void;
  onPlanetariumGuidesToggle: (enabled: boolean) => void;
  onPlanetsToggle: (enabled: boolean) => void;
  onPresentationModeToggle: (enabled: boolean) => void;
  onTimeOffsetChange: (hours: number) => void;
  onSelectStar: (star: StarWithPosition) => void;
  onTourStart: (tour: TourId) => void;
  onTourStep: (direction: 1 | -1) => void;
  onShowcaseToggle: () => void;
  showcaseRunning: boolean;
}

function displayName(star: StarWithPosition): string {
  if (star.custom_name) return star.custom_name;
  if (star.common_name) return star.common_name;
  if (star.object_kind === "galaxy") return star.scientific_name || star.catalog_id || `Galaxy ${star.id}`;
  if (star.galaxy_name && star.scientific_name) return `${star.galaxy_name} - ${star.scientific_name}`;
  return star.scientific_name || star.catalog_id || `Star ${star.id}`;
}

function searchableValues(star: StarWithPosition): string[] {
  return [
    displayName(star),
    star.catalog_id,
    star.hip_id,
    star.hd_id,
    star.common_name,
    star.scientific_name,
    star.custom_name,
    star.bayer_designation,
    star.flamsteed_designation,
    star.constellation,
    star.constellation_abbr,
    star.spectral_class,
    star.star_type,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
}

function searchRank(star: StarWithPosition, searchTerm: string): number {
  const values = searchableValues(star);
  const exact = values.some((value) => value === searchTerm);
  if (exact) return -1000 + (star.magnitude ?? 99);
  const startsWith = values.some((value) => value.startsWith(searchTerm));
  if (startsWith) return -500 + (star.magnitude ?? 99);
  return star.magnitude ?? 99;
}

export function SkyMapToolbar({
  activeCategory,
  activeTour,
  magnitudeLimit,
  nightMode,
  showConstellations,
  showMilkyWay,
  showZodiac,
  showPlanetariumGuides,
  showPlanets,
  presentationMode,
  timeOffsetHours,
  stars,
  onCategoryChange,
  onMagnitudeLimitChange,
  onNightModeChange,
  onConstellationToggle,
  onMilkyWayToggle,
  onZodiacToggle,
  onPlanetariumGuidesToggle,
  onPlanetsToggle,
  onPresentationModeToggle,
  onTimeOffsetChange,
  onSelectStar,
  onTourStart,
  onTourStep,
  onShowcaseToggle,
  showcaseRunning,
}: Props) {
  const [query, setQuery] = useState("");
  const visibleCount = stars.filter((star) => star.is_visible).length;
  const nakedEyeCount = stars.filter((star) => star.is_visible_naked_eye).length;
  const galaxyCount = stars.filter((star) => star.object_kind === "galaxy").length;
  const featuredStars = [...stars]
    .filter((star) => star.is_visible)
    .filter((star) => star.magnitude !== undefined)
    .sort((a, b) => {
      const aScore = (a.magnitude ?? 99) - (a.altitude ?? 0) / 60;
      const bScore = (b.magnitude ?? 99) - (b.altitude ?? 0) / 60;
      return aScore - bScore;
    })
    .slice(0, 6);
  const constellations = Array.from(
    new Set(stars.map((star) => star.constellation).filter(Boolean) as string[])
  ).sort();
  const searchTerm = query.trim().toLowerCase();
  const objectMatches = searchTerm
    ? stars
        .filter((star) => searchableValues(star).some((value) => value.includes(searchTerm)))
        .sort((a, b) => searchRank(a, searchTerm) - searchRank(b, searchTerm))
        .slice(0, 10)
    : [];
  const constellationMatches = searchTerm
    ? constellations
        .filter((constellation) => constellation.toLowerCase().includes(searchTerm))
        .slice(0, 4)
    : [];
  const controlTone = nightMode ? "border-red-500/30 bg-red-950/20 text-red-100" : "";
  const timeLabel =
    timeOffsetHours === 0
      ? "Now"
      : `${timeOffsetHours > 0 ? "+" : ""}${timeOffsetHours.toFixed(1)}h`;

  const visibilityBadge = (star: StarWithPosition) => {
    if ((star.altitude ?? -90) > 8) return "visible now";
    if ((star.altitude ?? -90) > -18) return "rises later";
    return "below horizon";
  };

  return (
    <div className="absolute left-3 right-3 bottom-4 z-20 pointer-events-none md:left-4 md:right-auto md:bottom-5 md:w-[360px]">
      <div className={`sky-command-deck pointer-events-auto rounded-lg p-3 shadow-2xl ${controlTone}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/40">Sky map</p>
            <p className="text-sm font-medium text-star-white">
              {visibleCount.toLocaleString()} visible / {nakedEyeCount.toLocaleString()} naked-eye / {galaxyCount} galaxies
            </p>
          </div>
          <div className="text-right text-[11px] text-white/40">
            <p>Drag to move</p>
            <p>Pinch or wheel to zoom</p>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search stars, galaxies, constellations"
            className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-star-white placeholder-white/35 outline-none focus:border-star-blue/60"
          />
          <button
            type="button"
            onClick={() => onNightModeChange(!nightMode)}
            className={`rounded-md border px-3 py-2 text-xs font-medium ${
              nightMode
                ? "border-red-400/50 bg-red-500/15 text-red-100"
                : "border-white/10 bg-white/[0.03] text-white/60"
            }`}
            title="Red night mode"
          >
            Night
          </button>
        </div>

        {(objectMatches.length > 0 || constellationMatches.length > 0) && (
          <div className="mt-2 max-h-36 overflow-y-auto rounded-md border border-white/10 bg-black/35 p-2">
            {objectMatches.map((star) => (
              <button
                key={star.id}
                type="button"
                onClick={() => {
                  onSelectStar(star);
                  setQuery(displayName(star));
                }}
                className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left hover:bg-white/10"
              >
                <span className="truncate text-xs text-star-white">{displayName(star)}</span>
                <span className="shrink-0 text-[10px] text-white/35">
                  {star.object_kind === "galaxy" ? "Galaxy" : star.custom_name ? "Named" : "Star"}
                </span>
              </button>
            ))}
            {constellationMatches.map((constellation) => {
              const target = stars
                .filter((star) => star.constellation === constellation)
                .sort((a, b) => (a.magnitude ?? 99) - (b.magnitude ?? 99))[0];
              return (
                <button
                  key={constellation}
                  type="button"
                  onClick={() => target && onSelectStar(target)}
                  className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left hover:bg-white/10"
                >
                  <span className="truncate text-xs text-star-white">{constellation}</span>
                  <span className="shrink-0 text-[10px] text-white/35">Constellation</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              title={category.description}
              onClick={() => onCategoryChange(category.id)}
              className={`shrink-0 rounded-md border px-3 py-2 text-left transition ${
                activeCategory === category.id
                  ? "border-star-blue bg-star-blue/15 text-star-white"
                  : "border-white/10 bg-white/[0.03] text-white/55 hover:text-white"
              }`}
            >
              <span className="block text-xs font-medium">{category.label}</span>
              <span className="block text-[10px] text-white/35">{category.description}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onConstellationToggle(!showConstellations)}
            className={`rounded-md border px-2 py-2 text-xs ${
              showConstellations ? "border-star-blue bg-star-blue/15 text-star-white" : "border-white/10 bg-black/20 text-white/55"
            }`}
          >
            Constellations
          </button>
          <button
            type="button"
            onClick={() => onMilkyWayToggle(!showMilkyWay)}
            className={`rounded-md border px-2 py-2 text-xs ${
              showMilkyWay ? "border-star-blue bg-star-blue/15 text-star-white" : "border-white/10 bg-black/20 text-white/55"
            }`}
          >
            Milky Way
          </button>
          <button
            type="button"
            onClick={() => onZodiacToggle(!showZodiac)}
            className={`rounded-md border px-2 py-2 text-xs ${
              showZodiac ? "border-star-gold bg-star-gold/15 text-star-white" : "border-white/10 bg-black/20 text-white/55"
            }`}
          >
            Zodiac
          </button>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onPlanetariumGuidesToggle(!showPlanetariumGuides)}
            className={`rounded-md border px-2 py-2 text-xs ${
              showPlanetariumGuides ? "border-star-blue bg-star-blue/15 text-star-white" : "border-white/10 bg-black/20 text-white/55"
            }`}
          >
            Guides
          </button>
          <button
            type="button"
            onClick={() => onPlanetsToggle(!showPlanets)}
            className={`rounded-md border px-2 py-2 text-xs ${
              showPlanets ? "border-star-gold bg-star-gold/15 text-star-white" : "border-white/10 bg-black/20 text-white/55"
            }`}
          >
            Planets
          </button>
          <button
            type="button"
            onClick={() => onPresentationModeToggle(!presentationMode)}
            className="rounded-md border border-white/10 bg-black/20 px-2 py-2 text-xs text-white/55"
          >
            Dome
          </button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {TOURS.map((tour) => (
            <button
              key={tour.id}
              type="button"
              title={tour.description}
              onClick={() => onTourStart(tour.id)}
              className={`rounded-md border px-2 py-2 text-left ${
                activeTour === tour.id
                  ? "border-star-gold bg-star-gold/15 text-star-white"
                  : "border-white/10 bg-black/20 text-white/55 hover:text-white"
              }`}
            >
              <span className="block truncate text-xs font-medium">{tour.label}</span>
              <span className="block truncate text-[10px] text-white/35">{tour.description}</span>
            </button>
          ))}
        </div>

        {activeTour && (
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => onTourStep(-1)}
              className="flex-1 rounded-md border border-white/10 bg-black/20 py-2 text-xs text-white/60 hover:text-white"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => onTourStep(1)}
              className="flex-1 rounded-md border border-white/10 bg-black/20 py-2 text-xs text-white/60 hover:text-white"
            >
              Next object
            </button>
            <button
              type="button"
              onClick={onShowcaseToggle}
              className={`flex-1 rounded-md border py-2 text-xs ${
                showcaseRunning
                  ? "border-star-gold bg-star-gold/15 text-star-white"
                  : "border-white/10 bg-black/20 text-white/60 hover:text-white"
              }`}
            >
              Showcase
            </button>
          </div>
        )}

        <label className="mt-3 flex items-center gap-3 text-xs text-white/50">
          <span className="w-20">Brightness</span>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={magnitudeLimit}
            onChange={(event) => onMagnitudeLimitChange(Number(event.target.value))}
            className="min-w-0 flex-1 accent-star-blue"
          />
          <span className="w-10 text-right font-mono text-star-white">{magnitudeLimit.toFixed(1)}</span>
        </label>

        <label className="mt-3 flex items-center gap-3 text-xs text-white/50">
          <span className="w-20">Time</span>
          <input
            type="range"
            min="-6"
            max="8"
            step="0.5"
            value={timeOffsetHours}
            onChange={(event) => onTimeOffsetChange(Number(event.target.value))}
            className="min-w-0 flex-1 accent-star-blue"
          />
          <span className="w-10 text-right font-mono text-star-white">{timeLabel}</span>
        </label>

        <p className="mt-3 text-[11px] uppercase tracking-wider text-white/35">Tonight from my location</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {featuredStars.map((star) => (
            <button
              key={star.id}
              type="button"
              onClick={() => onSelectStar(star)}
              className="rounded-md border border-white/10 bg-black/20 px-2 py-2 text-left hover:border-star-blue/50"
            >
              <span className="block truncate text-xs text-star-white">{displayName(star)}</span>
              <span className="block text-[10px] text-white/40">
                Mag {star.magnitude?.toFixed(2) ?? "n/a"} · {visibilityBadge(star)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
