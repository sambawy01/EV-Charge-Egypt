import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getOfflineDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('evcharge.db');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS cached_stations (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      synced_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cached_connectors (
      id TEXT PRIMARY KEY,
      station_id TEXT NOT NULL,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pending_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
  return db;
}

export async function cacheStations(stations: any[]) {
  const database = await getOfflineDb();
  const now = Date.now();
  for (const s of stations) {
    await database.runAsync(
      'INSERT OR REPLACE INTO cached_stations (id, data, synced_at) VALUES (?, ?, ?)',
      [s.id, JSON.stringify(s), now],
    );
  }
}

export async function getCachedStations(): Promise<any[]> {
  const database = await getOfflineDb();
  const rows = await database.getAllAsync('SELECT data FROM cached_stations');
  return rows.map((r: any) => JSON.parse(r.data));
}
