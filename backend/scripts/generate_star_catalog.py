"""
Generate a 10,000-star catalog based on real astronomical statistics.

Sources used:
  - Real bright stars from the Hipparcos/Yale BSC (magnitude < 3.5) are already
    seeded in the DB by seed_stars.py.
  - This script generates the remaining stars using:
      * Galactic coordinate distribution (concentrated on the Milky Way plane)
      * Realistic magnitude distribution (N ∝ 10^0.6m)
      * B-V colour index correlated with spectral type and magnitude
      * Correct galactic → equatorial coordinate conversion (J2000)

Output:
  frontend/public/stars_catalog.json   — compact format for Three.js rendering
  Inserts all generated stars into MySQL star_registry.stars table.

Run: python scripts/generate_star_catalog.py
"""
import sys, os, math, random, json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine, Base
from app.models.star import Star, StarType, RegistryStatus, RAUnit
import app.models  # register all models

# ── Galactic → Equatorial (J2000) ────────────────────────────────────────────

def galactic_to_equatorial(l_deg: float, b_deg: float):
    """Convert galactic (l, b) to equatorial (RA, Dec) J2000."""
    l = math.radians(l_deg)
    b = math.radians(b_deg)
    ra_gp = math.radians(192.85948)
    dec_gp = math.radians(27.12825)
    l0 = math.radians(122.932)

    sin_dec = (math.sin(b) * math.sin(dec_gp)
               + math.cos(b) * math.cos(dec_gp) * math.cos(l0 - l))
    dec_rad = math.asin(max(-1.0, min(1.0, sin_dec)))

    y = math.cos(b) * math.sin(l0 - l)
    x = (math.sin(b) - math.sin(dec_rad) * math.sin(dec_gp)) / (math.cos(dec_gp) + 1e-12)
    ra_rad = ra_gp - math.atan2(y, x)
    ra_deg = (math.degrees(ra_rad) + 360) % 360
    dec_deg = math.degrees(dec_rad)
    return round(ra_deg, 5), round(dec_deg, 5)


def bv_from_spectral(spectral: str) -> float:
    """Return representative B-V colour for a spectral type."""
    table = {"O": -0.32, "B": -0.16, "A": 0.10, "F": 0.40,
             "G": 0.65, "K": 0.95, "M": 1.50}
    return table.get(spectral[0] if spectral else "G", 0.65)


def star_type_from_bv(bv: float) -> StarType:
    if bv < -0.2: return StarType.BLUE_GIANT
    if bv < 0.0:  return StarType.MAIN_SEQUENCE   # hot
    if bv < 0.5:  return StarType.MAIN_SEQUENCE
    if bv < 0.8:  return StarType.YELLOW_DWARF
    if bv < 1.2:  return StarType.RED_DWARF
    return StarType.RED_GIANT


# ── Magnitude distribution ─────────────────────────────────────────────────
MAGNITUDE_BANDS = [
    # (mag_min, mag_max, count, spectral_weights)
    (-2.0, 1.0,   20,   {"O": 5, "B": 50, "A": 30, "F": 10, "G": 5}),
    ( 1.0, 2.0,   50,   {"B": 30, "A": 40, "F": 20, "G": 10}),
    ( 2.0, 3.0,  170,   {"B": 15, "A": 35, "F": 25, "G": 20, "K": 5}),
    ( 3.0, 4.0,  500,   {"B": 10, "A": 25, "F": 25, "G": 25, "K": 15}),
    ( 4.0, 5.0, 1600,   {"A": 15, "F": 25, "G": 30, "K": 25, "M": 5}),
    ( 5.0, 5.5, 2400,   {"F": 15, "G": 30, "K": 35, "M": 20}),
    ( 5.5, 6.0, 2800,   {"F": 10, "G": 25, "K": 40, "M": 25}),
    ( 6.0, 6.5, 2400,   {"G": 20, "K": 45, "M": 35}),
]

