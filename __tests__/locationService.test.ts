import { locationService } from '@/core/services/locationService';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({ coords: { latitude: 30.0444, longitude: 31.2357 } }),
  Accuracy: { Balanced: 3 },
}));

describe('locationService', () => {
  it('requests permissions', async () => {
    const result = await locationService.requestPermission();
    expect(result).toBe(true);
  });
  it('gets current location', async () => {
    const loc = await locationService.getCurrentLocation();
    expect(loc.latitude).toBeCloseTo(30.0444);
    expect(loc.longitude).toBeCloseTo(31.2357);
  });
  it('calculates distance', () => {
    const dist = locationService.getDistanceKm(
      { latitude: 30.0444, longitude: 31.2357 },
      { latitude: 30.0444, longitude: 31.2357 }
    );
    expect(dist).toBeCloseTo(0);
  });
});
