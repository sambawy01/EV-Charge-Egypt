import { MockAdapter } from '@/core/providers/MockAdapter';

describe('MockAdapter', () => {
  const adapter = new MockAdapter();

  it('returns stations', async () => {
    const stations = await adapter.getStations();
    expect(stations.length).toBeGreaterThan(0);
    expect(stations[0]).toHaveProperty('name');
    expect(stations[0]).toHaveProperty('latitude');
  });

  it('returns availability for a station', async () => {
    const stations = await adapter.getStations();
    const availability = await adapter.getAvailability(stations[0].id);
    expect(availability.length).toBeGreaterThan(0);
    expect(availability[0]).toHaveProperty('status');
  });

  it('creates a booking', async () => {
    const booking = await adapter.createBooking(
      'station-1',
      'user-1',
      { start: new Date().toISOString(), end: new Date().toISOString() },
    );
    expect(booking).toHaveProperty('id');
    expect(booking.status).toBe('confirmed');
  });
});
