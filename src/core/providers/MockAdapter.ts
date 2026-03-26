import { ProviderAdapter } from './ProviderAdapter';
import type { TimeSlot, ProviderBooking, ProviderSession, ProviderPrice } from './types';
import type { Station, Connector } from '../types/station';

const MOCK_STATIONS: Station[] = [
  { id: 'ikarus-1', provider_id: 'ikarus', external_station_id: 'IK-001', name: 'IKARUS Maadi', address: 'Road 9, Maadi, Cairo', latitude: 29.9602, longitude: 31.2569, city: 'Cairo', area: 'Maadi', amenities: ['wifi', 'restaurant', 'shade'], photos: [], rating_avg: 4.5, review_count: 23, is_active: true, last_synced_at: null },
  { id: 'ikarus-2', provider_id: 'ikarus', external_station_id: 'IK-002', name: 'IKARUS New Cairo', address: '5th Settlement, New Cairo', latitude: 30.0131, longitude: 31.4089, city: 'Cairo', area: 'New Cairo', amenities: ['wifi', 'mall', 'bathroom'], photos: [], rating_avg: 4.2, review_count: 15, is_active: true, last_synced_at: null },
  { id: 'sha7en-1', provider_id: 'sha7en', external_station_id: 'SH-001', name: 'Sha7en Heliopolis', address: 'Merghani St, Heliopolis', latitude: 30.0876, longitude: 31.3225, city: 'Cairo', area: 'Heliopolis', amenities: ['bathroom', 'shade'], photos: [], rating_avg: 3.8, review_count: 8, is_active: true, last_synced_at: null },
  { id: 'sha7en-2', provider_id: 'sha7en', external_station_id: 'SH-002', name: 'Sha7en Zamalek', address: '26 July St, Zamalek', latitude: 30.0651, longitude: 31.2194, city: 'Cairo', area: 'Zamalek', amenities: ['restaurant', 'wifi'], photos: [], rating_avg: 4.0, review_count: 12, is_active: true, last_synced_at: null },
  { id: 'elsewedy-1', provider_id: 'elsewedy', external_station_id: 'EP-001', name: 'Elsewedy Plug 6th October', address: 'Mall of Arabia, 6th October', latitude: 29.9727, longitude: 30.9432, city: 'Cairo', area: '6th October', amenities: ['mall', 'restaurant', 'wifi', 'bathroom'], photos: [], rating_avg: 4.7, review_count: 45, is_active: true, last_synced_at: null },
  { id: 'elsewedy-2', provider_id: 'elsewedy', external_station_id: 'EP-002', name: 'Elsewedy Plug Nasr City', address: 'City Stars, Nasr City', latitude: 30.0729, longitude: 31.3452, city: 'Cairo', area: 'Nasr City', amenities: ['mall', 'restaurant', 'wifi', 'bathroom', 'shade'], photos: [], rating_avg: 4.6, review_count: 38, is_active: true, last_synced_at: null },
  { id: 'kilowatt-1', provider_id: 'kilowatt', external_station_id: 'KW-001', name: 'Kilowatt EV Downtown', address: 'Tahrir Square, Downtown', latitude: 30.0444, longitude: 31.2357, city: 'Cairo', area: 'Downtown', amenities: ['shade'], photos: [], rating_avg: 3.5, review_count: 5, is_active: true, last_synced_at: null },
  { id: 'kilowatt-2', provider_id: 'kilowatt', external_station_id: 'KW-002', name: 'Kilowatt EV Sheikh Zayed', address: 'Hyper One, Sheikh Zayed', latitude: 30.0313, longitude: 30.9757, city: 'Cairo', area: 'Sheikh Zayed', amenities: ['mall', 'restaurant'], photos: [], rating_avg: 4.1, review_count: 10, is_active: true, last_synced_at: null },
  { id: 'newenergy-1', provider_id: 'newenergy', external_station_id: 'NE-001', name: 'New Energy Mohandessin', address: 'Gameat El Dowal, Mohandessin', latitude: 30.0554, longitude: 31.2005, city: 'Cairo', area: 'Mohandessin', amenities: ['restaurant', 'wifi'], photos: [], rating_avg: 3.9, review_count: 7, is_active: true, last_synced_at: null },
  { id: 'newenergy-2', provider_id: 'newenergy', external_station_id: 'NE-002', name: 'New Energy Ain Sokhna Rd', address: 'Ain Sokhna Road, Km 45', latitude: 30.0027, longitude: 31.5877, city: 'Cairo', area: 'Ain Sokhna Road', amenities: ['bathroom', 'shade', 'restaurant'], photos: [], rating_avg: 4.3, review_count: 19, is_active: true, last_synced_at: null },
];

const MOCK_CONNECTORS: Record<string, Connector[]> = {};
MOCK_STATIONS.forEach((s) => {
  MOCK_CONNECTORS[s.id] = [
    {
      id: `${s.id}-ccs`,
      station_id: s.id,
      external_connector_id: 'CCS-1',
      type: 'CCS',
      power_kw: 60,
      price_per_kwh: 0.05,
      currency: 'EGP',
      status: 'available',
      last_status_check: null,
    },
    {
      id: `${s.id}-type2`,
      station_id: s.id,
      external_connector_id: 'T2-1',
      type: 'Type2',
      power_kw: 22,
      price_per_kwh: 0.04,
      currency: 'EGP',
      status: 'available',
      last_status_check: null,
    },
  ];
});

export class MockAdapter extends ProviderAdapter {
  readonly providerId = 'mock';
  readonly providerName = 'Mock Provider';

  async getStations(): Promise<Station[]> {
    return MOCK_STATIONS;
  }

  async getAvailability(stationId: string): Promise<Connector[]> {
    return MOCK_CONNECTORS[stationId] || [];
  }

  async createBooking(stationId: string, _userId: string, _timeSlot: TimeSlot): Promise<ProviderBooking> {
    return {
      id: `booking-${Date.now()}`,
      providerRef: `MOCK-${Date.now()}`,
      status: 'confirmed',
      stationId,
      connectorId: `${stationId}-ccs`,
    };
  }

  async cancelBooking(_bookingId: string): Promise<void> {}

  async startCharging(_bookingId: string): Promise<ProviderSession> {
    return {
      id: `session-${Date.now()}`,
      providerRef: `MOCK-S-${Date.now()}`,
      kwhDelivered: 0,
      costProvider: 0,
    };
  }

  async stopCharging(sessionId: string): Promise<ProviderSession> {
    return {
      id: sessionId,
      providerRef: `MOCK-S-${Date.now()}`,
      kwhDelivered: 25.5,
      costProvider: 1.275,
    };
  }

  async getPrice(_stationId: string, connectorType: string): Promise<ProviderPrice> {
    return {
      pricePerKwh: connectorType === 'CCS' ? 0.05 : 0.04,
      currency: 'EGP',
      connectorType,
    };
  }
}
