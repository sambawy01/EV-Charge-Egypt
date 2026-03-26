export type ConnectorType = 'CCS' | 'CHAdeMO' | 'Type2' | 'GBT';
export type ConnectorStatus = 'available' | 'occupied' | 'booked' | 'offline';
export type StationStatus = 'available' | 'partial' | 'occupied' | 'offline';

export interface Provider {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
}

export interface Station {
  id: string;
  provider_id: string;
  provider?: Provider;
  external_station_id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  city: string | null;
  area: string | null;
  amenities: string[];
  photos: string[];
  rating_avg: number;
  review_count: number;
  is_active: boolean;
  last_synced_at: string | null;
  connectors?: Connector[];
  status?: StationStatus;
  distance_km?: number;
}

export interface Connector {
  id: string;
  station_id: string;
  external_connector_id: string | null;
  type: ConnectorType;
  power_kw: number;
  price_per_kwh: number;
  currency: string;
  status: ConnectorStatus;
  last_status_check: string | null;
}

export interface Review {
  id: string;
  user_id: string;
  station_id: string;
  rating: number;
  comment: string | null;
  photos: string[];
  ai_summary: string | null;
  created_at: string;
  user?: { full_name: string; avatar_url: string | null };
}
