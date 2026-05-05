"use client";
import { useMemo } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useARStore } from "@/lib/store";

type SkyPoint = { ra: number; dec: number };
type SkyLine = { id: string; label: string; points: SkyPoint[]; labelPoint?: SkyPoint; zodiac?: boolean };

const CONSTELLATION_LINES: SkyLine[] = [
  {
    id: "orion",
    label: "Orion",
    points: [
      { ra: 88.7929, dec: 7.4071 },
      { ra: 83.0017, dec: -0.2991 },
      { ra: 81.2828, dec: 6.3497 },
      { ra: 78.6345, dec: -8.2016 },
      { ra: 85.1897, dec: -1.9426 },
      { ra: 84.0534, dec: -1.2019 },
      { ra: 83.8583, dec: -5.91 },
    ],
  },
  {
    id: "ursa-major",
    label: "Ursa Major",
    points: [
      { ra: 165.4603, dec: 56.3824 },
      { ra: 165.932, dec: 61.751 },
      { ra: 178.4577, dec: 53.6948 },
      { ra: 183.8565, dec: 57.0326 },
      { ra: 193.5073, dec: 55.9598 },
      { ra: 200.9814, dec: 54.9254 },
      { ra: 206.8856, dec: 49.3133 },
    ],
  },
  {
    id: "cassiopeia",
    label: "Cassiopeia",
    points: [
      { ra: 2.2945, dec: 59.1498 },
      { ra: 10.1271, dec: 56.5373 },
      { ra: 14.1772, dec: 60.7167 },
      { ra: 21.4541, dec: 60.2353 },
      { ra: 28.5989, dec: 63.67 },
    ],
  },
  {
    id: "cygnus",
    label: "Cygnus",
    points: [
      { ra: 310.3579, dec: 45.2803 },
      { ra: 305.5571, dec: 40.2567 },
      { ra: 296.2437, dec: 45.1308 },
      { ra: 292.6803, dec: 27.9597 },
      { ra: 305.5571, dec: 40.2567 },
      { ra: 326.035, dec: 48.7284 },
    ],
  },
  {
    id: "leo",
    label: "Leo",
    points: [
      { ra: 152.0929, dec: 11.9672 },
      { ra: 154.9931, dec: 19.8415 },
      { ra: 168.5271, dec: 20.5237 },
      { ra: 177.2649, dec: 14.5721 },
      { ra: 170.284, dec: 6.0294 },
      { ra: 152.0929, dec: 11.9672 },
    ],
  },
];

