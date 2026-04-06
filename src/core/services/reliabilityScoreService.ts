import { supabase } from '../config/supabase';

/**
 * WattsOn Reliability Score (1.0 – 10.0)
 *
 * Every community report is proximity-verified (100 m GPS lock),
 * so each one counts as a verified data point — a stricter signal
 * than honor-system platforms like PlugShare.
 *
 * Algorithm
 * ---------
 * baseScore      = positiveReports / totalReports  (0..1)
 * recencyBoost   = time-weighted average (7d = 3x, 30d = 2x, older = 1x)
 * confidence     = min(1.0, log(total + 1) / log(20))
 * consistency    = 1.0 + 0.05 * (1 - entropy)  // bonus for stable status
 *
 * finalScore = clamp(baseScore * recencyBoost * confidence * consistency * 10, 1.0, 10.0)
 */

export interface ReliabilityScore {
  score: number;          // 1.0 – 10.0, one decimal
  totalReports: number;
  label: 'excellent' | 'good' | 'fair' | 'poor';
  color: 'green' | 'yellow' | 'red';
}

// ---- Cache ----------------------------------------------------------------

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
let _scoreCache: Map<string, ReliabilityScore | null> = new Map();
let _allFetchedAt = 0;

function clearCache() {
  _scoreCache.clear();
  _allFetchedAt = 0;
}

// ---- Helpers --------------------------------------------------------------

const POSITIVE_STATUSES = new Set(['available', 'partially_available']);
const NEGATIVE_STATUSES = new Set(['busy', 'out_of_service', 'iced']);

interface RawReport {
  station_id: string;
  status: string;
  created_at: string;
}

function recencyWeight(createdAt: string): number {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays <= 7) return 3;
  if (ageDays <= 30) return 2;
  return 1;
}

function computeScore(reports: RawReport[]): ReliabilityScore | null {
  if (reports.length === 0) return null;

  const total = reports.length;

  // 1) Recency-weighted positive ratio
  let weightedPositive = 0;
  let weightedTotal = 0;
  const statusCounts: Record<string, number> = {};

  for (const r of reports) {
    const w = recencyWeight(r.created_at);
    const isPositive = POSITIVE_STATUSES.has(r.status);
    if (isPositive) weightedPositive += w;
    weightedTotal += w;

    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  }

  const baseScore = weightedTotal > 0 ? weightedPositive / weightedTotal : 0;

  // 2) Confidence multiplier — logarithmic, caps near 20 reports
  const confidence = Math.min(1.0, Math.log(total + 1) / Math.log(20));

  // 3) Consistency bonus — dominant status gets a small boost
  const statusValues = Object.values(statusCounts);
  const maxCount = Math.max(...statusValues);
  const dominance = maxCount / total; // 0..1
  const consistency = 1.0 + 0.05 * dominance; // 1.0 .. 1.05

  // 4) Final score
  let score = baseScore * confidence * consistency * 10;
  score = Math.round(score * 10) / 10; // one decimal
  score = Math.max(1.0, Math.min(10.0, score));

  return {
    score,
    totalReports: total,
    ...labelAndColor(score),
  };
}

function labelAndColor(score: number): { label: ReliabilityScore['label']; color: ReliabilityScore['color'] } {
  if (score >= 8.0) return { label: 'excellent', color: 'green' };
  if (score >= 5.0) return { label: 'good', color: 'yellow' };
  return { label: 'poor', color: 'red' };
}

// ---- Public API -----------------------------------------------------------

export const reliabilityScoreService = {
  /**
   * Fetch the reliability score for a single station.
   * Returns null when the station has no reports.
   */
  async getScore(stationId: string): Promise<ReliabilityScore | null> {
    // Check cache
    if (_scoreCache.has(stationId) && Date.now() - _allFetchedAt < CACHE_TTL) {
      return _scoreCache.get(stationId) ?? null;
    }

    try {
      const { data, error } = await supabase
        .from('station_reports')
        .select('station_id, status, created_at')
        .eq('station_id', stationId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const result = computeScore((data as RawReport[]) || []);
      _scoreCache.set(stationId, result);
      return result;
    } catch (err) {
      console.warn('[reliabilityScoreService] getScore failed:', err);
      return null;
    }
  },

  /**
   * Bulk-fetch reliability scores for all stations that have reports.
   * Results are cached for 10 minutes.
   */
  async getAllScores(): Promise<Map<string, ReliabilityScore>> {
    if (_allFetchedAt && Date.now() - _allFetchedAt < CACHE_TTL) {
      const result = new Map<string, ReliabilityScore>();
      for (const [id, score] of _scoreCache) {
        if (score) result.set(id, score);
      }
      return result;
    }

    try {
      // Fetch last 90 days of reports (sufficient for scoring)
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('station_reports')
        .select('station_id, status, created_at')
        .gte('created_at', ninetyDaysAgo)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by station
      const grouped = new Map<string, RawReport[]>();
      for (const report of (data as RawReport[]) || []) {
        const existing = grouped.get(report.station_id) || [];
        existing.push(report);
        grouped.set(report.station_id, existing);
      }

      // Compute scores
      const result = new Map<string, ReliabilityScore>();
      _scoreCache.clear();
      for (const [stationId, reports] of grouped) {
        const score = computeScore(reports);
        _scoreCache.set(stationId, score);
        if (score) result.set(stationId, score);
      }
      _allFetchedAt = Date.now();

      return result;
    } catch (err) {
      console.warn('[reliabilityScoreService] getAllScores failed:', err);
      return new Map();
    }
  },

  /** Invalidate cache (e.g. after submitting a report). */
  invalidateCache: clearCache,
};
