import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'ev_station_visits';
const VISIT_EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours

export interface StationVisit {
  stationId: string;
  stationName: string;
  arrivedAt: number; // timestamp
  leftAt?: number; // timestamp when user left proximity
  rated: boolean;
}

export const visitTracker = {
  async getVisits(): Promise<StationVisit[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const visits: StationVisit[] = JSON.parse(raw);
      // Remove expired visits (>48h)
      const now = Date.now();
      return visits.filter(v => now - v.arrivedAt < VISIT_EXPIRY_MS);
    } catch {
      return [];
    }
  },

  async recordArrival(stationId: string, stationName: string): Promise<void> {
    const visits = await this.getVisits();
    // Don't duplicate if already recorded recently
    if (visits.find(v => v.stationId === stationId && !v.leftAt)) return;
    visits.push({ stationId, stationName, arrivedAt: Date.now(), rated: false });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
  },

  async recordDeparture(stationId: string): Promise<void> {
    const visits = await this.getVisits();
    const visit = visits.find(v => v.stationId === stationId && !v.leftAt);
    if (visit) {
      visit.leftAt = Date.now();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
    }
  },

  async markRated(stationId: string): Promise<void> {
    const visits = await this.getVisits();
    const visit = visits.find(v => v.stationId === stationId);
    if (visit) {
      visit.rated = true;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
    }
  },

  async hasRecentVisit(stationId: string): Promise<boolean> {
    const visits = await this.getVisits();
    return visits.some(v => v.stationId === stationId && Date.now() - v.arrivedAt < VISIT_EXPIRY_MS);
  },

  async getUnratedDepartures(): Promise<StationVisit[]> {
    const visits = await this.getVisits();
    return visits.filter(v => v.leftAt && !v.rated);
  },
};