REAL_STARS = [
    # (ra, dec, mag, bv, hip_id, common_name, constellation)
    (101.2871, -16.7161, -1.46, 0.00, "HIP 32349", "Sirius",         "Canis Major"),
    (95.9879,  -52.6957, -0.74, 0.15, "HIP 24436", "Canopus",        "Carina"),
    (213.9153,  19.1822, -0.05, 1.23, "HIP 69673", "Arcturus",       "Boötes"),
    (219.9021, -60.8340, -0.01, 0.71, "HIP 71683", "Rigil Kentaurus","Centaurus"),
    (279.2347,  38.7837,  0.03, 0.00, "HIP 91262", "Vega",           "Lyra"),
    (79.1722,   45.9980,  0.08, 0.80, "HIP 30438", "Capella",        "Auriga"),
    (78.6345,   -8.2016,  0.13,-0.03, "HIP 24608", "Rigel",          "Orion"),
    (114.8275,   5.2250,  0.34, 0.42, "HIP 37279", "Procyon",        "Canis Minor"),
    (88.7929,    7.4071,  0.42, 1.77, "HIP 27989", "Betelgeuse",     "Orion"),
    (210.9559, -60.3730,  0.61,-0.23, "HIP 68702", "Hadar",          "Centaurus"),
    (297.6958,   8.8683,  0.77, 0.22, "HIP 97649", "Altair",         "Aquila"),
    (247.3519, -26.4320,  1.09, 1.83, "HIP 80763", "Antares",        "Scorpius"),
    (201.2983, -11.1613,  0.98,-0.23, "HIP 65474", "Spica",          "Virgo"),
    (344.4129, -29.6223,  1.16, 0.09, "HIP 113368","Fomalhaut",      "Piscis Austrinus"),
    (116.3289,  28.0262,  1.14, 1.00, "HIP 49669", "Pollux",         "Gemini"),
    (310.3580,  45.2803,  1.25, 0.09, "HIP 109268","Deneb",          "Cygnus"),
    (68.9800,   16.5093,  0.85, 1.54, "HIP 21421", "Aldebaran",      "Taurus"),
    (37.9529,   89.2641,  1.97, 0.60, "HIP 11767", "Polaris",        "Ursa Minor"),
    (113.6495,  31.8883,  1.58, 0.04, "HIP 36850", "Castor",         "Gemini"),
    (186.6496, -63.0991,  0.77,-0.26, "HIP 60718", "Acrux",          "Crux"),
    (191.9303, -59.6888,  1.25,-0.23, "HIP 62434", "Mimosa",         "Crux"),
    (81.2828,    6.3497,  1.64,-0.22, "HIP 25336", "Bellatrix",      "Orion"),
    (84.0534,   -1.2019,  1.70,-0.19, "HIP 25930", "Alnilam",        "Orion"),
    (85.1897,   -1.9426,  1.77,-0.21, "HIP 26311", "Alnitak",        "Orion"),
    (83.0016,   -0.2991,  2.23,-0.22, "HIP 26727", "Mintaka",        "Orion"),
    (165.9320,  61.7510,  1.79, 1.07, "HIP 54061", "Dubhe",          "Ursa Major"),
    (141.8968,  -8.6586,  1.98, 1.44, "HIP 45238", "Alphard",        "Hydra"),
    (292.6804,  27.9597,  3.09, 1.09, "HIP 95947", "Albireo",        "Cygnus"),
    (200.9813,  54.9253,  2.27, 0.02, "HIP 67301", "Mizar",          "Ursa Major"),
    (305.5571,  40.2567,  2.23, 0.67, "HIP 102098","Sadr",           "Cygnus"),
    (2.0969,    29.0904,  2.06,-0.11, "HIP 746",   "Alpheratz",      "Andromeda"),
]


def weighted_choice(weights: dict, rng: random.Random) -> str:
    total = sum(weights.values())
    r = rng.uniform(0, total)
    cumulative = 0
    for k, v in weights.items():
        cumulative += v
        if r <= cumulative:
            return k
    return list(weights.keys())[-1]


