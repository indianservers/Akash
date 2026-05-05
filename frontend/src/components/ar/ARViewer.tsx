"use client";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useARStore } from "@/lib/store";
import { useStarPositions } from "@/hooks/useStarPositions";
import { useDeviceOrientation } from "@/hooks/useDeviceOrientation";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useCatalogStars } from "@/hooks/useCatalogStars";
import { useCatalogGalaxies } from "@/hooks/useCatalogGalaxies";
import { SkyControls } from "./SkyControls";
import { StarField } from "./StarField";
import { StarDetailPanel } from "@/components/ui/StarDetailPanel";
import { CompassOverlay } from "./CompassOverlay";
import { GalaxyField } from "./GalaxyField";
import { HorizonBand } from "./HorizonBand";
import { CinematicOverlays } from "./CinematicOverlays";
import { ObjectMiniCard } from "./ObjectMiniCard";
import { GestureTutorial } from "./GestureTutorial";
import { ObservationAssistPanel } from "./ObservationAssistPanel";
import { PlanetariumPlanets } from "./PlanetariumPlanets";
import { RuntimePermissionButton } from "./RuntimePermissionButton";
import { SelectedObjectTrail } from "./SelectedObjectTrail";
import { SkyLabels } from "./SkyLabels";
import { SkyLineOverlay } from "./SkyLineOverlay";
import { SkyMapToolbar, type SkyCategory, type TourId } from "./SkyMapToolbar";
import { TargetGuideOverlay } from "./TargetGuideOverlay";
import { useSkyAudio } from "./useSkyAudio";
import { ZoomScaleControls } from "./ZoomScaleControls";
import type { StarWithPosition } from "@/types";
import api from "@/lib/api";

interface Props {
  initialStars: StarWithPosition[];
}