const ZODIAC_LINES: SkyLine[] = [
  {
    id: "aries",
    label: "Aries",
    zodiac: true,
    labelPoint: { ra: 29, dec: 22 },
    points: [
      { ra: 31.7933, dec: 23.4624 },
      { ra: 28.66, dec: 20.808 },
      { ra: 26.017, dec: 21.0347 },
    ],
  },
  {
    id: "taurus",
    label: "Taurus",
    zodiac: true,
    labelPoint: { ra: 72, dec: 21 },
    points: [
      { ra: 68.98, dec: 16.5093 },
      { ra: 66.3724, dec: 17.9279 },
      { ra: 67.1542, dec: 19.1804 },
      { ra: 68.98, dec: 16.5093 },
      { ra: 81.5729, dec: 28.6075 },
      { ra: 84.4112, dec: 21.1426 },
      { ra: 68.98, dec: 16.5093 },
      { ra: 75.4922, dec: 43.8233 },
    ],
  },
  {
    id: "gemini",
    label: "Gemini",
    zodiac: true,
    labelPoint: { ra: 108, dec: 24 },
    points: [
      { ra: 113.65, dec: 31.8883 },
      { ra: 110.0308, dec: 21.9823 },
      { ra: 101.3225, dec: 12.8961 },
      { ra: 116.3289, dec: 28.0262 },
      { ra: 110.0308, dec: 21.9823 },
      { ra: 99.4279, dec: 16.3993 },
    ],
  },
  {
    id: "cancer",
    label: "Cancer",
    zodiac: true,
    labelPoint: { ra: 130, dec: 16 },
    points: [
      { ra: 130.8217, dec: 21.4686 },
      { ra: 131.1712, dec: 18.1543 },
      { ra: 124.1289, dec: 9.1857 },
      { ra: 131.1712, dec: 18.1543 },
      { ra: 134.6217, dec: 11.8577 },
    ],
  },
  {
    id: "leo",
    label: "Leo",
    zodiac: true,
    labelPoint: { ra: 166, dec: 15 },
    points: [
      { ra: 152.0929, dec: 11.9672 },
      { ra: 154.9931, dec: 19.8415 },
      { ra: 168.5271, dec: 20.5237 },
      { ra: 177.2649, dec: 14.5721 },
      { ra: 170.284, dec: 6.0294 },
      { ra: 152.0929, dec: 11.9672 },
    ],
  },
  {
    id: "virgo",
    label: "Virgo",
    zodiac: true,
    labelPoint: { ra: 190, dec: -3 },
    points: [
      { ra: 201.2983, dec: -11.1614 },
      { ra: 190.415, dec: -1.4494 },
      { ra: 177.6738, dec: 1.7647 },
      { ra: 174.1706, dec: -9.8023 },
      { ra: 190.415, dec: -1.4494 },
      { ra: 203.6733, dec: -0.5958 },
    ],
  },
  {
    id: "libra",
    label: "Libra",
    zodiac: true,
    labelPoint: { ra: 228, dec: -16 },
    points: [
      { ra: 222.7196, dec: -16.0418 },
      { ra: 229.2517, dec: -9.3829 },
      { ra: 233.8816, dec: -14.7895 },
      { ra: 226.0176, dec: -25.2819 },
      { ra: 222.7196, dec: -16.0418 },
      { ra: 233.8816, dec: -14.7895 },
    ],
  },
  {
    id: "scorpius",
    label: "Scorpius",
    zodiac: true,
    labelPoint: { ra: 255, dec: -32 },
    points: [
      { ra: 240.0833, dec: -22.6217 },
      { ra: 247.3519, dec: -26.4319 },
      { ra: 247.5553, dec: -25.1152 },
      { ra: 250.3228, dec: -43.1179 },
      { ra: 263.7336, dec: -37.1038 },
      { ra: 264.3297, dec: -42.9978 },
      { ra: 263.4022, dec: -37.1038 },
      { ra: 258.0382, dec: -43.2392 },
    ],
  },
  {
    id: "sagittarius",
    label: "Sagittarius",
    zodiac: true,
    labelPoint: { ra: 279, dec: -31 },
    points: [
      { ra: 276.0431, dec: -34.3846 },
      { ra: 283.8163, dec: -26.2967 },
      { ra: 276.9928, dec: -25.4217 },
      { ra: 271.4521, dec: -30.4241 },
      { ra: 276.0431, dec: -34.3846 },
      { ra: 271.4521, dec: -30.4241 },
      { ra: 274.4072, dec: -36.7613 },
      { ra: 276.0431, dec: -34.3846 },
      { ra: 283.8163, dec: -26.2967 },
      { ra: 286.735, dec: -27.6704 },
    ],
  },
  {
    id: "capricornus",
    label: "Capricornus",
    zodiac: true,
    labelPoint: { ra: 315, dec: -17 },
    points: [
      { ra: 304.5137, dec: -12.5449 },
      { ra: 305.2528, dec: -14.7814 },
      { ra: 312.9554, dec: -26.9191 },
      { ra: 326.7602, dec: -16.1273 },
      { ra: 325.0227, dec: -16.6623 },
      { ra: 304.5137, dec: -12.5449 },
    ],
  },
  {
    id: "aquarius",
    label: "Aquarius",
    zodiac: true,
    labelPoint: { ra: 333, dec: -6 },
    points: [
      { ra: 322.8897, dec: -5.5712 },
      { ra: 331.4459, dec: -0.3199 },
      { ra: 337.2075, dec: -0.0201 },
      { ra: 343.6627, dec: -15.8208 },
      { ra: 337.2075, dec: -0.0201 },
      { ra: 334.2082, dec: -7.7833 },
      { ra: 322.8897, dec: -5.5712 },
    ],
  },
  {
    id: "pisces",
    label: "Pisces",
    zodiac: true,
    labelPoint: { ra: 18, dec: 16 },
    points: [
      { ra: 2.0965, dec: 29.0904 },
      { ra: 15.7361, dec: 7.8901 },
      { ra: 22.8708, dec: 15.3458 },
      { ra: 28.3824, dec: 19.2938 },
      { ra: 22.8708, dec: 15.3458 },
      { ra: 17.8633, dec: 21.0347 },
      { ra: 15.7361, dec: 7.8901 },
    ],
  },
];