def generate_catalog(target: int = 10000, seed: int = 2026):
    rng = random.Random(seed)
    stars = []  # (ra, dec, mag, bv, hip_id, common_name, constellation)

    # Add the known bright real stars first
    for s in REAL_STARS:
        stars.append(s)

    existing_coords = {(s[0], s[1]) for s in stars}

    # Generate remaining stars to fill target
    for band_min, band_max, count, spectral_weights in MAGNITUDE_BANDS:
        generated = 0
        attempts = 0
        while generated < count and len(stars) < target:
            attempts += 1
            if attempts > count * 20:
                break

            # Galactic longitude: uniform
            l_deg = rng.uniform(0, 360)

            # Galactic latitude: Gaussian concentrated toward plane
            # Width narrows for fainter stars (disk population dominates)
            sigma = 30 if band_min < 3 else 18
            b_deg = rng.gauss(0, sigma)
            b_deg = max(-90, min(90, b_deg))

            ra, dec = galactic_to_equatorial(l_deg, b_deg)

            # Avoid exact duplicates
            key = (round(ra, 2), round(dec, 2))
            if key in existing_coords:
                continue
            existing_coords.add(key)

            mag = round(rng.uniform(band_min, band_max), 2)
            spectral = weighted_choice(spectral_weights, rng)
            bv_base = bv_from_spectral(spectral)
            bv = round(max(-0.4, min(2.0, rng.gauss(bv_base, 0.15))), 2)

            stars.append((ra, dec, mag, bv, "", "", ""))
            generated += 1

    rng.shuffle(stars)
    print(f"Generated {len(stars)} stars total")
    return stars[:target]


def save_catalog_json(stars, path: str):
    """Save compact JSON for frontend rendering."""
    data = {
        "version": 1,
        "count": len(stars),
        # Each entry: [ra, dec, magnitude, bv, db_id]
        # db_id=0 means visual-only (no DB record)
        "stars": [[s[0], s[1], s[2], s[3], 0] for s in stars],
    }
    with open(path, "w") as f:
        json.dump(data, f, separators=(",", ":"))
    size_kb = os.path.getsize(path) / 1024
    print(f"Saved {path} ({size_kb:.1f} KB, {len(stars)} stars)")


def seed_to_db(stars):
    """Insert generated stars into MySQL (skips existing hip_id entries)."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing_hip = {r[0] for r in db.query(Star.hip_id).filter(Star.hip_id.isnot(None)).all()}
        existing_count = db.query(Star).count()
        print(f"DB already has {existing_count} stars")

        batch = []
        for i, s in enumerate(stars):
            ra, dec, mag, bv, hip_id, common_name, constellation = s
            if hip_id and hip_id in existing_hip:
                continue  # already in DB

            star_type = star_type_from_bv(bv)
            star = Star(
                catalog_id=hip_id or f"GEN{i:06d}",
                hip_id=hip_id or None,
                common_name=common_name or None,
                ra=ra,
                dec=dec,
                ra_unit=RAUnit.DEGREES,
                magnitude=mag,
                constellation=constellation or None,
                color_index_bv=bv,
                star_type=star_type,
                is_visible_naked_eye=mag <= 6.5,
                is_available_for_naming=True,
                registry_status=RegistryStatus.AVAILABLE,
            )
            batch.append(star)

            if len(batch) >= 500:
                db.bulk_save_objects(batch)
                db.commit()
                print(f"  Inserted {len(batch)} stars...")
                batch = []

        if batch:
            db.bulk_save_objects(batch)
            db.commit()
            print(f"  Inserted {len(batch)} stars (final batch)")

        total = db.query(Star).count()
        print(f"DB now has {total} stars")
    finally:
        db.close()


if __name__ == "__main__":
    stars = generate_catalog(target=10000)

    # Save JSON for frontend
    out_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                           "..", "frontend", "public")
    os.makedirs(out_dir, exist_ok=True)
    json_path = os.path.join(out_dir, "stars_catalog.json")
    save_catalog_json(stars, json_path)

    # Seed to DB
    seed_to_db(stars)
    print("Done.")
