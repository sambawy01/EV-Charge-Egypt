import { supabase } from '../config/supabase';
import { useAuthStore } from '../stores/authStore';
import { badgeService } from './badgeService';
import { useBadgeStore } from '../stores/badgeStore';

export type StationStatus = 'available' | 'busy' | 'out_of_service' | 'partially_available' | 'iced';

export interface StationReport {
  id: string;
  station_id: string;
  user_id: string | null;
  status: StationStatus;
  available_spots: number | null;
  total_spots: number | null;
  comment: string | null;
  photos: string[];
  created_at: string;
}

export interface StationLiveStatus {
  status: StationStatus;
  availableSpots: number | null;
  totalSpots: number | null;
  lastReport: string; // ISO date
  lastReportTime: string; // formatted: "3:45 PM"
  reportCount: number; // reports in last 24h
  timeAgo: string; // "5 min ago", "2 hours ago"
  confidence: 'high' | 'medium' | 'low'; // based on recency
}

function getTimeAgo(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMin = Math.round((now - then) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function getConfidence(lastReportDate: string): 'high' | 'medium' | 'low' {
  const ageMinutes = (Date.now() - new Date(lastReportDate).getTime()) / 60000;
  if (ageMinutes < 30) return 'high';
  if (ageMinutes < 120) return 'medium';
  return 'low';
}

// In-memory cache
let _reportCache: { data: Map<string, StationReport[]>; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Client-side rate limiting
let _reportTimestamps: number[] = [];
const MAX_REPORTS_PER_MINUTE = 5;

function isRateLimited(): boolean {
  const now = Date.now();
  _reportTimestamps = _reportTimestamps.filter(t => now - t < 60000);
  if (_reportTimestamps.length >= MAX_REPORTS_PER_MINUTE) return true;
  _reportTimestamps.push(now);
  return false;
}

function buildLiveStatus(reports: StationReport[]): StationLiveStatus {
  const latest = reports[0];
  const last24h = reports.filter(
    (r) => Date.now() - new Date(r.created_at).getTime() < 24 * 60 * 60 * 1000,
  );
  const reportDate = new Date(latest.created_at);
  const timeStr = reportDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  return {
    status: latest.status,
    availableSpots: latest.available_spots,
    totalSpots: latest.total_spots,
    lastReport: latest.created_at,
    lastReportTime: timeStr,
    reportCount: last24h.length,
    timeAgo: getTimeAgo(latest.created_at),
    confidence: getConfidence(latest.created_at),
  };
}

export const stationReportService = {
  async uploadPhotos(
    stationId: string,
    photoUris: string[],
  ): Promise<string[]> {
    const urls: string[] = [];
    const timestamp = Date.now();

    for (let i = 0; i < photoUris.length; i++) {
      const uri = photoUris[i];
      try {
        // Fetch the image as a blob
        const response = await fetch(uri);
        const blob = await response.blob();
        const filePath = `${stationId}/${timestamp}_${i}.jpg`;

        const { error } = await supabase.storage
          .from('station-photos')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (error) {
          console.warn('[stationReportService] Photo upload failed:', error);
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from('station-photos')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          urls.push(publicUrlData.publicUrl);
        }
      } catch (err) {
        console.warn('[stationReportService] Photo upload error:', err);
      }
    }

    return urls;
  },

  async submitReport(report: {
    stationId: string;
    userId?: string;
    status: StationStatus;
    availableSpots?: number;
    totalSpots?: number;
    comment?: string;
    photos?: string[];
  }): Promise<boolean> {
    if (isRateLimited()) {
      console.warn('[stationReportService] Rate limited — max 5 reports per minute');
      return false;
    }

    // Always attach a user_id — required by RLS policy
    const effectiveUserId = report.userId || useAuthStore.getState().user?.id || 'anonymous';

    try {
      // Upload photos if provided
      let photoUrls: string[] = [];
      if (report.photos && report.photos.length > 0) {
        photoUrls = await this.uploadPhotos(report.stationId, report.photos);
      }

      const { error } = await supabase.from('station_reports').insert({
        station_id: report.stationId,
        user_id: effectiveUserId,
        status: report.status,
        available_spots: report.availableSpots ?? null,
        total_spots: report.totalSpots ?? null,
        comment: report.comment?.slice(0, 500) || null,
        photos: photoUrls,
      });
      if (error) throw error;
      // Invalidate cache
      _reportCache = null;

      // Check for badge unlocks (fire and forget — non-blocking)
      if (effectiveUserId && effectiveUserId !== 'anonymous') {
        badgeService.checkAndAwardBadges(effectiveUserId).then((newBadges) => {
          if (newBadges.length > 0) {
            useBadgeStore.getState().enqueueBadges(newBadges);
          }
        }).catch(() => {});
      }

      return true;
    } catch (err) {
      console.warn('[stationReportService] Submit failed:', err);
      return false;
    }
  },

  async getPhotoCountsForStations(
    stationIds: string[],
  ): Promise<Map<string, { count: number; firstPhotoUrl: string | null }>> {
    const result = new Map<string, { count: number; firstPhotoUrl: string | null }>();
    if (stationIds.length === 0) return result;

    try {
      const { data, error } = await supabase
        .from('station_reports')
        .select('station_id, photos')
        .in('station_id', stationIds)
        .not('photos', 'eq', '{}');
      if (error) throw error;

      // Aggregate: count total photos per station, keep first photo URL
      for (const row of data || []) {
        if (!row.photos || !Array.isArray(row.photos) || row.photos.length === 0) continue;
        const existing = result.get(row.station_id);
        if (existing) {
          existing.count += row.photos.length;
        } else {
          result.set(row.station_id, {
            count: row.photos.length,
            firstPhotoUrl: row.photos[0] || null,
          });
        }
      }
      return result;
    } catch {
      return result;
    }
  },

  async getPhotosForStation(stationId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('station_reports')
        .select('photos')
        .eq('station_id', stationId)
        .not('photos', 'eq', '{}')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      const allPhotos: string[] = [];
      for (const row of data || []) {
        if (row.photos && Array.isArray(row.photos)) {
          allPhotos.push(...row.photos);
        }
      }
      return allPhotos;
    } catch {
      return [];
    }
  },

  async getReportsForStation(stationId: string): Promise<StationReport[]> {
    try {
      const { data, error } = await supabase
        .from('station_reports')
        .select('*')
        .eq('station_id', stationId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data as StationReport[]) || [];
    } catch {
      return [];
    }
  },

  async getLiveStatus(stationId: string): Promise<StationLiveStatus | null> {
    const reports = await this.getReportsForStation(stationId);
    if (reports.length === 0) return null;
    return buildLiveStatus(reports);
  },

  async getAllLiveStatuses(): Promise<Map<string, StationLiveStatus>> {
    // Use cache if fresh
    if (_reportCache && Date.now() - _reportCache.fetchedAt < CACHE_TTL) {
      const result = new Map<string, StationLiveStatus>();
      for (const [stationId, reports] of _reportCache.data) {
        if (reports.length > 0) {
          result.set(stationId, buildLiveStatus(reports));
        }
      }
      return result;
    }

    try {
      const { data, error } = await supabase
        .from('station_reports')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;

      const grouped = new Map<string, StationReport[]>();
      for (const report of (data as StationReport[]) || []) {
        const existing = grouped.get(report.station_id) || [];
        existing.push(report);
        grouped.set(report.station_id, existing);
      }

      _reportCache = { data: grouped, fetchedAt: Date.now() };

      const result = new Map<string, StationLiveStatus>();
      for (const [stationId, reports] of grouped) {
        result.set(stationId, buildLiveStatus(reports));
      }
      return result;
    } catch {
      return new Map();
    }
  },
};
