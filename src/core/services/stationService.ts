import { supabase } from '../config/supabase';
import { fetchEgyptStations } from './openChargeMapService';
import type { Station, Connector, StationStatus } from '../types/station';

export interface StationFilter {
  connectorTypes?: string[];
  minPowerKw?: number;
  maxPricePerKwh?: number;
  providerIds?: string[];
  amenities?: string[];
}

export interface StationQueryOptions {
  filter?: StationFilter;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

// In-memory cache so we don't hit the OCM API on every render.
let _ocmCache: { stations: Station[]; fetchedAt: number } | null = null;
const OCM_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function isCacheFresh(): boolean {
  return !!_ocmCache && Date.now() - _ocmCache.fetchedAt < OCM_CACHE_TTL_MS;
}

export const stationService = {
  /**
   * Primary path: fetch real stations from OpenChargeMap.
   * Fallback: load from Supabase (cached/seeded data).
   */
  async getStations(options: StationQueryOptions = {}): Promise<Station[]> {
    const { filter, latitude, longitude, radiusKm } = options;

    let stations: Station[];

    try {
      // Use in-memory cache when fresh
      if (isCacheFresh() && _ocmCache) {
        stations = _ocmCache.stations;
      } else {
        stations = await fetchEgyptStations({ latitude, longitude, radiusKm });
        _ocmCache = { stations, fetchedAt: Date.now() };
      }
    } catch (err) {
      console.warn('[stationService] OCM fetch failed, falling back to Supabase:', err);
      stations = await this._getStationsFromSupabase();
    }

    // Apply client-side filters
    stations = this._applyFilters(stations, filter);

    // Compute status for each station
    stations = stations.map((s) => ({
      ...s,
      status: this.computeStatus(s.connectors || []),
    }));

    // If user location available, compute distance and sort by proximity
    if (latitude != null && longitude != null) {
      stations = stations.map((s) => ({
        ...s,
        distance_km:
          s.distance_km ??
          this._haversineKm(latitude, longitude, s.latitude, s.longitude),
      }));
      stations.sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
    }

    return stations;
  },

  /**
   * Get a single station by ID.
   * For OCM-sourced stations (id starts with "ocm-"), look in the cache.
   * Otherwise query Supabase.
   */
  async getStationById(stationId: string): Promise<Station | null> {
    // Check OCM cache first
    if (stationId.startsWith('ocm-') && _ocmCache) {
      const found = _ocmCache.stations.find((s) => s.id === stationId);
      if (found) {
        return { ...found, status: this.computeStatus(found.connectors || []) };
      }
    }

    // Try fresh OCM fetch if not cached
    if (stationId.startsWith('ocm-')) {
      try {
        const all = await fetchEgyptStations({});
        _ocmCache = { stations: all, fetchedAt: Date.now() };
        const found = all.find((s) => s.id === stationId);
        if (found) {
          return { ...found, status: this.computeStatus(found.connectors || []) };
        }
      } catch {
        // fall through
      }
      return null;
    }

    // Supabase lookup for non-OCM IDs
    const { data, error } = await supabase
      .from('stations')
      .select('*, connectors(*), provider:providers(*)')
      .eq('id', stationId)
      .single();
    if (error) return null;
    return {
      ...data,
      status: this.computeStatus((data as Station).connectors || []),
    } as Station;
  },

  async getConnectors(stationId: string): Promise<Connector[]> {
    // OCM stations keep connectors inline
    if (stationId.startsWith('ocm-') && _ocmCache) {
      const found = _ocmCache.stations.find((s) => s.id === stationId);
      return found?.connectors ?? [];
    }

    const { data, error } = await supabase
      .from('connectors')
      .select('*')
      .eq('station_id', stationId);
    if (error) throw error;
    return (data || []) as Connector[];
  },

  async searchStations(query: string): Promise<Station[]> {
    const q = query.toLowerCase();

    // Search OCM cached data first
    if (_ocmCache) {
      const results = _ocmCache.stations.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.address ?? '').toLowerCase().includes(q) ||
          (s.area ?? '').toLowerCase().includes(q) ||
          (s.provider?.name ?? '').toLowerCase().includes(q)
      );
      if (results.length > 0) {
        return results.map((s) => ({
          ...s,
          status: this.computeStatus(s.connectors || []),
        }));
      }
    }

    // Fallback to Supabase text search
    const { data, error } = await supabase
      .from('stations')
      .select('*, connectors(*), provider:providers(*)')
      .or(`name.ilike.%${query}%,address.ilike.%${query}%,area.ilike.%${query}%`);
    if (error) throw error;
    return ((data || []) as Station[]).map((s) => ({
      ...s,
      status: this.computeStatus(s.connectors || []),
    }));
  },

  /**
   * Force-refresh the OCM cache (e.g. after a pull-to-refresh).
   */
  async refreshFromOCM(latitude?: number, longitude?: number): Promise<Station[]> {
    const stations = await fetchEgyptStations({ latitude, longitude });
    _ocmCache = { stations, fetchedAt: Date.now() };
    return stations;
  },

  /**
   * Invalidate the in-memory OCM cache so the next getStations call
   * will re-fetch from the API.
   */
  invalidateCache(): void {
    _ocmCache = null;
  },

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  async _getStationsFromSupabase(): Promise<Station[]> {
    const { data, error } = await supabase
      .from('stations')
      .select('*, connectors(*), provider:providers(*)')
      .order('name');
    if (error) throw error;
    return (data || []) as Station[];
  },

  _applyFilters(stations: Station[], filter?: StationFilter): Station[] {
    if (!filter) return stations;

    let result = stations;

    if (filter.connectorTypes?.length) {
      result = result.filter((s) =>
        s.connectors?.some((c) => filter.connectorTypes!.includes(c.type))
      );
    }
    if (filter.minPowerKw) {
      result = result.filter((s) =>
        s.connectors?.some((c) => c.power_kw >= filter.minPowerKw!)
      );
    }
    if (filter.maxPricePerKwh) {
      result = result.filter((s) =>
        s.connectors?.some((c) => c.price_per_kwh <= filter.maxPricePerKwh!)
      );
    }
    if (filter.providerIds?.length) {
      result = result.filter((s) =>
        filter.providerIds!.includes(s.provider_id)
      );
    }
    if (filter.amenities?.length) {
      result = result.filter((s) =>
        filter.amenities!.every((a) => s.amenities.includes(a))
      );
    }

    return result;
  },

  computeStatus(connectors: Connector[]): StationStatus {
    if (!connectors.length) return 'offline';
    const available = connectors.filter((c) => c.status === 'available').length;
    const offline = connectors.filter((c) => c.status === 'offline').length;
    if (offline === connectors.length) return 'offline';
    if (available === connectors.length) return 'available';
    if (available > 0) return 'partial';
    return 'occupied';
  },

  _haversineKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },
};
