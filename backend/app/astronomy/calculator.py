"""
Astronomy calculation module: RA/DEC to Altitude/Azimuth conversion.
Uses precise spherical trigonometry — no placeholder math.
"""
import math
from datetime import datetime, timezone
from typing import Tuple


def julian_date(dt: datetime) -> float:
    """Calculate Julian Date from a UTC datetime."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    y = dt.year
    m = dt.month
    d = dt.day + (dt.hour + dt.minute / 60 + dt.second / 3600 + dt.microsecond / 3.6e9) / 24
    if m <= 2:
        y -= 1
        m += 12
    A = int(y / 100)
    B = 2 - A + int(A / 4)
    return int(365.25 * (y + 4716)) + int(30.6001 * (m + 1)) + d + B - 1524.5


def greenwich_mean_sidereal_time(jd: float) -> float:
    """Calculate GMST in degrees for a given Julian Date."""
    T = (jd - 2451545.0) / 36525.0
    gmst = (
        280.46061837
        + 360.98564736629 * (jd - 2451545.0)
        + 0.000387933 * T * T
        - T * T * T / 38710000.0
    )
    return gmst % 360.0


def local_sidereal_time(jd: float, longitude_deg: float) -> float:
    """Calculate Local Sidereal Time in degrees."""
    lst = greenwich_mean_sidereal_time(jd) + longitude_deg
    return lst % 360.0


def ra_dec_to_alt_az(
    ra_deg: float,
    dec_deg: float,
    lat_deg: float,
    lon_deg: float,
    dt: datetime,
) -> Tuple[float, float]:
    """
    Convert Right Ascension / Declination to Altitude / Azimuth.

    Args:
        ra_deg:  Right Ascension in degrees (0–360)
        dec_deg: Declination in degrees (-90 to +90)
        lat_deg: Observer latitude in degrees
        lon_deg: Observer longitude in degrees
        dt:      UTC datetime

    Returns:
        (altitude_deg, azimuth_deg)
        altitude: degrees above horizon (-90 to +90)
        azimuth: degrees from North clockwise (0–360)
    """
    jd = julian_date(dt)
    lst_deg = local_sidereal_time(jd, lon_deg)

    # Hour angle
    ha_deg = (lst_deg - ra_deg) % 360.0

    # Convert to radians
    ha = math.radians(ha_deg)
    dec = math.radians(dec_deg)
    lat = math.radians(lat_deg)

    # Altitude
    sin_alt = (
        math.sin(dec) * math.sin(lat)
        + math.cos(dec) * math.cos(lat) * math.cos(ha)
    )
    alt = math.asin(max(-1.0, min(1.0, sin_alt)))

    # Azimuth
    cos_az = (math.sin(dec) - math.sin(alt) * math.sin(lat)) / (
        math.cos(alt) * math.cos(lat) + 1e-10
    )
    cos_az = max(-1.0, min(1.0, cos_az))
    az = math.acos(cos_az)

    if math.sin(ha) > 0:
        az = 2 * math.pi - az

    return math.degrees(alt), math.degrees(az)


def is_star_visible(altitude_deg: float) -> bool:
    """A star is visible above the horizon when altitude > 0."""
    return altitude_deg > 0.0


def ra_hours_to_degrees(ra_hours: float) -> float:
    """Convert Right Ascension from hours to degrees."""
    return ra_hours * 15.0


def alt_az_to_cartesian(alt_deg: float, az_deg: float) -> Tuple[float, float, float]:
    """
    Convert altitude/azimuth to a 3D Cartesian unit vector.
    Convention: y-up, x-east, z-north (right-handed).
    This is used for Three.js star positioning.
    """
    alt = math.radians(alt_deg)
    az = math.radians(az_deg)

    x = math.cos(alt) * math.sin(az)   # East component
    y = math.sin(alt)                   # Up component
    z = -math.cos(alt) * math.cos(az)  # North (negated for Three.js)

    return x, y, z
