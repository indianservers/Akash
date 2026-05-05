"use client";
import { Html } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { useARStore } from "@/lib/store";
import * as Astronomy from "astronomy-engine";

const PLANETS = [
  { name: "Sun", body: Astronomy.Body.Sun, color: "#ffd76a", size: 18 },
  { name: "Moon", body: Astronomy.Body.Moon, color: "#f4f1df", size: 16 },
  { name: "Mercury", body: Astronomy.Body.Mercury, color: "#b7aa91", size: 7 },
  { name: "Venus", body: Astronomy.Body.Venus, color: "#ffd6a1", size: 10 },
  { name: "Mars", body: Astronomy.Body.Mars, color: "#ff765c", size: 8 },
  { name: "Jupiter", body: Astronomy.Body.Jupiter, color: "#ffe1b8", size: 14 },
  { name: "Saturn", body: Astronomy.Body.Saturn, color: "#f7d58a", size: 13 },
  { name: "Uranus", body: Astronomy.Body.Uranus, color: "#9ee8ff", size: 9 },
  { name: "Neptune", body: Astronomy.Body.Neptune, color: "#7aa8ff", size: 9 },
  { name: "Pluto", body: Astronomy.Body.Pluto, color: "#d1b08f", size: 6 },
];

interface Props {
  timestamp: number;
  show: boolean;
  sphereRadius?: number;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function projectHorizontal(altitude: number, azimuth: number, radius: number) {
  const alt = toRad(altitude);
  const az = toRad(azimuth);
  return new THREE.Vector3(Math.cos(alt) * Math.sin(az) * radius, Math.sin(alt) * radius, -Math.cos(alt) * Math.cos(az) * radius);
}

export function PlanetariumPlanets({ timestamp, show, sphereRadius = 500 }: Props) {
  const { location } = useARStore();
  const objects = useMemo(() => {
    if (!location || !show) return [];
    const observer = new Astronomy.Observer(location.lat, location.lon, location.altitude ?? 0);
    const date = new Date(timestamp);
    return PLANETS.map((planet, index) => {
      const equator = Astronomy.Equator(planet.body, date, observer, true, true);
      const horizon = Astronomy.Horizon(date, observer, equator.ra, equator.dec, "normal");
      return {
        ...planet,
        altitude: horizon.altitude,
        azimuth: horizon.azimuth,
        position: projectHorizontal(horizon.altitude, horizon.azimuth, sphereRadius),
      };
    });
  }, [location, show, sphereRadius, timestamp]);

  if (!location || !show) return null;

  return (
    <>
      {objects.map((planet) => (
        <group key={planet.name} position={planet.position}>
          <sprite scale={[planet.size, planet.size, 1]}>
            <spriteMaterial color={planet.color} transparent opacity={0.95} depthWrite={false} />
          </sprite>
          <Html center distanceFactor={78} style={{ pointerEvents: "none" }}>
            <div className="planetarium-planet-label">{planet.name}</div>
          </Html>
        </group>
      ))}
    </>
  );
}
