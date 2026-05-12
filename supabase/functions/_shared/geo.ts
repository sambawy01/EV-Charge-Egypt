/**
 * Lightweight geo helpers (no deps).
 *
 * Used by ai-route-planner to pre-filter the station list to a corridor
 * around the great-circle line between origin and destination — this is
 * what shrinks the AI prompt from ~30K tokens to ~3K.
 */

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Great-circle distance between two lat/lng points, in km.
 */
export function haversineKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/**
 * Perpendicular distance from a point P to the segment A→B, in km.
 * Uses a local equirectangular projection — accurate enough for <500km
 * routes within Egypt and orders of magnitude faster than spherical math.
 */
export function perpDistanceKm(
  pLat: number,
  pLng: number,
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  // Project to a flat plane centered at A.
  const meanLatRad = toRad((aLat + bLat) / 2);
  const kmPerDegLat = 111.32;
  const kmPerDegLng = 111.32 * Math.cos(meanLatRad);

  const ax = 0;
  const ay = 0;
  const bx = (bLng - aLng) * kmPerDegLng;
  const by = (bLat - aLat) * kmPerDegLat;
  const px = (pLng - aLng) * kmPerDegLng;
  const py = (pLat - aLat) * kmPerDegLat;

  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    // A and B coincide — fall back to point distance.
    return Math.sqrt(px * px + py * py);
  }

  // Parametric projection of P onto segment AB.
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  const ex = px - cx;
  const ey = py - cy;
  return Math.sqrt(ex * ex + ey * ey);
}

/**
 * Filter stations to those within `maxCorridorKm` of the route line and
 * return at most `maxStations`, sorted by distance to the route.
 */
export function filterStationsToCorridor<
  T extends { latitude: number | null; longitude: number | null },
>(
  stations: T[],
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  maxCorridorKm: number,
  maxStations: number,
): T[] {
  const scored: Array<{ s: T; d: number }> = [];
  for (const s of stations) {
    if (typeof s.latitude !== 'number' || typeof s.longitude !== 'number') {
      continue;
    }
    const d = perpDistanceKm(
      s.latitude,
      s.longitude,
      originLat,
      originLng,
      destLat,
      destLng,
    );
    if (d <= maxCorridorKm) {
      scored.push({ s, d });
    }
  }
  scored.sort((a, b) => a.d - b.d);
  return scored.slice(0, maxStations).map((x) => x.s);
}
