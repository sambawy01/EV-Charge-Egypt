/**
 * Real EV station data aggregator.
 *
 * Sources (in priority order):
 *  1. OpenStreetMap Overpass API -- free, no key required, real community data
 *  2. OpenChargeMap API -- requires free API key from openchargemap.org
 *
 * Both sources return real, verified EV charging locations in Egypt.
 */

import type { Station, Connector, ConnectorType } from '../types/station';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface FetchStationsOptions {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  maxResults?: number;
}

// ---------------------------------------------------------------------------
// Source 1: OpenStreetMap Overpass API (free, no key)
// ---------------------------------------------------------------------------

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

/**
 * Build an Overpass QL query for EV charging stations in Egypt.
 * If lat/lon provided, search within a radius. Otherwise get all of Egypt.
 */
function buildOverpassQuery(options: FetchStationsOptions): string {
  const { latitude, longitude, radiusKm } = options;

  if (latitude != null && longitude != null && radiusKm) {
    const radiusM = radiusKm * 1000;
    return `[out:json][timeout:25];(node["amenity"="charging_station"](around:${radiusM},${latitude},${longitude});way["amenity"="charging_station"](around:${radiusM},${latitude},${longitude}););out center body;`;
  }

  // All of Egypt
  return `[out:json][timeout:25];area["ISO3166-1"="EG"]->.a;(node["amenity"="charging_station"](area.a);way["amenity"="charging_station"](area.a););out center body;`;
}

function parseOverpassConnectors(
  tags: Record<string, string>,
  stationId: string
): Connector[] {
  const connectors: Connector[] = [];
  let connIdx = 0;

  // Check for known socket types in OSM tags
  const socketTypes: Array<{ prefix: string; type: ConnectorType }> = [
    { prefix: 'socket:type2', type: 'Type2' },
    { prefix: 'socket:ccs2', type: 'CCS' },
    { prefix: 'socket:ccs', type: 'CCS' },
    { prefix: 'socket:chademo', type: 'CHAdeMO' },
    { prefix: 'socket:type1', type: 'Type2' },
  ];

  for (const { prefix, type } of socketTypes) {
    const count = parseInt(tags[prefix] || '0', 10);
    if (count > 0 || tags[prefix] !== undefined) {
      const qty = count || 1;
      const outputTag = tags[`${prefix}:output`] || '';
      const powerMatch = outputTag.match(/([\d.]+)\s*kW/i);
      const powerKw = powerMatch ? parseFloat(powerMatch[1]) : (type === 'CCS' || type === 'CHAdeMO' ? 50 : 22);

      for (let i = 0; i < qty; i++) {
        connectors.push({
          id: `osm-conn-${stationId}-${connIdx}`,
          station_id: stationId,
          external_connector_id: `OSM-${stationId}-${type}-${i}`,
          type,
          power_kw: powerKw,
          price_per_kwh: 0,
          currency: 'EGP',
          status: 'available',
          last_status_check: null,
        });
        connIdx++;
      }
    }
  }

  // If no specific sockets found, create a generic Type2 connector
  if (connectors.length === 0) {
    const capacity = parseInt(tags['capacity'] || tags['capacity:motorcar'] || '1', 10);
    for (let i = 0; i < Math.min(capacity, 4); i++) {
      connectors.push({
        id: `osm-conn-${stationId}-${connIdx}`,
        station_id: stationId,
        external_connector_id: `OSM-${stationId}-generic-${i}`,
        type: 'Type2',
        power_kw: 22,
        price_per_kwh: 0,
        currency: 'EGP',
        status: 'available',
        last_status_check: null,
      });
      connIdx++;
    }
  }

  return connectors;
}

