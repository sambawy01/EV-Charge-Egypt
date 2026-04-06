const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '';
const DIRECTIONS_BASE = 'https://maps.googleapis.com/maps/api/directions/json';
const ELEVATION_BASE = 'https://maps.googleapis.com/maps/api/elevation/json';
const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const AUTOCOMPLETE_BASE = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';

// Egyptian cities for instant offline suggestions
const EGYPT_CITIES = [
  'Cairo', 'Alexandria', 'Hurghada', 'Sharm El Sheikh', 'Ain Sokhna',
  'El Gouna', 'Luxor', 'Aswan', 'Port Said', 'Ismailia', 'Suez',
  'Dahab', 'Marsa Alam', 'Ras Sudr', 'El Alamein', 'North Coast',
  'New Cairo', '6th of October', 'Sheikh Zayed', 'Madinaty',
  'New Administrative Capital', '10th of Ramadan', 'Banha', 'Tanta',
  'El Mansoura', 'Damietta', 'Zagazig', 'Fayoum', 'Minya', 'Asyut',
  'Sohag', 'Qena', 'Safaga', 'Soma Bay', 'Makadi Bay',
  'Marina El Alamein', 'Stella Di Mare', 'Galala', 'Sokhna',
];

export interface DirectionsResult {
  totalDistanceKm: number;
  totalDurationMin: number;
  polyline: string; // encoded polyline
  legs: {
    distanceKm: number;
    durationMin: number;
    startAddress: string;
    endAddress: string;
  }[];
  // Waypoints along the route at intervals (for finding nearby stations)
  routePoints: { lat: number; lng: number; distanceFromStartKm: number }[];
}

export interface NearbyPlace {
  name: string;
  type: string;
  icon: string;
  distance: string;
  rating?: number;
  lat: number;
  lng: number;
}

export interface ElevationPoint {
  lat: number;
  lng: number;
  elevation: number; // metres above sea level
  distanceFromStartKm: number;
}

export interface ElevationProfile {
  points: ElevationPoint[];
  totalAscent: number;  // metres
  totalDescent: number; // metres
  minElevation: number;
  maxElevation: number;
}

function getPlaceIcon(types: string[]): { icon: string; type: string } {
  if (types.includes('cafe') || types.includes('coffee')) return { icon: '\u2615', type: 'Coffee' };
  if (types.includes('restaurant') || types.includes('food')) return { icon: '\uD83C\uDF7D\uFE0F', type: 'Restaurant' };
  if (types.includes('bakery')) return { icon: '\uD83E\uDD50', type: 'Bakery' };
  if (types.includes('gas_station')) return { icon: '\u26FD', type: 'Gas Station' };
  if (types.includes('shopping_mall') || types.includes('store')) return { icon: '\uD83D\uDECD\uFE0F', type: 'Shopping' };
  if (types.includes('mosque') || types.includes('church')) return { icon: '\uD83D\uDD4C', type: 'Worship' };
  if (types.includes('pharmacy')) return { icon: '\uD83D\uDC8A', type: 'Pharmacy' };
  if (types.includes('atm') || types.includes('bank')) return { icon: '\uD83C\uDFE6', type: 'ATM' };
  if (types.includes('tourist_attraction') || types.includes('point_of_interest')) return { icon: '\uD83D\uDCCD', type: 'Attraction' };
  if (types.includes('lodging')) return { icon: '\uD83C\uDFE8', type: 'Hotel' };
  return { icon: '\uD83D\uDCCD', type: 'Place' };
}

// Decode Google's encoded polyline to lat/lng points
function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

