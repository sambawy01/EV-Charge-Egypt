import { stationService } from '@/core/services/stationService';

// Mock the external fetch-based service so tests don't hit real APIs
jest.mock('@/core/services/openChargeMapService', () => ({
  fetchEgyptStations: jest.fn().mockRejectedValue(new Error('No network in test')),
}));

jest.mock('@/core/config/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: '1', name: 'Test', latitude: 30.0, longitude: 31.0, connectors: [], amenities: [], photos: [], rating_avg: 0, review_count: 0 }, error: null }),
        }),
        order: jest.fn().mockResolvedValue({ data: [{ id: '1', name: 'Test Station', latitude: 30.0, longitude: 31.0, connectors: [], amenities: [], photos: [], rating_avg: 0, review_count: 0 }], error: null }),
        or: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  },
}));

describe('stationService', () => {
  beforeEach(() => {
    // Clear any in-memory cache between tests
    stationService.invalidateCache();
  });

  it('falls back to Supabase when OCM fails and returns stations', async () => {
    const stations = await stationService.getStations();
    expect(Array.isArray(stations)).toBe(true);
  });

  it('computes station status from connectors', () => {
    expect(stationService.computeStatus([{ status: 'available' }, { status: 'available' }] as any)).toBe('available');
    expect(stationService.computeStatus([{ status: 'available' }, { status: 'occupied' }] as any)).toBe('partial');
    expect(stationService.computeStatus([{ status: 'occupied' }, { status: 'occupied' }] as any)).toBe('occupied');
    expect(stationService.computeStatus([{ status: 'offline' }] as any)).toBe('offline');
  });

  it('computes haversine distance correctly', () => {
    // Cairo to Alexandria is roughly 180 km
    const dist = stationService._haversineKm(30.0444, 31.2357, 31.2001, 29.9187);
    expect(dist).toBeGreaterThan(150);
    expect(dist).toBeLessThan(220);
  });
});
