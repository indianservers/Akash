"""
Build the bundled Akash star catalog from the HYG stellar database.

Run:
  python scripts/build_hyg_catalog.py --csv path/to/hygdata_v41.csv

If --csv is omitted, the script downloads the current HYG CSV from the
Astronexus archive mirror on GitHub.
"""
import argparse
import csv
import json
import math
import tempfile
import urllib.request
from pathlib import Path


HYG_URL = "https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv"
TARGET_COUNT = 20_000
NAKED_EYE_MAG_LIMIT = 6.5


def value(row: dict[str, str], key: str) -> str | None:
    raw = row.get(key, "").strip()
    return raw or None


def number(row: dict[str, str], key: str) -> float | None:
    raw = value(row, key)
    if raw is None:
        return None
    try:
        if not math.isfinite(float(raw)):
            return None
        return float(raw)
    except ValueError:
        return None


def catalog_id(row: dict[str, str]) -> str:
    hyg_id = value(row, "id") or "0"
    if hip := value(row, "hip"):
        return f"HIP {hip}"
    if hd := value(row, "hd"):
        return f"HD {hd}"
    if hr := value(row, "hr"):
        return f"HR {hr}"
    return f"HYG {hyg_id}"


def parse_star(row: dict[str, str]) -> dict[str, object] | None:
    proper = value(row, "proper")
    if proper == "Sol":
        return None

    ra_hours = number(row, "ra")
    dec = number(row, "dec")
    mag = number(row, "mag")
    if ra_hours is None or dec is None or mag is None:
        return None

    distance_parsecs = number(row, "dist")
    if distance_parsecs is not None and distance_parsecs >= 100000:
        distance_parsecs = None

    star = {
        "catalog_id": catalog_id(row),
        "hyg_id": value(row, "id"),
        "hip_id": f"HIP {value(row, 'hip')}" if value(row, "hip") else None,
        "hd_id": f"HD {value(row, 'hd')}" if value(row, "hd") else None,
        "hr_id": f"HR {value(row, 'hr')}" if value(row, "hr") else None,
        "common_name": proper,
        "bayer_designation": value(row, "bayer"),
        "flamsteed_designation": value(row, "flam"),
        "scientific_name": value(row, "bf"),
        "ra": round(ra_hours * 15, 6),
        "dec": round(dec, 6),
        "magnitude": round(mag, 3),
        "absolute_magnitude": number(row, "absmag"),
        "spectral_class": value(row, "spect"),
        "color_index_bv": number(row, "ci"),
        "distance_parsecs": distance_parsecs,
        "constellation_abbr": value(row, "con"),
        "is_visible_naked_eye": mag <= NAKED_EYE_MAG_LIMIT,
    }
    return {key: val for key, val in star.items() if val is not None}


def read_stars(csv_path: Path) -> list[dict[str, object]]:
    with csv_path.open("r", encoding="utf-8", newline="") as handle:
        rows = csv.DictReader(handle)
        stars = [star for row in rows if (star := parse_star(row))]

    stars.sort(key=lambda star: (float(star["magnitude"]), str(star["catalog_id"])))
    naked_eye = [star for star in stars if star["is_visible_naked_eye"]]
    selected = naked_eye[:]
    selected_ids = {star["catalog_id"] for star in selected}

    for star in stars:
        if len(selected) >= TARGET_COUNT:
            break
        if star["catalog_id"] not in selected_ids:
            selected.append(star)
            selected_ids.add(star["catalog_id"])

    selected.sort(key=lambda star: (float(star["magnitude"]), str(star["catalog_id"])))
    return selected


def compact_star(star: dict[str, object]) -> list[float]:
    return [
        float(star["ra"]),
        float(star["dec"]),
        float(star["magnitude"]),
        float(star.get("color_index_bv", 0.65)),
        0,
    ]


def download_csv() -> Path:
    target = Path(tempfile.gettempdir()) / "hygdata_v41.csv"
    urllib.request.urlretrieve(HYG_URL, target)
    return target


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", type=Path, help="Path to hygdata_v41.csv")
    args = parser.parse_args()

    csv_path = args.csv or download_csv()
    stars = read_stars(csv_path)
    repo_root = Path(__file__).resolve().parents[2]
    backend_path = repo_root / "backend" / "app" / "data" / "stars_catalog.json"
    frontend_path = repo_root / "frontend" / "public" / "stars_catalog.json"
    backend_path.parent.mkdir(parents=True, exist_ok=True)
    frontend_path.parent.mkdir(parents=True, exist_ok=True)

    rich_catalog = {
        "version": 2,
        "source": "HYG Database v4.1, Astronexus; RA/Dec J2000, apparent magnitude",
        "count": len(stars),
        "naked_eye_count": sum(1 for star in stars if star["is_visible_naked_eye"]),
        "stars": stars,
    }
    compact_catalog = {
        "version": 2,
        "source": rich_catalog["source"],
        "count": len(stars),
        "naked_eye_count": rich_catalog["naked_eye_count"],
        "stars": [compact_star(star) for star in stars],
    }

    backend_path.write_text(json.dumps(rich_catalog, separators=(",", ":")), encoding="utf-8")
    frontend_path.write_text(json.dumps(compact_catalog, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {backend_path} with {rich_catalog['count']} stars")
    print(f"Wrote {frontend_path} with {compact_catalog['count']} stars")


if __name__ == "__main__":
    main()