export function ARViewer({ initialStars }: Props) {
  useDeviceOrientation();
  useGeolocation();

  const {
    visibleStars,
    location,
    selectedStar,
    setSelectedStar,
    isARMode,
    setARMode,
    orientation,
  } = useARStore();

  const [dbStars, setDbStars] = useState<StarWithPosition[]>(initialStars);
  const [activeCategory, setActiveCategory] = useState<SkyCategory>("all-sky");
  const [activeTour, setActiveTour] = useState<TourId | null>(null);
  const [tourIndex, setTourIndex] = useState(0);
  const [magnitudeLimit, setMagnitudeLimit] = useState(10);
  const [nightMode, setNightMode] = useState(false);
  const [showConstellations, setShowConstellations] = useState(false);
  const [showMilkyWay, setShowMilkyWay] = useState(true);
  const [showZodiac, setShowZodiac] = useState(true);
  const [showPlanetariumGuides, setShowPlanetariumGuides] = useState(true);
  const [showPlanets, setShowPlanets] = useState(true);
  const [presentationMode, setPresentationMode] = useState(false);
  const [highlightedZodiacId, setHighlightedZodiacId] = useState<string | null>(null);
  const [timeOffsetHours, setTimeOffsetHours] = useState(0);
  const [detailStar, setDetailStar] = useState<StarWithPosition | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [collections, setCollections] = useState<Record<string, number[]>>({
    Tonight: [],
    Galaxies: [],
    "My Named Stars": [],
  });
  const [fov, setFov] = useState(75);
  const [showcaseRunning, setShowcaseRunning] = useState(false);
  const [showGestureTutorial, setShowGestureTutorial] = useState(false);
  const [guideTargetId, setGuideTargetId] = useState<number | null>(null);
  const { audioEnabled, setAudioEnabled, playClick } = useSkyAudio();
  const catalogStars = useCatalogStars();
  const catalogGalaxies = useCatalogGalaxies();

  // Load all database stars. The worker projects them for the selected location/time.
  useEffect(() => {
    api
      .get("/stars", {
        params: { limit: 25000 },
      })
      .then((res) =>
        setDbStars(
          res.data.map((star: StarWithPosition) => ({
            ...star,
            is_visible: false,
            object_kind: star.object_kind ?? "star",
            galaxy_name: star.galaxy_name ?? "Milky Way",
          }))
        )
      )
      .catch(() => {});
  }, []);

  // Merge: DB stars first so clicks prefer them over catalog duplicates
  const allStars = useMemo(() => {
    if (catalogStars.length === 0) return [...dbStars, ...catalogGalaxies];
    const dbCoords = new Set(
      dbStars.map((s) => `${s.ra.toFixed(1)},${s.dec.toFixed(1)}`)
    );
    const uniqueCatalog = catalogStars.filter(
      (s) => !dbCoords.has(`${s.ra.toFixed(1)},${s.dec.toFixed(1)}`)
    );
    return [...dbStars, ...uniqueCatalog, ...catalogGalaxies];
  }, [dbStars, catalogStars, catalogGalaxies]);

  const observationTime = useMemo(
    () => Date.now() + timeOffsetHours * 60 * 60 * 1000,
    [timeOffsetHours],
  );

  useStarPositions(allStars, observationTime);

  useEffect(() => {
    const saved = window.localStorage.getItem("nms-ar-favorites");
    if (saved) setFavoriteIds(JSON.parse(saved));
    const savedCollections = window.localStorage.getItem("nms-ar-collections");
    if (savedCollections) setCollections(JSON.parse(savedCollections));
    if (!window.localStorage.getItem("nms-ar-gesture-tutorial")) {
      setShowGestureTutorial(true);
    }
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      setFov((event as CustomEvent<number>).detail);
    };
    window.addEventListener("sky-fov", handler);
    return () => window.removeEventListener("sky-fov", handler);
  }, []);

  const displayed = visibleStars.length > 0 ? visibleStars : allStars;
  const filteredStars = useMemo(() => {
    const magnitudeFiltered = displayed.filter(
      (star) => star.magnitude === undefined || star.magnitude <= magnitudeLimit
    );

    switch (activeCategory) {
      case "all-sky":
        return magnitudeFiltered;
      case "visible":
        return magnitudeFiltered.filter((star) => star.is_visible);
      case "naked-eye":
        return magnitudeFiltered.filter((star) => star.is_visible_naked_eye);
      case "galaxies":
        return magnitudeFiltered.filter((star) => star.object_kind === "galaxy");
      case "deep-sky":
        return magnitudeFiltered.filter((star) => star.object_kind === "galaxy");
      case "stars":
        return magnitudeFiltered.filter((star) => star.object_kind !== "galaxy");
      case "bright":
        return magnitudeFiltered.filter((star) => (star.magnitude ?? 99) <= 2.5);
      case "named":
        return magnitudeFiltered.filter((star) => star.is_named);
      case "favorites":
        return magnitudeFiltered.filter((star) => favoriteIds.includes(star.id));
      case "available":
        return magnitudeFiltered.filter((star) => star.is_available_for_naming);
      case "milky-way":
        return magnitudeFiltered.filter(
          (star) => star.object_kind !== "galaxy" && (star.galaxy_name || "Milky Way") === "Milky Way"
        );
      case "blue-white":
        return magnitudeFiltered.filter((star) => (star.color_index_bv ?? 0.2) < 0.45);
      case "gold-red":
        return magnitudeFiltered.filter((star) => (star.color_index_bv ?? 0.2) >= 0.45);
      default:
        return magnitudeFiltered;
    }
  }, [activeCategory, displayed, favoriteIds, magnitudeLimit]);

  const filteredGalaxies = useMemo(
    () => filteredStars.filter((star) => star.object_kind === "galaxy"),
    [filteredStars],
  );
  const selectedName = selectedStar?.custom_name || selectedStar?.common_name || selectedStar?.scientific_name || selectedStar?.catalog_id;

  const tourObjects = useMemo(() => {
    const galaxies = displayed.filter((star) => star.object_kind === "galaxy");
    if (activeTour === "local-group") {
      const localGroupIds = new Set(["M31", "M33", "LMC", "SMC"]);
      return galaxies
        .filter((galaxy) => localGroupIds.has(galaxy.catalog_id || ""))
        .sort((a, b) => (a.magnitude ?? 99) - (b.magnitude ?? 99));
    }
    if (activeTour === "brightest-galaxies") {
      return galaxies
        .filter((galaxy) => (galaxy.magnitude ?? 99) <= 8.7)
        .sort((a, b) => (a.magnitude ?? 99) - (b.magnitude ?? 99))
        .slice(0, 10);
    }
    if (activeTour === "tonight-best") {
      return displayed
        .filter((star) => star.is_visible)
        .filter((star) => star.magnitude !== undefined)
        .sort((a, b) => {
          const aScore = (a.magnitude ?? 99) - (a.altitude ?? 0) / 50;
          const bScore = (b.magnitude ?? 99) - (b.altitude ?? 0) / 50;
          return aScore - bScore;
        })
        .slice(0, 12);
    }
    return [];
  }, [activeTour, displayed]);

  const handleStarClick = useCallback(
    (star: StarWithPosition) => {
      playClick();
      setDetailStar(null);
      setSelectedStar(star);
      setGuideTargetId(star.id);
    },
    [playClick, setSelectedStar]
  );

  const handleTourStart = useCallback((tour: TourId) => {
    playClick();
    setActiveTour(tour);
    setTourIndex(0);
    setActiveCategory(tour === "tonight-best" ? "visible" : "galaxies");
  }, [playClick]);

  useEffect(() => {
    if (!activeTour || tourObjects.length === 0) return;
    setSelectedStar(tourObjects[Math.min(tourIndex, tourObjects.length - 1)]);
  }, [activeTour, setSelectedStar, tourIndex, tourObjects]);

  useEffect(() => {
    const objectId = new URLSearchParams(window.location.search).get("object");
    if (!objectId || displayed.length === 0 || selectedStar) return;
    const match = displayed.find(
      (star) => star.catalog_id === objectId || String(star.id) === objectId
    );
    if (match) setSelectedStar(match);
  }, [displayed, selectedStar, setSelectedStar]);

  const handleTourStep = useCallback(
    (direction: 1 | -1) => {
      if (tourObjects.length === 0) return;
      playClick();
      setTourIndex((current) => (current + direction + tourObjects.length) % tourObjects.length);
    },
    [playClick, tourObjects.length],
  );

  useEffect(() => {
    if (!showcaseRunning || !activeTour || tourObjects.length === 0) return;
    const timer = window.setInterval(() => {
      setTourIndex((current) => (current + 1) % tourObjects.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [activeTour, showcaseRunning, tourObjects.length]);

  useEffect(() => {
    if (!showcaseRunning || !selectedStar || typeof window === "undefined") return;
    const speech = window.speechSynthesis;
    if (!speech) return;
    speech.cancel();
    const name = selectedStar.common_name || selectedStar.scientific_name || selectedStar.catalog_id || "this object";
    const distance = selectedStar.distance_light_years
      ? `${Math.round(selectedStar.distance_light_years).toLocaleString()} light years away`
      : "at a cataloged sky position";
    const utterance = new SpeechSynthesisUtterance(`${name}. ${selectedStar.star_type}. ${distance}. Magnitude ${selectedStar.magnitude ?? "unknown"}.`);
    utterance.rate = 0.88;
    utterance.pitch = 0.82;
    speech.speak(utterance);
    return () => speech.cancel();
  }, [selectedStar, showcaseRunning]);

  const zoomLabel = fov <= 25 ? "telescope" : fov <= 50 ? "binocular" : "naked-eye";
  const calibrationHint = isARMode && orientation !== null && orientation.alpha !== null && Math.abs(orientation.gamma ?? 0) > 55;
  const selectedIsFavorite = selectedStar ? favoriteIds.includes(selectedStar.id) : false;

  const toggleFavorite = useCallback(() => {
    if (!selectedStar) return;
    playClick();
    setFavoriteIds((current) => {
      const next = current.includes(selectedStar.id)
        ? current.filter((id) => id !== selectedStar.id)
        : [...current, selectedStar.id];
      window.localStorage.setItem("nms-ar-favorites", JSON.stringify(next));
      return next;
    });
  }, [playClick, selectedStar]);

  const saveToCollection = useCallback(
    (collection: string) => {
      if (!selectedStar) return;
      playClick();
      setCollections((current) => {
        const existing = current[collection] ?? [];
        const next = {
          ...current,
          [collection]: existing.includes(selectedStar.id) ? existing : [...existing, selectedStar.id],
        };
        window.localStorage.setItem("nms-ar-collections", JSON.stringify(next));
        return next;
      });
    },
    [playClick, selectedStar],
  );

  const shareSelected = useCallback(async () => {
    if (!selectedStar) return;
    playClick();
    const url = `${window.location.origin}/ar?object=${encodeURIComponent(selectedStar.catalog_id || String(selectedStar.id))}`;
    if (navigator.share) {
      await navigator.share({ title: selectedStar.common_name || selectedStar.scientific_name || "Sky object", url });
    } else {
      await navigator.clipboard?.writeText(url);
    }
  }, [playClick, selectedStar]);

  const handleSelectObject = useCallback(
    (star: StarWithPosition) => {
      playClick();
      setDetailStar(null);
      const positionedStar = displayed.find((candidate) => candidate.id === star.id) ?? star;
      setSelectedStar(positionedStar);
      setGuideTargetId(positionedStar.id);
      setActiveCategory("all-sky");
    },
    [displayed, playClick, setSelectedStar],
  );

  return (
    <div className={`relative w-full h-full bg-space-950 ${nightMode ? "night-mode" : ""}`}>
      <CinematicOverlays nightMode={nightMode} selectedName={selectedName} />
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 2000 }}
        style={{ position: "absolute", inset: 0, cursor: "grab", touchAction: "none" }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={["#020308"]} />
        <ambientLight intensity={0.1} />

        <Suspense fallback={null}>
          <StarField
            stars={filteredStars}
            selectedStarId={selectedStar?.id}
            onStarClick={handleStarClick}
          />
          <GalaxyField
            galaxies={filteredGalaxies}
            selectedObjectId={selectedStar?.id}
          />
          <SkyLineOverlay
            showConstellations={showConstellations}
            showMilkyWay={showMilkyWay}
            showZodiac={showZodiac}
            showPlanetariumGuides={showPlanetariumGuides}
            timestamp={observationTime}
            highlightedZodiacId={highlightedZodiacId}
            onZodiacHover={(id) => {
              setHighlightedZodiacId(id);
              if (id) {
                window.setTimeout(() => {
                  setHighlightedZodiacId((current) => (current === id ? null : current));
                }, 2200);
              }
            }}
          />
          <PlanetariumPlanets timestamp={observationTime} show={showPlanets} />
          <SelectedObjectTrail object={selectedStar} />
          <SkyLabels
            objects={filteredStars}
            selectedObjectId={selectedStar?.id}
          />
          <SkyControls />
        </Suspense>
      </Canvas>

      {isARMode && orientation?.alpha !== null && (
        <CompassOverlay heading={orientation?.alpha ?? 0} />
      )}

      <HorizonBand heading={orientation?.alpha ?? 0} nightMode={nightMode} />
      <div className="planetarium-dome" />
      <RuntimePermissionButton />
      <TargetGuideOverlay
        target={guideTargetId === selectedStar?.id ? selectedStar : null}
        orientation={orientation}
        isARMode={isARMode}
        onClear={() => setGuideTargetId(null)}
      />

      <div className="absolute right-4 top-4 z-20 glass-chip rounded-lg text-xs text-star-blue">
        Zoom: {zoomLabel}
      </div>
      <ZoomScaleControls fov={fov} nightMode={nightMode} />

      {calibrationHint && (
        <div className="absolute left-1/2 top-32 z-20 max-w-xs -translate-x-1/2 rounded-lg border border-star-gold/30 bg-black/60 px-3 py-2 text-center text-xs text-star-gold backdrop-blur-sm">
          Move your phone in a slow figure-eight to recalibrate AR heading.
        </div>
      )}

      {/* Centre reticle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-8 h-8 border-2 border-star-blue rounded-full opacity-60">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1 h-1 bg-star-blue rounded-full" />
          </div>
        </div>
      </div>

      {selectedStar && !detailStar && (
        <ObjectMiniCard
          object={selectedStar}
          isFavorite={selectedIsFavorite}
          onDetails={() => {
            playClick();
            setDetailStar(selectedStar);
          }}
          onClose={() => {
            playClick();
            setSelectedStar(null);
            setGuideTargetId(null);
          }}
          onToggleFavorite={toggleFavorite}
          onShare={shareSelected}
        />
      )}

      {detailStar && (
        <StarDetailPanel star={detailStar} onClose={() => setDetailStar(null)} />
      )}

      {!presentationMode && <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 md:top-5">
        <div className="observatory-chip">
          <span className="text-[10px] uppercase tracking-[0.28em] text-white/35">Live sky</span>
          <span className="font-mono text-xs text-star-blue">
            {filteredStars.filter((s) => s.is_visible).length} / {filteredStars.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setARMode(!isARMode)}
          className="observatory-chip text-left text-xs text-white/70 hover:text-star-white"
        >
          {isARMode ? "Sensor mode on" : "Manual mode on"}
        </button>
      </div>}

      {!presentationMode && <SkyMapToolbar
        activeCategory={activeCategory}
        activeTour={activeTour}
        magnitudeLimit={magnitudeLimit}
        nightMode={nightMode}
        showConstellations={showConstellations}
        showMilkyWay={showMilkyWay}
        showZodiac={showZodiac}
        showPlanetariumGuides={showPlanetariumGuides}
        showPlanets={showPlanets}
        presentationMode={presentationMode}
        timeOffsetHours={timeOffsetHours}
        stars={displayed}
        onCategoryChange={setActiveCategory}
        onMagnitudeLimitChange={setMagnitudeLimit}
        onNightModeChange={setNightMode}
        onConstellationToggle={setShowConstellations}
        onMilkyWayToggle={setShowMilkyWay}
        onZodiacToggle={setShowZodiac}
        onPlanetariumGuidesToggle={setShowPlanetariumGuides}
        onPlanetsToggle={setShowPlanets}
        onPresentationModeToggle={setPresentationMode}
        onTimeOffsetChange={setTimeOffsetHours}
        onSelectStar={handleSelectObject}
        onTourStart={handleTourStart}
        onTourStep={handleTourStep}
        onShowcaseToggle={() => setShowcaseRunning((running) => !running)}
        showcaseRunning={showcaseRunning}
      />}

      <button
        type="button"
        onClick={() => setPresentationMode((mode) => !mode)}
        className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/10 bg-black/45 px-4 py-2 text-xs font-semibold text-star-white backdrop-blur-md"
      >
        {presentationMode ? "Show controls" : "Planetarium mode"}
      </button>

      {!presentationMode && <ObservationAssistPanel
        location={location}
        selectedObject={selectedStar}
        orientation={orientation}
        isARMode={isARMode}
        audioEnabled={audioEnabled}
        collections={collections}
        onAudioToggle={(enabled) => {
          setAudioEnabled(enabled);
          playClick();
        }}
        onSaveToCollection={saveToCollection}
      />}

      {showGestureTutorial && (
        <GestureTutorial
          onDone={() => {
            playClick();
            window.localStorage.setItem("nms-ar-gesture-tutorial", "done");
            setShowGestureTutorial(false);
          }}
        />
      )}
    </div>
  );
}
