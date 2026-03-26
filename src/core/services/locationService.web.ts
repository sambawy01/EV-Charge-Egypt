import { DEFAULT_MAP_REGION } from '../config/constants';

export interface Coords {
  latitude: number;
  longitude: number;
}

export const locationService = {
  async requestPermission(): Promise<boolean> {
    return typeof navigator !== 'undefined' && 'geolocation' in navigator;
  },

  async getCurrentLocation(): Promise<Coords> {
    return new Promise((resolve) => {
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            }),
          () =>
            resolve({
              latitude: DEFAULT_MAP_REGION.latitude,
              longitude: DEFAULT_MAP_REGION.longitude,
            }),
          { timeout: 5000 },
        );
      } else {
        resolve({
          latitude: DEFAULT_MAP_REGION.latitude,
          longitude: DEFAULT_MAP_REGION.longitude,
        });
      }
    });
  },

  getDistanceKm(from: Coords, to: Coords): number {
    const R = 6371;
    const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
    const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((from.latitude * Math.PI) / 180) *
        Math.cos((to.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },
};
