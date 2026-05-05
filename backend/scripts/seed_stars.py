"""
Seed script: loads real naked-eye stars from the Hipparcos catalog subset.
Run: python scripts/seed_stars.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine, Base
from app.models.star import Star, StarType, RegistryStatus, RAUnit
import app.models  # register all models

# Real naked-eye stars from Hipparcos catalog (magnitude < 3.5 for seed)
SEED_STARS = [
    {"hip_id": "HIP 32349", "catalog_id": "HIP 32349", "common_name": "Sirius", "scientific_name": "Alpha Canis Majoris", "ra": 101.2871, "dec": -16.7161, "magnitude": -1.46, "absolute_magnitude": 1.42, "constellation": "Canis Major", "constellation_abbr": "CMa", "spectral_class": "A1V", "star_type": StarType.MAIN_SEQUENCE, "color_index_bv": 0.0, "distance_light_years": 8.6, "parallax": 379.21, "temperature_kelvin": 9940, "luminosity": 25.4, "mass_solar": 2.06, "radius_solar": 1.71},
    {"hip_id": "HIP 24436", "catalog_id": "HIP 24436", "common_name": "Canopus", "scientific_name": "Alpha Carinae", "ra": 95.9879, "dec": -52.6957, "magnitude": -0.74, "absolute_magnitude": -5.71, "constellation": "Carina", "constellation_abbr": "Car", "spectral_class": "A9II", "star_type": StarType.SUPERGIANT, "color_index_bv": 0.15, "distance_light_years": 310.0, "temperature_kelvin": 7400, "luminosity": 10700, "mass_solar": 8.0, "radius_solar": 71.0},
    {"hip_id": "HIP 69673", "catalog_id": "HIP 69673", "common_name": "Arcturus", "scientific_name": "Alpha Bootis", "ra": 213.9153, "dec": 19.1822, "magnitude": -0.05, "absolute_magnitude": -0.30, "constellation": "Boötes", "constellation_abbr": "Boo", "spectral_class": "K1.5IIIFe-0.5", "star_type": StarType.RED_GIANT, "color_index_bv": 1.23, "distance_light_years": 36.7, "temperature_kelvin": 4286, "luminosity": 170.0, "mass_solar": 1.08, "radius_solar": 25.4},
    {"hip_id": "HIP 91262", "catalog_id": "HIP 91262", "common_name": "Vega", "scientific_name": "Alpha Lyrae", "ra": 279.2347, "dec": 38.7837, "magnitude": 0.03, "absolute_magnitude": 0.58, "constellation": "Lyra", "constellation_abbr": "Lyr", "spectral_class": "A0Va", "star_type": StarType.MAIN_SEQUENCE, "color_index_bv": 0.0, "distance_light_years": 25.04, "temperature_kelvin": 9602, "luminosity": 40.12, "mass_solar": 2.135, "radius_solar": 2.362},
    {"hip_id": "HIP 30438", "catalog_id": "HIP 30438", "common_name": "Capella", "scientific_name": "Alpha Aurigae", "ra": 79.1722, "dec": 45.9980, "magnitude": 0.08, "absolute_magnitude": -0.48, "constellation": "Auriga", "constellation_abbr": "Aur", "spectral_class": "G3III", "star_type": StarType.RED_GIANT, "color_index_bv": 0.8, "distance_light_years": 42.9, "temperature_kelvin": 4970, "luminosity": 78.7, "mass_solar": 2.56, "radius_solar": 11.98},
    {"hip_id": "HIP 24608", "catalog_id": "HIP 24608", "common_name": "Rigel", "scientific_name": "Beta Orionis", "ra": 78.6345, "dec": -8.2016, "magnitude": 0.13, "absolute_magnitude": -7.84, "constellation": "Orion", "constellation_abbr": "Ori", "spectral_class": "B8Ia", "star_type": StarType.SUPERGIANT, "color_index_bv": -0.03, "distance_light_years": 860.0, "temperature_kelvin": 12100, "luminosity": 120000, "mass_solar": 21.0, "radius_solar": 78.9},
    {"hip_id": "HIP 37279", "catalog_id": "HIP 37279", "common_name": "Procyon", "scientific_name": "Alpha Canis Minoris", "ra": 114.8275, "dec": 5.2250, "magnitude": 0.34, "absolute_magnitude": 2.68, "constellation": "Canis Minor", "constellation_abbr": "CMi", "spectral_class": "F5IV-V", "star_type": StarType.MAIN_SEQUENCE, "color_index_bv": 0.42, "distance_light_years": 11.46, "temperature_kelvin": 6530, "luminosity": 6.93, "mass_solar": 1.499, "radius_solar": 2.048},
    {"hip_id": "HIP 27989", "catalog_id": "HIP 27989", "common_name": "Betelgeuse", "scientific_name": "Alpha Orionis", "ra": 88.7929, "dec": 7.4071, "magnitude": 0.42, "absolute_magnitude": -5.85, "constellation": "Orion", "constellation_abbr": "Ori", "spectral_class": "M2Iab", "star_type": StarType.SUPERGIANT, "color_index_bv": 1.77, "distance_light_years": 700.0, "temperature_kelvin": 3500, "luminosity": 90000, "mass_solar": 11.6, "radius_solar": 887.0},
    {"hip_id": "HIP 68702", "catalog_id": "HIP 68702", "common_name": "Hadar", "scientific_name": "Beta Centauri", "ra": 210.9559, "dec": -60.3730, "magnitude": 0.61, "absolute_magnitude": -5.42, "constellation": "Centaurus", "constellation_abbr": "Cen", "spectral_class": "B1III", "star_type": StarType.BLUE_GIANT, "color_index_bv": -0.23, "distance_light_years": 390.0, "temperature_kelvin": 25000, "luminosity": 41700, "mass_solar": 13.0, "radius_solar": 9.0},
    {"hip_id": "HIP 97649", "catalog_id": "HIP 97649", "common_name": "Altair", "scientific_name": "Alpha Aquilae", "ra": 297.6958, "dec": 8.8683, "magnitude": 0.77, "absolute_magnitude": 2.21, "constellation": "Aquila", "constellation_abbr": "Aql", "spectral_class": "A7V", "star_type": StarType.MAIN_SEQUENCE, "color_index_bv": 0.22, "distance_light_years": 16.73, "temperature_kelvin": 7670, "luminosity": 10.6, "mass_solar": 1.86, "radius_solar": 1.63},
    {"hip_id": "HIP 65474", "catalog_id": "HIP 65474", "common_name": "Spica", "scientific_name": "Alpha Virginis", "ra": 201.2983, "dec": -11.1613, "magnitude": 0.98, "absolute_magnitude": -3.55, "constellation": "Virgo", "constellation_abbr": "Vir", "spectral_class": "B1V", "star_type": StarType.MAIN_SEQUENCE, "color_index_bv": -0.23, "distance_light_years": 250.0, "temperature_kelvin": 25300, "luminosity": 12100, "mass_solar": 10.25, "radius_solar": 7.4},
    {"hip_id": "HIP 80763", "catalog_id": "HIP 80763", "common_name": "Antares", "scientific_name": "Alpha Scorpii", "ra": 247.3519, "dec": -26.4320, "magnitude": 1.09, "absolute_magnitude": -5.28, "constellation": "Scorpius", "constellation_abbr": "Sco", "spectral_class": "M1Iab", "star_type": StarType.SUPERGIANT, "color_index_bv": 1.83, "distance_light_years": 550.0, "temperature_kelvin": 3400, "luminosity": 57500, "mass_solar": 12.4, "radius_solar": 700.0},
    {"hip_id": "HIP 113368", "catalog_id": "HIP 113368", "common_name": "Fomalhaut", "scientific_name": "Alpha Piscis Austrini", "ra": 344.4129, "dec": -29.6223, "magnitude": 1.16, "absolute_magnitude": 1.74, "constellation": "Piscis Austrinus", "constellation_abbr": "PsA", "spectral_class": "A3V", "star_type": StarType.MAIN_SEQUENCE, "color_index_bv": 0.09, "distance_light_years": 25.13, "temperature_kelvin": 8590, "luminosity": 16.6, "mass_solar": 1.92, "radius_solar": 1.84},
    {"hip_id": "HIP 49669", "catalog_id": "HIP 49669", "common_name": "Pollux", "scientific_name": "Beta Geminorum", "ra": 116.3289, "dec": 28.0262, "magnitude": 1.14, "absolute_magnitude": 1.08, "constellation": "Gemini", "constellation_abbr": "Gem", "spectral_class": "K0IIIb", "star_type": StarType.RED_GIANT, "color_index_bv": 1.0, "distance_light_years": 33.78, "temperature_kelvin": 4865, "luminosity": 32.7, "mass_solar": 1.91, "radius_solar": 9.06},
    {"hip_id": "HIP 36850", "catalog_id": "HIP 36850", "common_name": "Castor", "scientific_name": "Alpha Geminorum", "ra": 113.6495, "dec": 31.8883, "magnitude": 1.58, "absolute_magnitude": 0.59, "constellation": "Gemini", "constellation_abbr": "Gem", "spectral_class": "A1V", "star_type": StarType.BINARY_STAR, "color_index_bv": 0.04, "distance_light_years": 51.0, "temperature_kelvin": 10286, "luminosity": 52.0, "mass_solar": 2.76, "radius_solar": 2.089},
    {"hip_id": "HIP 109268", "catalog_id": "HIP 109268", "common_name": "Deneb", "scientific_name": "Alpha Cygni", "ra": 310.3580, "dec": 45.2803, "magnitude": 1.25, "absolute_magnitude": -8.38, "constellation": "Cygnus", "constellation_abbr": "Cyg", "spectral_class": "A2Ia", "star_type": StarType.SUPERGIANT, "color_index_bv": 0.09, "distance_light_years": 2615.0, "temperature_kelvin": 8525, "luminosity": 196000, "mass_solar": 19.0, "radius_solar": 203.0},
    {"hip_id": "HIP 21421", "catalog_id": "HIP 21421", "common_name": "Aldebaran", "scientific_name": "Alpha Tauri", "ra": 68.9800, "dec": 16.5093, "magnitude": 0.85, "absolute_magnitude": -0.63, "constellation": "Taurus", "constellation_abbr": "Tau", "spectral_class": "K5III", "star_type": StarType.RED_GIANT, "color_index_bv": 1.54, "distance_light_years": 65.1, "temperature_kelvin": 3910, "luminosity": 439.0, "mass_solar": 1.5, "radius_solar": 44.2},
    {"hip_id": "HIP 746", "catalog_id": "HIP 746", "common_name": "Alpheratz", "scientific_name": "Alpha Andromedae", "ra": 2.0969, "dec": 29.0904, "magnitude": 2.06, "absolute_magnitude": -0.30, "constellation": "Andromeda", "constellation_abbr": "And", "spectral_class": "B9p", "star_type": StarType.MAIN_SEQUENCE, "color_index_bv": -0.11, "distance_light_years": 97.0, "temperature_kelvin": 13800, "luminosity": 200.0, "mass_solar": 3.6, "radius_solar": 2.7},
    {"hip_id": "HIP 60718", "catalog_id": "HIP 60718", "common_name": "Acrux", "scientific_name": "Alpha Crucis", "ra": 186.6496, "dec": -63.0991, "magnitude": 0.77, "absolute_magnitude": -4.19, "constellation": "Crux", "constellation_abbr": "Cru", "spectral_class": "B0.5IV", "star_type": StarType.MAIN_SEQUENCE, "color_index_bv": -0.26, "distance_light_years": 320.0, "temperature_kelvin": 28000, "luminosity": 25000, "mass_solar": 17.8, "radius_solar": 7.8},
    {"hip_id": "HIP 62434", "catalog_id": "HIP 62434", "common_name": "Mimosa", "scientific_name": "Beta Crucis", "ra": 191.9303, "dec": -59.6888, "magnitude": 1.25, "absolute_magnitude": -3.92, "constellation": "Crux", "constellation_abbr": "Cru", "spectral_class": "B0.5III", "star_type": StarType.BLUE_GIANT, "color_index_bv": -0.23, "distance_light_years": 280.0, "temperature_kelvin": 27000, "luminosity": 34000, "mass_solar": 16.0, "radius_solar": 8.4},
    {"hip_id": "HIP 71683", "catalog_id": "HIP 71683", "common_name": "Rigil Kentaurus", "scientific_name": "Alpha Centauri A", "ra": 219.9021, "dec": -60.8340, "magnitude": -0.01, "absolute_magnitude": 4.34, "constellation": "Centaurus", "constellation_abbr": "Cen", "spectral_class": "G2V", "star_type": StarType.YELLOW_DWARF, "color_index_bv": 0.71, "distance_light_years": 4.37, "temperature_kelvin": 5790, "luminosity": 1.519, "mass_solar": 1.1, "radius_solar": 1.227},
    {"hip_id": "HIP 25336", "catalog_id": "HIP 25336", "common_name": "Bellatrix", "scientific_name": "Gamma Orionis", "ra": 81.2828, "dec": 6.3497, "magnitude": 1.64, "absolute_magnitude": -2.72, "constellation": "Orion", "constellation_abbr": "Ori", "spectral_class": "B2III", "star_type": StarType.BLUE_GIANT, "color_index_bv": -0.22, "distance_light_years": 243.0, "temperature_kelvin": 22000, "luminosity": 6400, "mass_solar": 8.4, "radius_solar": 5.75},
    {"hip_id": "HIP 26727", "catalog_id": "HIP 26727", "common_name": "Mintaka", "scientific_name": "Delta Orionis", "ra": 83.0016, "dec": -0.2991, "magnitude": 2.23, "absolute_magnitude": -4.99, "constellation": "Orion", "constellation_abbr": "Ori", "spectral_class": "O9.5II", "star_type": StarType.BINARY_STAR, "color_index_bv": -0.22, "distance_light_years": 900.0, "temperature_kelvin": 31000, "luminosity": 90000, "mass_solar": 24.0, "radius_solar": 16.5},
    {"hip_id": "HIP 25930", "catalog_id": "HIP 25930", "common_name": "Alnilam", "scientific_name": "Epsilon Orionis", "ra": 84.0534, "dec": -1.2019, "magnitude": 1.70, "absolute_magnitude": -6.38, "constellation": "Orion", "constellation_abbr": "Ori", "spectral_class": "B0Ia", "star_type": StarType.SUPERGIANT, "color_index_bv": -0.19, "distance_light_years": 1340.0, "temperature_kelvin": 27000, "luminosity": 275000, "mass_solar": 40.0, "radius_solar": 32.4},
    {"hip_id": "HIP 26311", "catalog_id": "HIP 26311", "common_name": "Alnitak", "scientific_name": "Zeta Orionis", "ra": 85.1897, "dec": -1.9426, "magnitude": 1.77, "absolute_magnitude": -5.26, "constellation": "Orion", "constellation_abbr": "Ori", "spectral_class": "O9.7Ib", "star_type": StarType.SUPERGIANT, "color_index_bv": -0.21, "distance_light_years": 800.0, "temperature_kelvin": 29500, "luminosity": 100000, "mass_solar": 28.0, "radius_solar": 20.0},
    {"hip_id": "HIP 11767", "catalog_id": "HIP 11767", "common_name": "Polaris", "scientific_name": "Alpha Ursae Minoris", "ra": 37.9529, "dec": 89.2641, "magnitude": 1.97, "absolute_magnitude": -3.64, "constellation": "Ursa Minor", "constellation_abbr": "UMi", "spectral_class": "F7Ib", "star_type": StarType.CEPHEID_VARIABLE, "color_index_bv": 0.60, "distance_light_years": 431.0, "temperature_kelvin": 6015, "luminosity": 2500, "mass_solar": 5.4, "radius_solar": 37.5},
    {"hip_id": "HIP 54061", "catalog_id": "HIP 54061", "common_name": "Dubhe", "scientific_name": "Alpha Ursae Majoris", "ra": 165.9320, "dec": 61.7510, "magnitude": 1.79, "absolute_magnitude": -1.10, "constellation": "Ursa Major", "constellation_abbr": "UMa", "spectral_class": "K0III", "star_type": StarType.RED_GIANT, "color_index_bv": 1.07, "distance_light_years": 123.0, "temperature_kelvin": 4960, "luminosity": 316.0, "mass_solar": 3.44, "radius_solar": 17.0},
    {"hip_id": "HIP 95947", "catalog_id": "HIP 95947", "common_name": "Albireo", "scientific_name": "Beta Cygni", "ra": 292.6804, "dec": 27.9597, "magnitude": 3.09, "absolute_magnitude": -2.45, "constellation": "Cygnus", "constellation_abbr": "Cyg", "spectral_class": "K3II", "star_type": StarType.BINARY_STAR, "color_index_bv": 1.09, "distance_light_years": 430.0, "temperature_kelvin": 4270, "luminosity": 950.0, "mass_solar": 6.2, "radius_solar": 50.0},
    {"hip_id": "HIP 67301", "catalog_id": "HIP 67301", "common_name": "Mizar", "scientific_name": "Zeta Ursae Majoris", "ra": 200.9813, "dec": 54.9253, "magnitude": 2.27, "absolute_magnitude": 0.33, "constellation": "Ursa Major", "constellation_abbr": "UMa", "spectral_class": "A2V", "star_type": StarType.BINARY_STAR, "color_index_bv": 0.02, "distance_light_years": 78.0, "temperature_kelvin": 9000, "luminosity": 78.0, "mass_solar": 2.2, "radius_solar": 2.4},
    {"hip_id": "HIP 102098", "catalog_id": "HIP 102098", "common_name": "Sadr", "scientific_name": "Gamma Cygni", "ra": 305.5571, "dec": 40.2567, "magnitude": 2.23, "absolute_magnitude": -6.12, "constellation": "Cygnus", "constellation_abbr": "Cyg", "spectral_class": "F8Ib", "star_type": StarType.SUPERGIANT, "color_index_bv": 0.67, "distance_light_years": 1800.0, "temperature_kelvin": 5790, "luminosity": 65000, "mass_solar": 12.11, "radius_solar": 150.0},
    {"hip_id": "HIP 45238", "catalog_id": "HIP 45238", "common_name": "Alphard", "scientific_name": "Alpha Hydrae", "ra": 141.8968, "dec": -8.6586, "magnitude": 1.98, "absolute_magnitude": -1.69, "constellation": "Hydra", "constellation_abbr": "Hya", "spectral_class": "K3II-III", "star_type": StarType.RED_GIANT, "color_index_bv": 1.44, "distance_light_years": 177.0, "temperature_kelvin": 4120, "luminosity": 780.0, "mass_solar": 3.03, "radius_solar": 50.5},
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(Star).count()
        if existing > 0:
            print(f"Stars already seeded ({existing} records). Skipping.")
            return

        for data in SEED_STARS:
            star = Star(
                catalog_id=data["catalog_id"],
                hip_id=data.get("hip_id"),
                common_name=data.get("common_name"),
                scientific_name=data.get("scientific_name"),
                ra=data["ra"],
                dec=data["dec"],
                ra_unit=RAUnit.DEGREES,
                magnitude=data.get("magnitude"),
                absolute_magnitude=data.get("absolute_magnitude"),
                constellation=data.get("constellation"),
                constellation_abbr=data.get("constellation_abbr"),
                spectral_class=data.get("spectral_class"),
                star_type=data.get("star_type", StarType.UNKNOWN),
                color_index_bv=data.get("color_index_bv"),
                distance_light_years=data.get("distance_light_years"),
                temperature_kelvin=data.get("temperature_kelvin"),
                luminosity=data.get("luminosity"),
                mass_solar=data.get("mass_solar"),
                radius_solar=data.get("radius_solar"),
                is_visible_naked_eye=True,
                is_available_for_naming=True,
                registry_status=RegistryStatus.AVAILABLE,
            )
            db.add(star)

        db.commit()
        print(f"Seeded {len(SEED_STARS)} stars successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
