/**
 * ai-predict-availability
 *
 * Returns a heuristic availability prediction for a single station based on
 * cached station_analytics + current connector status. No AI call — kept on
 * the same hardening contract for consistency (JWT, rate limit, validation).
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import {
  corsHeaders,
  getAuthedUser,
  isUuid,
  jsonError,
  newRequestId,
} from '../_shared/auth.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';

serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const requestId = req.headers.get('x-request-id') ?? newRequestId();

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }
  if (req.method !== 'POST') {
    return jsonError('Method not allowed', 405, origin, requestId);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error('[ai-predict-availability] missing env vars');
    return jsonError('Service misconfigured', 500, origin, requestId);
  }

  const auth = await getAuthedUser(req, supabaseUrl, anonKey);
  if ('error' in auth) return auth.error;
  const { user, userClient } = auth;

  const svc = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const allowed = await checkRateLimit(
    svc,
    user.id,
    'ai-predict-availability',
    10,
    60,
  );
  if (!allowed) {
    return jsonError('Rate limit exceeded (10/min)', 429, origin, requestId);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON body', 400, origin, requestId);
  }
  if (!body || typeof body !== 'object') {
    return jsonError('Invalid body', 400, origin, requestId);
  }
  const { stationId } = body as Record<string, unknown>;
  if (!isUuid(stationId)) {
    return jsonError('stationId must be a UUID', 400, origin, requestId);
  }

  const now = new Date();
  const hourOfDay = now.getHours();
  const dayOfWeek = now.getDay();

  const { data: analytics, error: aErr } = await userClient
    .from('station_analytics')
    .select('avg_occupancy_pct, sample_count, avg_wait_min')
    .eq('station_id', stationId)
    .eq('hour_of_day', hourOfDay)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle();
  if (aErr) {
    console.error(
      `[ai-predict-availability] analytics query failed reqId=${requestId}:`,
      aErr.message,
    );
    return jsonError('Failed to load analytics', 500, origin, requestId);
  }

  const { data: connectors, error: cErr } = await userClient
    .from('connectors')
    .select('status')
    .eq('station_id', stationId);
  if (cErr) {
    console.error(
      `[ai-predict-availability] connectors query failed reqId=${requestId}:`,
      cErr.message,
    );
    return jsonError('Failed to load connectors', 500, origin, requestId);
  }

  const connArr = connectors ?? [];
  const available = connArr.filter(
    (c: { status?: string }) => c.status === 'available',
  ).length;
  const total = connArr.length || 1;

  const occupancyPct =
    (analytics?.avg_occupancy_pct as number | undefined) ??
    (1 - available / total) * 100;

  let prediction = 'No data available yet.';
  let confidence = 0.5;

  const sampleCount = Number(analytics?.sample_count ?? 0);
  if (analytics && sampleCount > 10) {
    confidence = Math.min(0.95, 0.5 + sampleCount * 0.01);
    if (occupancyPct < 30) prediction = 'Usually free at this time.';
    else if (occupancyPct < 60)
      prediction = 'Moderately busy. Short wait possible.';
    else if (occupancyPct < 80)
      prediction = 'Gets busy around now. Consider booking ahead.';
    else prediction = 'Usually very busy at this time. Try off-peak hours.';
  }

  const result = {
    stationId,
    currentStatus: available > 0 ? 'available' : 'occupied',
    prediction,
    confidence,
    bestTimeToVisit:
      occupancyPct > 50
        ? '6:00 AM - 9:00 AM or 9:00 PM - 11:00 PM'
        : 'Good time to visit now',
    averageWaitMin: Number(analytics?.avg_wait_min ?? 0),
  };

  // Light audit (no AI cost but still useful for product analytics).
  svc
    .from('ai_interactions')
    .insert({
      user_id: user.id,
      type: 'predict_availability',
      input: stationId,
      output: JSON.stringify(result),
      model_used: 'heuristic',
    })
    .then(({ error }) => {
      if (error) {
        console.error(
          `[ai-predict-availability] audit insert failed reqId=${requestId}:`,
          error.message,
        );
      }
    });

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
});
