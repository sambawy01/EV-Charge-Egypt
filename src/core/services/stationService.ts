import { supabase } from '../config/supabase';
import type { Station, Connector, StationStatus } from '../types/station';

export interface StationFilter {
  connectorTypes?: string[];
  minPowerKw?: number;
  maxPricePerKwh?: number;
  providerIds?: string[];
  amenities?: string[];
}

export const stationService = {
  async getStations(filter?: StationFilter): Promise<Station[]> {
    const query = supabase
      .from('stations')
      .select('*, connectors(*), provider:providers(*)')
      .order('name');
    const { data, error } = await query;
    if (error) throw error;
    let stations = (data || []) as Station[];

    if (filter?.connectorTypes?.length) {
      stations = stations.filter((s) =>
        s.connectors?.some((c) => filter.connectorTypes!.includes(c.type))
      );
    }
    if (filter?.minPowerKw) {
      stations = stations.filter((s) =>
        s.connectors?.some((c) => c.power_kw >= filter.minPowerKw!)
      );
    }
    if (filter?.maxPricePerKwh) {
      stations = stations.filter((s) =>
        s.connectors?.some((c) => c.price_per_kwh <= filter.maxPricePerKwh!)
      );
    }
    if (filter?.providerIds?.length) {
      stations = stations.filter((s) => filter.providerIds!.includes(s.provider_id));
    }
    if (filter?.amenities?.length) {
      stations = stations.filter((s) =>
        filter.amenities!.every((a) => s.amenities.includes(a))
      );
    }

    return stations.map((s) => ({ ...s, status: this.computeStatus(s.connectors || []) }));
  },

  async getStationById(stationId: string): Promise<Station | null> {
    const { data, error } = await supabase
      .from('stations')
      .select('*, connectors(*), provider:providers(*)')
      .eq('id', stationId)
      .single();
    if (error) return null;
    return { ...data, status: this.computeStatus((data as Station).connectors || []) } as Station;
  },

  async getConnectors(stationId: string): Promise<Connector[]> {
    const { data, error } = await supabase
      .from('connectors')
      .select('*')
      .eq('station_id', stationId);
    if (error) throw error;
    return (data || []) as Connector[];
  },

  async searchStations(query: string): Promise<Station[]> {
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

  computeStatus(connectors: Connector[]): StationStatus {
    if (!connectors.length) return 'offline';
    const available = connectors.filter((c) => c.status === 'available').length;
    const offline = connectors.filter((c) => c.status === 'offline').length;
    if (offline === connectors.length) return 'offline';
    if (available === connectors.length) return 'available';
    if (available > 0) return 'partial';
    return 'occupied';
  },
};