const MILKY_WAY_PATH: SkyPoint[] = [
  { ra: 266.4, dec: -29 },
  { ra: 276, dec: -18 },
  { ra: 290, dec: 0 },
  { ra: 305, dec: 25 },
  { ra: 315, dec: 45 },
  { ra: 22, dec: 62 },
  { ra: 50, dec: 55 },
  { ra: 80, dec: 30 },
  { ra: 95, dec: 5 },
  { ra: 105, dec: -20 },
  { ra: 125, dec: -45 },
  { ra: 155, dec: -60 },
  { ra: 190, dec: -62 },
  { ra: 230, dec: -45 },
  { ra: 266.4, dec: -29 },
];

interface Props {
  showConstellations: boolean;
  showMilkyWay: boolean;
  showZodiac: boolean;
  showPlanetariumGuides: boolean;
  timestamp: number;
  highlightedZodiacId?: string | null;
  onZodiacHover?: (id: string | null) => void;
  sphereRadius?: number;
}

function julianDate(ms: number): number {
  return ms / 86400000 + 2440587.5;
}

function gmst(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  const g =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000.0;
  return ((g % 360) + 360) % 360;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function project(point: SkyPoint, lat: number, lon: number, timestamp: number, radius: number): THREE.Vector3 {
  const lst = ((gmst(julianDate(timestamp)) + lon) % 360 + 360) % 360;
  const ha = toRad(((lst - point.ra) % 360 + 360) % 360);
  const dec = toRad(point.dec);
  const latRad = toRad(lat);
  const sinAlt = Math.sin(dec) * Math.sin(latRad) + Math.cos(dec) * Math.cos(latRad) * Math.cos(ha);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const cosAz =
    (Math.sin(dec) - Math.sin(alt) * Math.sin(latRad)) /
    (Math.cos(alt) * Math.cos(latRad) + 1e-10);
  let az = Math.acos(Math.max(-1, Math.min(1, cosAz)));
  if (Math.sin(ha) > 0) az = 2 * Math.PI - az;
  return new THREE.Vector3(
    Math.cos(alt) * Math.sin(az) * radius,
    Math.sin(alt) * radius,
    -Math.cos(alt) * Math.cos(az) * radius,
  );
}

function makeGeometry(points: SkyPoint[], lat: number, lon: number, timestamp: number, radius: number) {
  return new THREE.BufferGeometry().setFromPoints(
    points.map((point) => project(point, lat, lon, timestamp, radius)),
  );
}

function makeCircle(dec: number, step = 10): SkyPoint[] {
  const points: SkyPoint[] = [];
  for (let ra = 0; ra <= 360; ra += step) points.push({ ra, dec });
  return points;
}

function makeEcliptic(step = 10): SkyPoint[] {
  const tilt = 23.439;
  const points: SkyPoint[] = [];
  for (let lon = 0; lon <= 360; lon += step) {
    const lambda = toRad(lon);
    const ra = Math.atan2(Math.sin(lambda) * Math.cos(toRad(tilt)), Math.cos(lambda));
    const dec = Math.asin(Math.sin(lambda) * Math.sin(toRad(tilt)));
    points.push({ ra: ((ra * 180) / Math.PI + 360) % 360, dec: (dec * 180) / Math.PI });
  }
  return points;
}

export function SkyLineOverlay({
  showConstellations,
  showMilkyWay,
  showZodiac,
  showPlanetariumGuides,
  timestamp,
  highlightedZodiacId,
  onZodiacHover,
  sphereRadius = 500,
}: Props) {
  const { location } = useARStore();
  const geometries = useMemo(() => {
    if (!location) return { constellations: [], milkyWay: null };
    return {
      constellations: CONSTELLATION_LINES.map((line) => ({
        ...line,
        geometry: makeGeometry(line.points, location.lat, location.lon, timestamp, sphereRadius),
        labelPosition: project(line.points[Math.floor(line.points.length / 2)], location.lat, location.lon, timestamp, sphereRadius),
      })),
      zodiac: ZODIAC_LINES.map((line) => ({
        ...line,
        geometry: makeGeometry(line.points, location.lat, location.lon, timestamp, sphereRadius * 1.004),
        labelPosition: project(line.labelPoint ?? line.points[Math.floor(line.points.length / 2)], location.lat, location.lon, timestamp, sphereRadius * 1.004),
      })),
      milkyWay: makeGeometry(MILKY_WAY_PATH, location.lat, location.lon, timestamp, sphereRadius * 0.995),
      milkyWayDust: [-2.5, -1.2, 1.3, 2.7].map((offset) =>
        makeGeometry(
          MILKY_WAY_PATH.map((point) => ({ ...point, dec: point.dec + offset })),
          location.lat,
          location.lon,
          timestamp,
          sphereRadius * 0.992,
        )
      ),
      equator: makeGeometry(makeCircle(0), location.lat, location.lon, timestamp, sphereRadius * 0.998),
      tropicNorth: makeGeometry(makeCircle(23.439), location.lat, location.lon, timestamp, sphereRadius * 0.998),
      tropicSouth: makeGeometry(makeCircle(-23.439), location.lat, location.lon, timestamp, sphereRadius * 0.998),
      ecliptic: makeGeometry(makeEcliptic(), location.lat, location.lon, timestamp, sphereRadius * 1.002),
    };
  }, [location, sphereRadius, timestamp]);

  if (!location) return null;

  return (
    <group>
      {showMilkyWay && geometries.milkyWay && (
        <>
          <LinePrimitive geometry={geometries.milkyWay} color="#9fc3ff" opacity={0.22} />
          {geometries.milkyWayDust?.map((geometry, index) => (
            <LinePrimitive key={index} geometry={geometry} color={index % 2 ? "#ffd8a8" : "#6aa6ff"} opacity={0.09} />
          ))}
        </>
      )}
      {showPlanetariumGuides && geometries.equator && geometries.tropicNorth && geometries.tropicSouth && geometries.ecliptic && (
        <>
          <LinePrimitive geometry={geometries.equator} color="#7eb8f7" opacity={0.2} />
          <LinePrimitive geometry={geometries.tropicNorth} color="#7eb8f7" opacity={0.1} />
          <LinePrimitive geometry={geometries.tropicSouth} color="#7eb8f7" opacity={0.1} />
          <LinePrimitive geometry={geometries.ecliptic} color="#ffd700" opacity={0.42} />
        </>
      )}
      {showConstellations &&
        geometries.constellations.map((line) => (
          <group key={line.id}>
            <LinePrimitive geometry={line.geometry} color="#7eb8f7" opacity={0.36} />
            <Html position={line.labelPosition} center distanceFactor={85} style={{ pointerEvents: "none" }}>
              <div className="constellation-label">{line.label}</div>
            </Html>
          </group>
        ))}
      {showZodiac &&
        geometries.zodiac &&
        geometries.zodiac.map((line) => (
          <group key={line.id}>
            <LinePrimitive
              geometry={line.geometry}
              color="#ffd700"
              opacity={highlightedZodiacId === line.id ? 0.95 : 0.58}
              lineWidth={highlightedZodiacId === line.id ? 5 : 3}
            />
            <LinePrimitive
              geometry={line.geometry}
              color="#ffd700"
              opacity={0.01}
              lineWidth={16}
              onPointerEnter={() => onZodiacHover?.(line.id)}
              onPointerLeave={() => onZodiacHover?.(null)}
              onPointerDown={(event) => {
                event.stopPropagation();
                onZodiacHover?.(line.id);
              }}
            />
            {highlightedZodiacId === line.id && <Html position={line.labelPosition} center distanceFactor={34} zIndexRange={[70, 0]}>
              <div
                className="zodiac-label zodiac-label-active"
                onPointerEnter={() => onZodiacHover?.(line.id)}
                onPointerLeave={() => onZodiacHover?.(null)}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  onZodiacHover?.(line.id);
                }}
              >
                <span>Zodiac</span>
                <strong>{line.label}</strong>
              </div>
            </Html>}
          </group>
        ))}
    </group>
  );
}

function LinePrimitive({
  geometry,
  color,
  opacity,
  lineWidth = 1,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
}: {
  geometry: THREE.BufferGeometry;
  color: string;
  opacity: number;
  lineWidth?: number;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  onPointerDown?: (event: { stopPropagation: () => void }) => void;
}) {
  const line = useMemo(() => {
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity, linewidth: lineWidth });
    return new THREE.Line(geometry, material);
  }, [color, geometry, lineWidth, opacity]);

  return (
    <primitive
      object={line}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
    />
  );
}
