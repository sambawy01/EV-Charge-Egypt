import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

// ─── Badge Definitions ───────────────────────────────────────────────

export interface Badge {
  id: string;
  name: string;
  nameKey: string;       // i18n key for name
  descriptionKey: string; // i18n key for description
  icon: string;
  criteria: { type: string; count: number };
  unlockedAt?: string;   // ISO date when earned, null if locked
}

export interface BadgeProgress {
  badge: Badge;
  current: number;
  target: number;
  percentage: number;    // 0-100
}

const BADGE_DEFINITIONS: Omit<Badge, 'unlockedAt'>[] = [
  {
    id: 'first_report',
    name: 'First Report',
    nameKey: 'badge_first_report',
    descriptionKey: 'badge_first_report_desc',
    icon: '\uD83D\uDCCB',
    criteria: { type: 'reports', count: 1 },
  },
  {
    id: 'reporter',
    name: 'Reporter',
    nameKey: 'badge_reporter',
    descriptionKey: 'badge_reporter_desc',
    icon: '\uD83D\uDCDD',
    criteria: { type: 'reports', count: 10 },
  },
  {
    id: 'power_reporter',
    name: 'Power Reporter',
    nameKey: 'badge_power_reporter',
    descriptionKey: 'badge_power_reporter_desc',
    icon: '\u2B50',
    criteria: { type: 'reports', count: 50 },
  },
  {
    id: 'verifier',
    name: 'Verifier',
    nameKey: 'badge_verifier',
    descriptionKey: 'badge_verifier_desc',
    icon: '\u2705',
    criteria: { type: 'verifications', count: 1 },
  },
  {
    id: 'trust_builder',
    name: 'Trust Builder',
    nameKey: 'badge_trust_builder',
    descriptionKey: 'badge_trust_builder_desc',
    icon: '\uD83D\uDEE1\uFE0F',
    criteria: { type: 'verifications', count: 5 },
  },
  {
    id: 'explorer',
    name: 'Explorer',
    nameKey: 'badge_explorer',
    descriptionKey: 'badge_explorer_desc',
    icon: '\uD83E\uDDED',
    criteria: { type: 'unique_stations', count: 10 },
  },
  {
    id: 'road_warrior',
    name: 'Road Warrior',
    nameKey: 'badge_road_warrior',
    descriptionKey: 'badge_road_warrior_desc',
    icon: '\uD83D\uDE97',
    criteria: { type: 'unique_stations', count: 25 },
  },
  {
    id: 'photo_pro',
    name: 'Photo Pro',
    nameKey: 'badge_photo_pro',
    descriptionKey: 'badge_photo_pro_desc',
    icon: '\uD83D\uDCF7',
    criteria: { type: 'photos', count: 10 },
  },
  {
    id: 'pioneer',
    name: 'Pioneer',
    nameKey: 'badge_pioneer',
    descriptionKey: 'badge_pioneer_desc',
    icon: '\uD83D\uDCCD',
    criteria: { type: 'submitted_stations', count: 1 },
  },
  {
    id: 'community_champion',
    name: 'Community Champion',
    nameKey: 'badge_community_champion',
    descriptionKey: 'badge_community_champion_desc',
    icon: '\uD83C\uDFC6',
    criteria: { type: 'badges_earned', count: 5 },
  },
];

const STORAGE_KEY_PREFIX = '@wattson_badges_';

function storageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

// ─── User Stats from Supabase ────────────────────────────────────────

interface UserStats {
  reports: number;
  verifications: number;
  unique_stations: number;
  photos: number;
  submitted_stations: number;
}