function mapOverpassToStation(element: OverpassElement): Station | null {
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  if (lat == null || lon == null) return null;

  const tags = element.tags || {};
  const stationId = `osm-${element.id}`;

  const name =
    tags['name'] ||
    tags['operator'] ||
    tags['network'] ||
    `EV Station (OSM ${element.id})`;

  const operatorName = tags['operator'] || tags['network'] || 'Unknown Operator';
  const city = tags['addr:city'] || null;
  const area = tags['addr:state'] || tags['addr:city'] || null;

  const address = [
    tags['addr:street'],
    tags['addr:housenumber'],
    tags['addr:city'],
    tags['addr:state'],
    tags['location'],
  ]
    .filter(Boolean)
    .join(', ') || tags['location'] || null;

  const connectors = parseOverpassConnectors(tags, stationId);

  return {
    id: stationId,
    provider_id: `osm-provider`,
    provider: {
      id: 'osm-provider',
      name: operatorName,
      slug: operatorName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      logo_url: null,
      is_active: true,
    },
    external_station_id: `OSM-${element.id}`,
    name,
    address,
    latitude: lat,
    longitude: lon,
    city,
    area,
    amenities: [],
    photos: [],
    rating_avg: 0,
    review_count: 0,
    is_active: true,
    last_synced_at: new Date().toISOString(),
    connectors,
  };
}

