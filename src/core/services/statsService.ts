import { supabase } from '../config/supabase';

export interface OverviewStats {
  totalStations: number;
  totalConnectors: number;
  totalProviders: number;
  governoratesCovered: number;
}

export interface GroupedCount {
  name: string;
  count: number;
}

export interface ConnectorDistribution {
  type: string;
  count: number;
  percentage: number;
}

export interface CommunityStats {
  totalReports: number;
  totalSubmitted: number;
  totalVerified: number;
}

// 30-minute in-memory cache
interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

let _overviewCache: CacheEntry<OverviewStats> | null = null;
let _providerCache: CacheEntry<GroupedCount[]> | null = null;
let _governorateCache: CacheEntry<GroupedCount[]> | null = null;
let _connectorCache: CacheEntry<ConnectorDistribution[]> | null = null;
let _communityCache: CacheEntry<CommunityStats> | null = null;
let _lastUpdated: number | null = null;

function isFresh<T>(cache: CacheEntry<T> | null): cache is CacheEntry<T> {
  return !!cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS;
}

export const statsService = {
  getLastUpdated(): number | null {
    return _lastUpdated;
  },

  async getOverviewStats(): Promise<OverviewStats> {
    if (isFresh(_overviewCache)) return _overviewCache.data;

    try {
      // Total stations
      const { count: totalStations } = await supabase
        .from('stations')
        .select('*', { count: 'exact', head: true });

      // Total connectors — sum connector_count from connectors table
      const { data: connectorRows } = await supabase
        .from('connectors')
        .select('id');
      const totalConnectors = connectorRows?.length ?? 0;

      // Distinct providers
      const { data: providerRows } = await supabase
        .from('stations')
        .select('provider');
      const uniqueProviders = new Set(
        (providerRows || []).map((r: any) => r.provider).filter(Boolean)
      );

      // Distinct governorates
      const { data: govRows } = await supabase
        .from('stations')
        .select('governorate');
      const uniqueGovernorates = new Set(
        (govRows || []).map((r: any) => r.governorate).filter(Boolean)
      );

      const data: OverviewStats = {
        totalStations: totalStations ?? 0,
        totalConnectors,
        totalProviders: uniqueProviders.size,
        governoratesCovered: uniqueGovernorates.size,
      };

      _overviewCache = { data, fetchedAt: Date.now() };
      _lastUpdated = Date.now();
      return data;
    } catch (err) {
      console.warn('[statsService] getOverviewStats failed:', err);
      return { totalStations: 0, totalConnectors: 0, totalProviders: 0, governoratesCovered: 0 };
    }
  },

  async getStationsByProvider(): Promise<GroupedCount[]> {
    if (isFresh(_providerCache)) return _providerCache.data;

    try {
      const { data: rows } = await supabase
        .from('stations')
        .select('provider');

      const counts: Record<string, number> = {};
      (rows || []).forEach((r: any) => {
        const p = r.provider || 'Unknown';
        counts[p] = (counts[p] || 0) + 1;
      });

      const data = Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      _providerCache = { data, fetchedAt: Date.now() };
      _lastUpdated = Date.now();
      return data;
    } catch (err) {
      console.warn('[statsService] getStationsByProvider failed:', err);
      return [];
    }
  },

  async getStationsByGovernorate(): Promise<GroupedCount[]> {
    if (isFresh(_governorateCache)) return _governorateCache.data;

    try {
      const { data: rows } = await supabase
        .from('stations')
        .select('governorate');

      const counts: Record<string, number> = {};
      (rows || []).forEach((r: any) => {
        const g = r.governorate || 'Unknown';
        counts[g] = (counts[g] || 0) + 1;
      });

      const data = Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      _governorateCache = { data, fetchedAt: Date.now() };
      _lastUpdated = Date.now();
      return data;
    } catch (err) {
      console.warn('[statsService] getStationsByGovernorate failed:', err);
      return [];
    }
  },

  async getConnectorDistribution(): Promise<ConnectorDistribution[]> {
    if (isFresh(_connectorCache)) return _connectorCache.data;

    try {
      const { data: rows } = await supabase
        .from('connectors')
        .select('type');

      const counts: Record<string, number> = {};
      let total = 0;
      (rows || []).forEach((r: any) => {
        const t = r.type || 'Unknown';
        counts[t] = (counts[t] || 0) + 1;
        total++;
      });

      const data = Object.entries(counts)
        .map(([type, count]) => ({
          type,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);

      _connectorCache = { data, fetchedAt: Date.now() };
      _lastUpdated = Date.now();
      return data;
    } catch (err) {
      console.warn('[statsService] getConnectorDistribution failed:', err);
      return [];
    }
  },

  async getCommunityStats(): Promise<CommunityStats> {
    if (isFresh(_communityCache)) return _communityCache.data;

    try {
      const { count: totalReports } = await supabase
        .from('station_reports')
        .select('*', { count: 'exact', head: true });

      const { count: totalSubmitted } = await supabase
        .from('submitted_stations')
        .select('*', { count: 'exact', head: true });

      const { count: totalVerified } = await supabase
        .from('submitted_stations')
        .select('*', { count: 'exact', head: true })
        .gte('verification_count', 3);

      const data: CommunityStats = {
        totalReports: totalReports ?? 0,
        totalSubmitted: totalSubmitted ?? 0,
        totalVerified: totalVerified ?? 0,
      };

      _communityCache = { data, fetchedAt: Date.now() };
      _lastUpdated = Date.now();
      return data;
    } catch (err) {
      console.warn('[statsService] getCommunityStats failed:', err);
      return { totalReports: 0, totalSubmitted: 0, totalVerified: 0 };
    }
  },
};