async function fetchUserStats(userId: string): Promise<UserStats> {
  const stats: UserStats = {
    reports: 0,
    verifications: 0,
    unique_stations: 0,
    photos: 0,
    submitted_stations: 0,
  };

  try {
    // Count station reports
    const { count: reportCount } = await supabase
      .from('station_reports')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    stats.reports = reportCount || 0;

    // Count unique stations visited (reports at different stations)
    const { data: stationData } = await supabase
      .from('station_reports')
      .select('station_id')
      .eq('user_id', userId);
    if (stationData) {
      const uniqueStations = new Set(stationData.map((r: any) => r.station_id));
      stats.unique_stations = uniqueStations.size;
    }

    // Count photos uploaded (reports with non-empty photos array)
    const { data: photoData } = await supabase
      .from('station_reports')
      .select('photos')
      .eq('user_id', userId)
      .not('photos', 'eq', '{}');
    if (photoData) {
      let photoCount = 0;
      for (const row of photoData) {
        if (row.photos && Array.isArray(row.photos)) {
          photoCount += row.photos.length;
        }
      }
      stats.photos = photoCount;
    }

    // Count verifications (stations where user appears in verified_by)
    const { data: verifiedData } = await supabase
      .from('submitted_stations')
      .select('verified_by');
    if (verifiedData) {
      stats.verifications = verifiedData.filter(
        (s: any) => (s.verified_by || []).includes(userId)
      ).length;
    }

    // Count submitted stations
    const { count: submittedCount } = await supabase
      .from('submitted_stations')
      .select('*', { count: 'exact', head: true })
      .eq('submitted_by', userId);
    stats.submitted_stations = submittedCount || 0;
  } catch (err) {
    console.warn('[badgeService] Error fetching user stats:', err);
  }

  return stats;
}

// ─── Badge Service ───────────────────────────────────────────────────

export const badgeService = {
  /**
   * Returns all 10 badge definitions with the user's unlock status.
   */
  async getAllBadges(userId?: string): Promise<Badge[]> {
    const unlocked = userId ? await this._getStoredBadges(userId) : {};
    return BADGE_DEFINITIONS.map((def) => ({
      ...def,
      unlockedAt: unlocked[def.id] || undefined,
    }));
  },

  /**
   * Returns only the badges the user has earned.
   */
  async getUnlockedBadges(userId: string): Promise<Badge[]> {
    const all = await this.getAllBadges(userId);
    return all.filter((b) => !!b.unlockedAt);
  },

  /**
   * Returns progress toward each badge.
   */
  async getBadgeProgress(userId: string): Promise<BadgeProgress[]> {
    const stats = await fetchUserStats(userId);
    const unlocked = await this._getStoredBadges(userId);

    // Count currently earned badges (excluding community_champion for circular check)
    const earnedCount = Object.keys(unlocked).filter(id => id !== 'community_champion').length;

    return BADGE_DEFINITIONS.map((def) => {
      const current = this._getStatForType(stats, def.criteria.type, earnedCount);
      const target = def.criteria.count;
      return {
        badge: { ...def, unlockedAt: unlocked[def.id] || undefined },
        current: Math.min(current, target),
        target,
        percentage: Math.min(100, Math.round((current / target) * 100)),
      };
    });
  },

  /**
   * Checks all badge criteria and awards any newly earned badges.
   * Returns an array of newly unlocked badges (for showing celebration modal).
   */
  async checkAndAwardBadges(userId: string): Promise<Badge[]> {
    const stats = await fetchUserStats(userId);
    const stored = await this._getStoredBadges(userId);
    const newlyUnlocked: Badge[] = [];
    const now = new Date().toISOString();

    // Count currently earned badges (before this check)
    const previousEarnedCount = Object.keys(stored).length;

    for (const def of BADGE_DEFINITIONS) {
      // Skip if already earned
      if (stored[def.id]) continue;

      // For community_champion, count earned badges including ones we just unlocked
      const earnedForCheck =
        def.criteria.type === 'badges_earned'
          ? previousEarnedCount + newlyUnlocked.length
          : this._getStatForType(stats, def.criteria.type, previousEarnedCount + newlyUnlocked.length);

      if (earnedForCheck >= def.criteria.count) {
        stored[def.id] = now;
        newlyUnlocked.push({ ...def, unlockedAt: now });
      }
    }

    if (newlyUnlocked.length > 0) {
      await AsyncStorage.setItem(storageKey(userId), JSON.stringify(stored));
    }

    return newlyUnlocked;
  },

  // ── Private helpers ────────────────────────────────────────────────

  _getStatForType(stats: UserStats, type: string, earnedBadgeCount: number): number {
    switch (type) {
      case 'reports': return stats.reports;
      case 'verifications': return stats.verifications;
      case 'unique_stations': return stats.unique_stations;
      case 'photos': return stats.photos;
      case 'submitted_stations': return stats.submitted_stations;
      case 'badges_earned': return earnedBadgeCount;
      default: return 0;
    }
  },

  async _getStoredBadges(userId: string): Promise<Record<string, string>> {
    try {
      const raw = await AsyncStorage.getItem(storageKey(userId));
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },
};
