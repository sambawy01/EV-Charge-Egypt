import { supabase } from '../config/supabase';

export type StationStatus = 'available' | 'busy' | 'out_of_service' | 'partially_available';

export interface StationReport {
  id: string;
  station_id: string;
  user_id: string | null;
  status: StationStatus;
  available_spots: number | null;
  total_spots: number | null;
  comment: string | null;
  created_at: string;
}

export interface StationLiveStatus {
  status: StationStatus;
  availableSpots: number | null;
  totalSpots: number | null;
  lastReport: string; // ISO date
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

function buildLiveStatus(reports: StationReport[]): StationLiveStatus {
  const latest = reports[0];
  const last24h = reports.filter(
    (r) => Date.now() - new Date(r.created_at).getTime() < 24 * 60 * 60 * 1000,
  );
  return {
    status: latest.status,
    availableSpots: latest.available_spots,
    totalSpots: latest.total_spots,
    lastReport: latest.created_at,
    reportCount: last24h.length,
    timeAgo: getTimeAgo(latest.created_at),
    confidence: getConfidence(latest.created_at),
  };
}

export const stationReportService = {
  async submitReport(report: {
    stationId: string;
    userId?: string;
    status: StationStatus;
    availableSpots?: number;
    totalSpots?: number;
    comment?: string;
  }): Promise<boolean> {
    try {
      const { error } = await supabase.from('station_reports').insert({
        station_id: report.stationId,
        user_id: report.userId || null,
        status: report.status,
        available_spots: report.availableSpots ?? null,
        total_spots: report.totalSpots ?? null,
        comment: report.comment || null,
      });
      if (error) throw error;
      // Invalidate cache
      _reportCache = null;
      return true;
    } catch (err) {
      console.warn('[stationReportService] Submit failed:', err);
      return false;
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
