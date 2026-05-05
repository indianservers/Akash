"use client";
import { useState, useEffect } from "react";
import type { StarWithPosition } from "@/types";

interface CatalogJson {
  version: number;
  count: number;
  stars: (CatalogStarObject | [number, number, number, number, number?])[];
}

interface CatalogStarObject {
  catalog_id?: string;
  hip_id?: string;
  hd_id?: string;
  common_name?: string;
  scientific_name?: string;
  bayer_designation?: string;
  flamsteed_designation?: string;
  ra: number;
  dec: number;
  magnitude?: number;
  spectral_class?: string;
  color_index_bv?: number;
  constellation_abbr?: string;
  is_visible_naked_eye?: boolean;
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
        const catalog: StarWithPosition[] = data.stars.map((entry, i) => {
          const catalogNumber = String(i + 1).padStart(5, "0");
          const star = Array.isArray(entry)
            ? {
                catalog_id: `NMS-${catalogNumber}`,
                scientific_name: `Milky Way Star ${catalogNumber}`,
                ra: entry[0],
                dec: entry[1],
                magnitude: entry[2],
                color_index_bv: entry[3],
                is_visible_naked_eye: entry[2] <= 6.5,
              }
            : entry;

          return {
            id: -(i + 1),
            catalog_id: star.catalog_id || `NMS-${catalogNumber}`,
            hip_id: star.hip_id,
            hd_id: star.hd_id,
            common_name: star.common_name,
            scientific_name: star.scientific_name || `Milky Way Star ${catalogNumber}`,
            bayer_designation: star.bayer_designation,
            flamsteed_designation: star.flamsteed_designation,
            ra: star.ra,
            dec: star.dec,
            ra_unit: "degrees" as const,
            magnitude: star.magnitude,
            spectral_class: star.spectral_class,
            color_index_bv: star.color_index_bv,
            constellation: star.constellation_abbr,
            constellation_abbr: star.constellation_abbr,
            star_type: starTypeFromColorIndex(star.color_index_bv),
            galaxy_name: "Milky Way",
            object_kind: "star",
            is_visible_naked_eye: star.is_visible_naked_eye ?? (star.magnitude ?? 99) <= 6.5,
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
