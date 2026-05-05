"""
Seed real solar-system objects used by the planetarium.

Positions for these bodies are intentionally computed at runtime with
astronomy-engine because planets and the Moon move against the star field.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app.models  # noqa: F401 - register all models
from app.core.database import SessionLocal
from app.models.solar_system_object import SolarSystemObject, SolarSystemObjectType


OBJECTS = [
    {
        "id": "mercury",
        "common_name": "Mercury",
        "object_type": SolarSystemObjectType.PLANET,
        "astronomy_body": "Mercury",
        "mean_radius_km": 2439.7,
        "orbital_period_days": 87.9691,
        "average_magnitude": -0.6,
        "naked_eye_visible": True,
        "notes": "Inner planet; best seen near twilight elongation.",
    },
    {
        "id": "venus",
        "common_name": "Venus",
        "object_type": SolarSystemObjectType.PLANET,
        "astronomy_body": "Venus",
        "mean_radius_km": 6051.8,
        "orbital_period_days": 224.701,
        "average_magnitude": -4.2,
        "naked_eye_visible": True,
        "notes": "Brightest planet from Earth.",
    },
    {
        "id": "mars",
        "common_name": "Mars",
        "object_type": SolarSystemObjectType.PLANET,
        "astronomy_body": "Mars",
        "mean_radius_km": 3389.5,
        "orbital_period_days": 686.980,
        "average_magnitude": -1.5,
        "naked_eye_visible": True,
        "notes": "Red planet; brightness varies strongly near opposition.",
    },
    {
        "id": "jupiter",
        "common_name": "Jupiter",
        "object_type": SolarSystemObjectType.PLANET,
        "astronomy_body": "Jupiter",
        "mean_radius_km": 69911,
        "orbital_period_days": 4332.589,
        "average_magnitude": -2.7,
        "naked_eye_visible": True,
        "notes": "Gas giant; four Galilean moons visible in binoculars.",
    },
    {
        "id": "saturn",
        "common_name": "Saturn",
        "object_type": SolarSystemObjectType.PLANET,
        "astronomy_body": "Saturn",
        "mean_radius_km": 58232,
        "orbital_period_days": 10759.22,
        "average_magnitude": 0.5,
        "naked_eye_visible": True,
        "notes": "Ringed planet; rings require telescope.",
    },
    {
        "id": "uranus",
        "common_name": "Uranus",
        "object_type": SolarSystemObjectType.PLANET,
        "astronomy_body": "Uranus",
        "mean_radius_km": 25362,
        "orbital_period_days": 30685.4,
        "average_magnitude": 5.7,
        "naked_eye_visible": True,
        "notes": "At the edge of naked-eye visibility under dark skies.",
    },
    {
        "id": "neptune",
        "common_name": "Neptune",
        "object_type": SolarSystemObjectType.PLANET,
        "astronomy_body": "Neptune",
        "mean_radius_km": 24622,
        "orbital_period_days": 60189,
        "average_magnitude": 7.8,
        "naked_eye_visible": False,
        "notes": "Requires binoculars or telescope.",
    },
    {
        "id": "pluto",
        "common_name": "Pluto",
        "object_type": SolarSystemObjectType.DWARF_PLANET,
        "astronomy_body": "Pluto",
        "mean_radius_km": 1188.3,
        "orbital_period_days": 90560,
        "average_magnitude": 14.5,
        "naked_eye_visible": False,
        "notes": "Dwarf planet; telescope required.",
    },
    {
        "id": "moon",
        "common_name": "Moon",
        "object_type": SolarSystemObjectType.MOON,
        "astronomy_body": "Moon",
        "mean_radius_km": 1737.4,
        "orbital_period_days": 27.3217,
        "average_magnitude": -12.7,
        "naked_eye_visible": True,
        "notes": "Earth's natural satellite; position and phase are computed at runtime.",
    },
]


def seed() -> None:
    db = SessionLocal()
    try:
        created = 0
        for data in OBJECTS:
            existing = db.query(SolarSystemObject).filter(SolarSystemObject.id == data["id"]).first()
            if existing:
                for key, value in data.items():
                    setattr(existing, key, value)
            else:
                db.add(SolarSystemObject(**data))
                created += 1
        db.commit()
        print(f"Seeded/updated {len(OBJECTS)} solar-system objects ({created} new).")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