async function fetchFromOverpass(
  options: FetchStationsOptions
): Promise<Station[]> {
  const query = buildOverpassQuery(options);

  const response = await fetch(OVERPASS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: query,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const elements: OverpassElement[] = data.elements || [];

  return elements
    .map(mapOverpassToStation)
    .filter((s): s is Station => s !== null);
}

// ---------------------------------------------------------------------------
// Source 2: OpenChargeMap API (requires key)
// ---------------------------------------------------------------------------

const OCM_API_BASE = 'https://api.openchargemap.io/v3/poi/';

export interface OCMStation {
  ID: number;
  UUID: string;
  AddressInfo: {
    ID: number;
    Title: string;
    AddressLine1?: string;
    Town?: string;
    StateOrProvince?: string;
    Latitude: number;
    Longitude: number;
    ContactTelephone1?: string;
    Distance?: number;
    DistanceUnit?: number;
  };
  OperatorInfo?: {
    ID: number;
    Title: string;
    WebsiteURL?: string;
  } | null;
  Connections?: Array<{
    ID: number;
    ConnectionTypeID: number;
    ConnectionType?: { ID: number; Title: string } | null;
    StatusTypeID?: number;
    StatusType?: { ID: number; Title: string; IsOperational?: boolean } | null;
    PowerKW?: number;
    Quantity?: number;
  }>;
  NumberOfPoints?: number;
  StatusType?: {
    ID: number;
    Title: string;
    IsOperational?: boolean;
  } | null;
}

const OCM_CONNECTION_TYPE_MAP: Record<number, ConnectorType> = {
  1: 'Type2',
  2: 'CHAdeMO',
  25: 'Type2',
  33: 'CCS',
  32: 'CCS',
  30: 'CCS',
};

function getOCMApiKey(): string | null {
  try {
    return process.env.EXPO_PUBLIC_OCM_API_KEY || null;
  } catch {
    return null;
  }
}

function mapOCMToStation(ocm: OCMStation): Station {
  const stationId = `ocm-${ocm.ID}`;
  const addr = ocm.AddressInfo;

  const connectors: Connector[] = (ocm.Connections || []).map((c, idx) => {
    const connType = OCM_CONNECTION_TYPE_MAP[c.ConnectionTypeID] ?? 'Type2';
    return {
      id: `ocm-conn-${c.ID}`,
      station_id: stationId,
      external_connector_id: `OCM-${c.ID}`,
      type: connType,
      power_kw: c.PowerKW ?? (connType === 'CCS' || connType === 'CHAdeMO' ? 50 : 22),
      price_per_kwh: 0,
      currency: 'EGP',
      status: c.StatusType?.IsOperational !== false ? 'available' : 'offline',
      last_status_check: null,
    };
  });

  if (connectors.length === 0) {
    connectors.push({
      id: `ocm-conn-gen-${ocm.ID}`,
      station_id: stationId,
      external_connector_id: `OCM-GEN-${ocm.ID}`,
      type: 'Type2',
      power_kw: 22,
      price_per_kwh: 0,
      currency: 'EGP',
      status: ocm.StatusType?.IsOperational !== false ? 'available' : 'offline',
      last_status_check: null,
    });
  }

  const operatorName = ocm.OperatorInfo?.Title ?? 'Unknown Operator';

  return {
    id: stationId,
    provider_id: `ocm-provider-${ocm.OperatorInfo?.ID ?? 0}`,
    provider: {
      id: `ocm-provider-${ocm.OperatorInfo?.ID ?? 0}`,
      name: operatorName,
      slug: operatorName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      logo_url: null,
      is_active: true,
    },
    external_station_id: `OCM-${ocm.ID}`,
    name: addr.Title || `Station OCM-${ocm.ID}`,
    address: [addr.AddressLine1, addr.Town, addr.StateOrProvince]
      .filter(Boolean)
      .join(', ') || null,
    latitude: addr.Latitude,
    longitude: addr.Longitude,
    city: addr.Town ?? null,
    area: addr.StateOrProvince ?? addr.Town ?? null,
    amenities: [],
    photos: [],
    rating_avg: 0,
    review_count: 0,
    is_active: ocm.StatusType?.IsOperational !== false,
    last_synced_at: new Date().toISOString(),
    connectors,
    distance_km: addr.Distance ?? undefined,
  };
}

async function fetchFromOCM(
  options: FetchStationsOptions
): Promise<Station[]> {
  const apiKey = getOCMApiKey();
  if (!apiKey) {
    throw new Error('No OCM API key configured');
  }

  const { latitude, longitude, radiusKm = 200, maxResults = 500 } = options;

  const params = new URLSearchParams({
    output: 'json',
    countrycode: 'EG',
    maxresults: maxResults.toString(),
    compact: 'true',
    verbose: 'false',
    key: apiKey,
  });

  if (latitude != null && longitude != null) {
    params.set('latitude', latitude.toString());
    params.set('longitude', longitude.toString());
    params.set('distance', radiusKm.toString());
    params.set('distanceunit', 'KM');
  }

  const response = await fetch(`${OCM_API_BASE}?${params.toString()}`, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'EVChargeEgypt/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`OCM API error: ${response.status}`);
  }

  const data: OCMStation[] = await response.json();
  return data.map(mapOCMToStation);
}

// ---------------------------------------------------------------------------
// Unified fetch: tries multiple sources, deduplicates by proximity
// ---------------------------------------------------------------------------

/**
 * Deduplicate stations from different sources that refer to the same
 * physical location (within ~100m of each other).
 */
function deduplicateStations(stations: Station[]): Station[] {
  const result: Station[] = [];
  const THRESHOLD_DEG = 0.001; // roughly 100m

  for (const s of stations) {
    const isDuplicate = result.some(
      (existing) =>
        Math.abs(existing.latitude - s.latitude) < THRESHOLD_DEG &&
        Math.abs(existing.longitude - s.longitude) < THRESHOLD_DEG
    );
    if (!isDuplicate) {
      result.push(s);
    }
  }

  return result;
}

/**
 * Fetch real EV stations in Egypt from all available sources.
 *
 * Strategy:
 *  1. Always try Overpass (OSM) -- free, no key
 *  2. Also try OCM if API key is configured
 *  3. Merge and deduplicate results
 */
export async function fetchEgyptStations(
  options: FetchStationsOptions = {}
): Promise<Station[]> {
  const results: Station[] = [];
  const errors: string[] = [];

  // Source 1: Overpass API (always available)
  try {
    const osmStations = await fetchFromOverpass(options);
    results.push(...osmStations);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Overpass: ${msg}`);
    console.warn('[fetchEgyptStations] Overpass failed:', msg);
  }

  // Source 2: OpenChargeMap (needs key)
  try {
    const ocmStations = await fetchFromOCM(options);
    results.push(...ocmStations);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Only log as warning if it's not just "no key"
    if (!msg.includes('No OCM API key')) {
      console.warn('[fetchEgyptStations] OCM failed:', msg);
    }
    errors.push(`OCM: ${msg}`);
  }

  if (results.length === 0 && errors.length > 0) {
    throw new Error(`All station sources failed: ${errors.join('; ')}`);
  }

  return deduplicateStations(results);
}
