const STORE_KEY = 'evcharge_offline_';

export async function getOfflineDb() {
  return null;
}

export async function cacheStations(stations: any[]) {
  localStorage.setItem(STORE_KEY + 'stations', JSON.stringify(stations));
}

export async function getCachedStations(): Promise<any[]> {
  const data = localStorage.getItem(STORE_KEY + 'stations');
  return data ? JSON.parse(data) : [];
}
