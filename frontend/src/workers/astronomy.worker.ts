/**
 * Web Worker: Astronomy calculations off the main thread.
 * Converts RA/DEC → Alt/Az for each star based on observer position and time.
 */

export type WorkerInput = {
  stars: Array<{
    id: number;
    ra: number;
    dec: number;
    ra_unit: "degrees" | "hours";
    magnitude?: number;
  }>;
  lat: number;
  lon: number;
  timestamp: number; // UTC ms
};

export type StarPosition = {
  id: number;
  altitude: number;
  azimuth: number;
  x: number;
  y: number;
  z: number;
  is_visible: boolean;
};

export type WorkerOutput = {
  positions: StarPosition[];
  timestamp: number;
};

function julianDate(ms: number): number {
  return ms / 86400000 + 2440587.5;
}

function gmst(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  let g =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000.0;
  return ((g % 360) + 360) % 360;
}

function lst(jd: number, lonDeg: number): number {
  return ((gmst(jd) + lonDeg) % 360 + 360) % 360;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

function raDecToAltAz(
  raDeg: number,
  decDeg: number,
  latDeg: number,
  lonDeg: number,
  ms: number
): [number, number] {
  const jd = julianDate(ms);
  const lstDeg = lst(jd, lonDeg);
  const haDeg = ((lstDeg - raDeg) % 360 + 360) % 360;

  const ha = toRad(haDeg);
  const dec = toRad(decDeg);
  const lat = toRad(latDeg);

  const sinAlt =
    Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));

  const cosAz =
    (Math.sin(dec) - Math.sin(alt) * Math.sin(lat)) /
    (Math.cos(alt) * Math.cos(lat) + 1e-10);
  let az = Math.acos(Math.max(-1, Math.min(1, cosAz)));
  if (Math.sin(ha) > 0) az = 2 * Math.PI - az;

  return [toDeg(alt), toDeg(az)];
}

function altAzToCartesian(altDeg: number, azDeg: number): [number, number, number] {
  const alt = toRad(altDeg);
  const az = toRad(azDeg);
  const x = Math.cos(alt) * Math.sin(az);
  const y = Math.sin(alt);
  const z = -Math.cos(alt) * Math.cos(az);
  return [x, y, z];
}

self.onmessage = (event: MessageEvent<WorkerInput>) => {
  const { stars, lat, lon, timestamp } = event.data;

  const positions: StarPosition[] = stars.map((star) => {
    const raDeg = star.ra_unit === "hours" ? star.ra * 15 : star.ra;
    const [alt, az] = raDecToAltAz(raDeg, star.dec, lat, lon, timestamp);
    const [x, y, z] = altAzToCartesian(alt, az);

    return {
      id: star.id,
      altitude: alt,
      azimuth: az,
      x,
      y,
      z,
      is_visible: alt > 0,
    };
  });

  const result: WorkerOutput = { positions, timestamp };
  self.postMessage(result);
};
