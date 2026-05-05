"""
Import the bundled HYG star catalog into the database.

Run: python scripts/import_catalog_stars.py
"""
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app.models  # noqa: F401 - register all models
from app.core.database import SessionLocal
from app.models.star import RAUnit, RegistryStatus, Star, StarType


CATALOG_PATHS = [
    Path(__file__).resolve().parents[1] / "app" / "data" / "stars_catalog.json",
    Path(__file__).resolve().parents[2] / "frontend" / "public" / "stars_catalog.json",
]


def star_type_from_color_index(bv: float | None) -> StarType:
    if bv is None:
        return StarType.UNKNOWN
    if bv < -0.05:
        return StarType.BLUE_GIANT
    if bv < 0.45:
        return StarType.MAIN_SEQUENCE
    if bv < 0.85:
        return StarType.YELLOW_DWARF
    if bv < 1.35:
        return StarType.RED_GIANT
    return StarType.RED_DWARF


def normalize_star(row: dict | list, index: int) -> dict:
    if isinstance(row, dict):
        return {
            "catalog_id": row.get("catalog_id") or f"NMS-{index:05d}",
            "hip_id": row.get("hip_id"),
            "hd_id": row.get("hd_id"),
            "common_name": row.get("common_name"),
            "scientific_name": row.get("scientific_name") or f"Milky Way Star {index:05d}",
            "bayer_designation": row.get("bayer_designation"),
            "flamsteed_designation": row.get("flamsteed_designation"),
            "ra": float(row["ra"]),
            "dec": float(row["dec"]),
            "magnitude": float(row["magnitude"]) if row.get("magnitude") is not None else None,
            "absolute_magnitude": row.get("absolute_magnitude"),
            "spectral_class": row.get("spectral_class"),
            "color_index_bv": row.get("color_index_bv"),
            "distance_parsecs": row.get("distance_parsecs"),
            "constellation_abbr": row.get("constellation_abbr"),
            "is_visible_naked_eye": bool(row.get("is_visible_naked_eye", False)),
        }

    ra, dec, magnitude, bv, *_ = row
    return {
        "catalog_id": f"NMS-{index:05d}",
        "scientific_name": f"Milky Way Star {index:05d}",
        "ra": float(ra),
        "dec": float(dec),
        "magnitude": float(magnitude),
        "color_index_bv": bv,
        "is_visible_naked_eye": float(magnitude) <= 6.5,
    }


def ly_from_parsecs(parsecs: float | None) -> float | None:
    if parsecs is None:
        return None
    return float(parsecs) * 3.26156


def catalog_path() -> Path:
    for path in CATALOG_PATHS:
        if path.exists():
            return path
    searched = ", ".join(str(path) for path in CATALOG_PATHS)
    raise FileNotFoundError(f"stars_catalog.json not found. Searched: {searched}")


def seed() -> None:
    path = catalog_path()
    with path.open("r", encoding="utf-8") as catalog_file:
        catalog = json.load(catalog_file)

    rows = catalog.get("stars", [])
    db = SessionLocal()
    try:
        existing_catalog_ids = {
            catalog_id
            for (catalog_id,) in db.query(Star.catalog_id)
            .filter(Star.catalog_id.isnot(None))
            .all()
        }
        existing_coords = {
            (round(float(ra), 4), round(float(dec), 4))
            for ra, dec in db.query(Star.ra, Star.dec).all()
        }

        created = 0
        batch: list[Star] = []
        for index, row in enumerate(rows, start=1):
            star_data = normalize_star(row, index)
            magnitude = star_data.get("magnitude")
            bv = star_data.get("color_index_bv")
            coord_key = (round(float(star_data["ra"]), 4), round(float(star_data["dec"]), 4))
            if star_data["catalog_id"] in existing_catalog_ids or coord_key in existing_coords:
                continue

            batch.append(
                Star(
                    catalog_id=star_data["catalog_id"],
                    hip_id=star_data.get("hip_id"),
                    hd_id=star_data.get("hd_id"),
                    common_name=star_data.get("common_name"),
                    scientific_name=star_data.get("scientific_name"),
                    bayer_designation=star_data.get("bayer_designation"),
                    flamsteed_designation=star_data.get("flamsteed_designation"),
                    ra=star_data["ra"],
                    dec=star_data["dec"],
                    ra_unit=RAUnit.DEGREES,
                    magnitude=magnitude,
                    absolute_magnitude=star_data.get("absolute_magnitude"),
                    spectral_class=star_data.get("spectral_class"),
                    color_index_bv=bv,
                    constellation_abbr=star_data.get("constellation_abbr"),
                    star_type=star_type_from_color_index(bv),
                    distance_light_years=ly_from_parsecs(star_data.get("distance_parsecs")),
                    is_visible_naked_eye=star_data.get("is_visible_naked_eye", False),
                    is_available_for_naming=True,
                    registry_status=RegistryStatus.AVAILABLE,
                )
            )
            existing_catalog_ids.add(star_data["catalog_id"])
            existing_coords.add(coord_key)

            if len(batch) >= 1000:
                db.bulk_save_objects(batch)
                db.commit()
                created += len(batch)
                batch.clear()

        if batch:
            db.bulk_save_objects(batch)
            db.commit()
            created += len(batch)

        if created:
            print(f"Imported {created} catalog stars from {path}.")
        else:
            print(f"Catalog stars already imported. Skipping.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
