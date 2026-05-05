"""
Import the bundled naked-eye star catalog into the database.

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
        existing_nms_ids = {
            catalog_id
            for (catalog_id,) in db.query(Star.catalog_id)
            .filter(Star.catalog_id.like("NMS-%"))
            .all()
        }
        existing_coords = {
            (round(float(ra), 4), round(float(dec), 4))
            for ra, dec in db.query(Star.ra, Star.dec).all()
        }

        created = 0
        batch: list[Star] = []
        for index, row in enumerate(rows, start=1):
            ra, dec, magnitude, bv, *_ = row
            catalog_id = f"NMS-{index:05d}"
            coord_key = (round(float(ra), 4), round(float(dec), 4))
            if catalog_id in existing_nms_ids or coord_key in existing_coords:
                continue

            batch.append(
                Star(
                    catalog_id=catalog_id,
                    scientific_name=f"Milky Way Star {index:05d}",
                    ra=ra,
                    dec=dec,
                    ra_unit=RAUnit.DEGREES,
                    magnitude=magnitude,
                    color_index_bv=bv,
                    star_type=star_type_from_color_index(bv),
                    is_visible_naked_eye=magnitude <= 6.5,
                    is_available_for_naming=True,
                    registry_status=RegistryStatus.AVAILABLE,
                )
            )
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
            print(f"Catalog stars already imported ({len(existing_nms_ids)} NMS records). Skipping.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
