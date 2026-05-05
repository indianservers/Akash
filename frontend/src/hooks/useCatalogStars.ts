"use client";
import { useState, useEffect } from "react";
import type { StarWithPosition } from "@/types";

interface CatalogJson {
  version: number;
  count: number;
  stars: [number, number, number, number, number?][];
}

function starTypeFromColorIndex(bv: number | undefined): StarWithPosition["star_type"] {
  if (bv === undefined || bv === null) return "Unknown / Unclassified";
  if (bv < -0.05) return "Blue Giant";
  if (bv < 0.45) return "Main Sequence Star";
  if (bv < 0.85) return "Yellow Dwarf";
  if (bv < 1.35) return "Red Giant";
  return "Red Dwarf";
}

export function useCatalogStars(): StarWithPosition[] {
  const [stars, setStars] = useState<StarWithPosition[]>([]);

  useEffect(() => {
    fetch("/stars_catalog.json")
      .then((r) => r.json())
      .then((data: CatalogJson) => {
        const catalog: StarWithPosition[] = data.stars.map(([ra, dec, mag, bv], i) => {
          const catalogNumber = String(i + 1).padStart(5, "0");
          return {
            id: -(i + 1),
            catalog_id: `NMS-${catalogNumber}`,
            scientific_name: `Milky Way Star ${catalogNumber}`,
            ra,
            dec,
            ra_unit: "degrees" as const,
            magnitude: mag,
            color_index_bv: bv,
            star_type: starTypeFromColorIndex(bv),
            galaxy_name: "Milky Way",
            object_kind: "star",
            is_visible_naked_eye: mag <= 6.5,
            is_named: false,
            is_available_for_naming: true,
            registry_status: "Available",
            is_visible: false,
          };
        });
        setStars(catalog);
      })
      .catch(() => {});
  }, []);

  return stars;
}