// Sample points along a polyline at regular km intervals
function sampleRoutePoints(
  polylinePoints: { lat: number; lng: number }[],
  _totalDistanceKm: number,
  intervalKm: number = 30,
): { lat: number; lng: number; distanceFromStartKm: number }[] {
  const result: { lat: number; lng: number; distanceFromStartKm: number }[] = [];
  let accumulatedDist = 0;
  let nextSampleAt = intervalKm;

  for (let i = 1; i < polylinePoints.length; i++) {
    const prev = polylinePoints[i - 1];
    const curr = polylinePoints[i];
    const segDist = haversineKm(prev.lat, prev.lng, curr.lat, curr.lng);
    accumulatedDist += segDist;

    if (accumulatedDist >= nextSampleAt) {
      result.push({ lat: curr.lat, lng: curr.lng, distanceFromStartKm: Math.round(accumulatedDist) });
      nextSampleAt += intervalKm;
    }
  }
  return result;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const googleMapsService = {
  /**
   * Geocode an address string to lat/lng coordinates.
   */
  async geocode(address: string): Promise<{ lat: number; lng: number } | null> {
    if (!GOOGLE_MAPS_KEY) return null;
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'OK' && data.results?.length > 0) {
        const loc = data.results[0].geometry.location;
        return { lat: loc.lat, lng: loc.lng };
      }
      return null;
    } catch (err) {
      console.warn('[googleMapsService] geocode failed:', err);
      return null;
    }
  },

  async getDirections(origin: string, destination: string, waypoints?: string[]): Promise<DirectionsResult | null> {
    if (!GOOGLE_MAPS_KEY) {
      console.warn('[googleMapsService] No API key configured');
      return null;
    }

    try {
      let url = `${DIRECTIONS_BASE}?origin=${encodeURIComponent(origin + ', Egypt')}&destination=${encodeURIComponent(destination + ', Egypt')}&key=${GOOGLE_MAPS_KEY}`;
      if (waypoints && waypoints.length > 0) {
        const waypointStr = waypoints.map(wp => encodeURIComponent(wp + ', Egypt')).join('|');
        url += `&waypoints=${waypointStr}`;
      }
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' || !data.routes?.length) {
        console.warn('[googleMapsService] Directions API error:', data.status);
        return null;
      }

      const route = data.routes[0];
      const legs = route.legs.map((leg: any) => ({
        distanceKm: Math.round(leg.distance.value / 1000),
        durationMin: Math.round(leg.duration.value / 60),
        startAddress: leg.start_address,
        endAddress: leg.end_address,
      }));

      const totalDistanceKm = legs.reduce((sum: number, l: any) => sum + l.distanceKm, 0);
      const totalDurationMin = legs.reduce((sum: number, l: any) => sum + l.durationMin, 0);

      // Decode polyline and sample points every 30km
      const polylinePoints = decodePolyline(route.overview_polyline.points);
      const routePoints = sampleRoutePoints(polylinePoints, totalDistanceKm, 30);

      return {
        totalDistanceKm,
        totalDurationMin,
        polyline: route.overview_polyline.points,
        legs,
        routePoints,
      };
    } catch (err) {
      console.error('[googleMapsService] Directions fetch failed:', err);
      return null;
    }
  },

  async getNearbyPlaces(lat: number, lng: number, radius: number = 1000): Promise<NearbyPlace[]> {
    if (!GOOGLE_MAPS_KEY) return [];

    try {
      const types = 'cafe|restaurant|bakery|shopping_mall|tourist_attraction';
      const url = `${PLACES_BASE}?location=${lat},${lng}&radius=${radius}&type=${types}&key=${GOOGLE_MAPS_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') return [];

      return (data.results || []).slice(0, 5).map((place: any) => {
        const { icon, type } = getPlaceIcon(place.types || []);
        const distKm = haversineKm(lat, lng, place.geometry.location.lat, place.geometry.location.lng);
        return {
          name: place.name,
          type,
          icon,
          distance: distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`,
          rating: place.rating,
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        };
      });
    } catch (err) {
      console.error('[googleMapsService] Places fetch failed:', err);
      return [];
    }
  },

  // Fetch EV charging stations from Google Maps Places API
  async getEVStations(lat: number, lng: number, radiusM: number = 50000): Promise<{
    id: string; name: string; address: string; latitude: number; longitude: number;
    rating?: number; provider_name?: string;
  }[]> {
    if (!GOOGLE_MAPS_KEY) return [];

    try {
      const url = `${PLACES_BASE}?location=${lat},${lng}&radius=${radiusM}&type=electric_vehicle_charging_station&key=${GOOGLE_MAPS_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') return [];

      return (data.results || []).map((place: any) => ({
        id: `gmap-${place.place_id}`,
        name: place.name,
        address: place.vicinity || place.formatted_address || '',
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        rating: place.rating,
        provider_name: 'Google Maps',
      }));
    } catch (err) {
      console.warn('[googleMapsService] EV stations fetch failed:', err);
      return [];
    }
  },

  // Autocomplete city/place suggestions
  async autocompletePlaces(query: string): Promise<{ description: string; placeId: string }[]> {
    if (!query || query.length < 2) return [];

    // Always include local matches first (instant, no API call)
    const localMatches = EGYPT_CITIES
      .filter((c) => c.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 4)
      .map((c) => ({ description: `${c}, Egypt`, placeId: `local-${c}` }));

    // Try Google Autocomplete API for richer results
    if (GOOGLE_MAPS_KEY) {
      try {
        const url = `${AUTOCOMPLETE_BASE}?input=${encodeURIComponent(query)}&components=country:eg&types=(cities)&key=${GOOGLE_MAPS_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.status === 'OK' && data.predictions?.length) {
          const googleResults = data.predictions.slice(0, 5).map((p: any) => ({
            description: p.description,
            placeId: p.place_id,
          }));
          // Merge: local first (deduped), then google
          const seen = new Set(localMatches.map((m) => m.description.split(',')[0].toLowerCase()));
          const uniqueGoogle = googleResults.filter(
            (g: any) => !seen.has(g.description.split(',')[0].toLowerCase())
          );
          return [...localMatches, ...uniqueGoogle].slice(0, 6);
        }
      } catch {
        // CORS or network error — return local only
      }
    }

    return localMatches;
  },

  // Fetch elevation profile along an encoded polyline
  async getElevationProfile(
    encodedPolyline: string,
    totalDistanceKm: number,
  ): Promise<ElevationProfile | null> {
    if (!GOOGLE_MAPS_KEY || !encodedPolyline) return null;

    try {
      // Sample roughly every 10km, minimum 5 points, maximum 100
      const samples = Math.max(5, Math.min(100, Math.round(totalDistanceKm / 10)));
      const url = `${ELEVATION_BASE}?path=enc:${encodedPolyline}&samples=${samples}&key=${GOOGLE_MAPS_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' || !data.results?.length) {
        console.warn('[googleMapsService] Elevation API error:', data.status);
        return null;
      }

      let totalAscent = 0;
      let totalDescent = 0;
      let minElevation = Infinity;
      let maxElevation = -Infinity;

      const points: ElevationPoint[] = data.results.map((r: any, i: number) => {
        const elev = Math.round(r.elevation);
        if (elev < minElevation) minElevation = elev;
        if (elev > maxElevation) maxElevation = elev;

        if (i > 0) {
          const diff = elev - Math.round(data.results[i - 1].elevation);
          if (diff > 0) totalAscent += diff;
          else totalDescent += Math.abs(diff);
        }

        return {
          lat: r.location.lat,
          lng: r.location.lng,
          elevation: elev,
          distanceFromStartKm: Math.round((i / (data.results.length - 1)) * totalDistanceKm),
        };
      });

      return {
        points,
        totalAscent: Math.round(totalAscent),
        totalDescent: Math.round(totalDescent),
        minElevation: Math.round(minElevation),
        maxElevation: Math.round(maxElevation),
      };
    } catch (err) {
      console.error('[googleMapsService] Elevation fetch failed:', err);
      return null;
    }
  },

  // Find stations from our database that are near the route
  findStationsAlongRoute(
    stations: { id: string; name: string; latitude: number; longitude: number; city?: string | null; address?: string | null; [key: string]: any }[],
    routePoints: { lat: number; lng: number; distanceFromStartKm: number }[],
    maxDeviationKm: number = 15,
  ): { station: any; distanceFromStartKm: number; deviationKm: number }[] {
    const nearbyStations: { station: any; distanceFromStartKm: number; deviationKm: number }[] = [];
    const seen = new Set<string>();

    for (const point of routePoints) {
      for (const station of stations) {
        if (seen.has(station.id)) continue;
        const dist = haversineKm(point.lat, point.lng, station.latitude, station.longitude);
        if (dist <= maxDeviationKm) {
          seen.add(station.id);
          nearbyStations.push({
            station,
            distanceFromStartKm: point.distanceFromStartKm,
            deviationKm: Math.round(dist * 10) / 10,
          });
        }
      }
    }

    // Sort by distance from start
    nearbyStations.sort((a, b) => a.distanceFromStartKm - b.distanceFromStartKm);
    return nearbyStations;
  },
};
