/**
 * ai-battery-health
 *
 * Estimate battery health based on charging history. Read-only, AI-backed.
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import {
  corsHeaders,
  getAuthedUser,
  isUuid,
  jsonError,
  newRequestId,
  stripControlChars,
} from '../_shared/auth.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { callLlm, extractJson, LlmError } from '../_shared/llm.ts';

const LLM_TIMEOUT_MS = 20_000;
const LLM_MODEL_LABEL = Deno.env.get('OLLAMA_MODEL') || 'gpt-oss:120b';

function fallbackHealth(fastChargeRatio: number) {
  return {
    score: 85,
    fastChargeRatio,
    avgDepthOfDischarge: 0.6,
    recommendations: ['Insufficient data for analysis.'],
    degradationEstimate: 'N/A',
  };
}

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
  const llmKey = Deno.env.get('OLLAMA_API_KEY');
  if (!supabaseUrl || !anonKey || !serviceKey || !llmKey) {
    console.error('[ai-battery-health] missing env vars');
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
    'ai-battery-health',
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
  const { vehicleId } = body as Record<string, unknown>;
  if (!isUuid(vehicleId)) {
    return jsonError('vehicleId must be a UUID', 400, origin, requestId);
  }

  // RLS ensures the user can only fetch their own vehicle.
  const { data: vehicle, error: vehErr } = await userClient
    .from('vehicles')
    .select('make, model, battery_capacity_kwh')
    .eq('id', vehicleId)
    .maybeSingle();
  if (vehErr) {
    console.error(
      `[ai-battery-health] vehicle query failed reqId=${requestId}:`,
      vehErr.message,
    );
    return jsonError('Failed to load vehicle', 500, origin, requestId);
  }
  if (!vehicle) {
    return jsonError('Vehicle not found', 404, origin, requestId);
  }

  const { data: sessions, error: sessErr } = await userClient
    .from('charging_sessions')
    .select('start_time, kwh_delivered, connector:connectors(power_kw)')
    .eq('user_id', user.id)
    .not('end_time', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50);
  if (sessErr) {
    console.error(
      `[ai-battery-health] sessions query failed reqId=${requestId}:`,
      sessErr.message,
    );
    return jsonError('Failed to load sessions', 500, origin, requestId);
  }

  const sessionsArr = sessions ?? [];
  const fastCharges = sessionsArr.filter(
    (s: Record<string, unknown>) =>
      (s.connector as { power_kw?: number } | null)?.power_kw !== undefined &&
      Number((s.connector as { power_kw?: number }).power_kw) >= 50,
  ).length;
  const totalCharges = Math.max(sessionsArr.length, 1);
  const fastChargeRatio = fastCharges / totalCharges;

  const safeMake = stripControlChars(String(vehicle.make ?? '')).slice(0, 40);
  const safeModel = stripControlChars(String(vehicle.model ?? '')).slice(0, 60);
  const cap = Number(vehicle.battery_capacity_kwh);
  const capStr = Number.isFinite(cap) ? `${cap}` : 'unknown';

  const prompt = `Analyze this EV battery health based on charging patterns.

Vehicle: ${safeMake} ${safeModel}, ${capStr}kWh
Total sessions: ${totalCharges}
Fast charge ratio: ${(fastChargeRatio * 100).toFixed(0)}%
Sessions data: ${JSON.stringify(
    sessionsArr.slice(0, 20).map((s: Record<string, unknown>) => ({
      kwh: s.kwh_delivered,
      powerKw: (s.connector as { power_kw?: number } | null)?.power_kw,
      date: s.start_time,
    })),
  )}

Return JSON: { "score": number (0-100), "fastChargeRatio": number, "avgDepthOfDischarge": number, "recommendations": ["..."], "degradationEstimate": "..." }`;

  let health: unknown = fallbackHealth(fastChargeRatio);
  try {
    const result = await callLlm({
      caller: 'ai-battery-health',
      timeoutMs: LLM_TIMEOUT_MS,
      maxTokens: 1024,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });
    const parsed = extractJson(result.text);
    if (parsed) {
      health = parsed;
    } else {
      console.error(
        `[ai-battery-health] JSON extract failed reqId=${requestId}: ${result.text.slice(0, 200)}`,
      );
      health = fallbackHealth(fastChargeRatio);
    }
  } catch (e) {
    if (e instanceof LlmError) {
      console.error(
        `[ai-battery-health] llm ${e.status} reqId=${requestId}: ${e.body.slice(0, 500)}`,
      );
    } else {
      console.error(
        `[ai-battery-health] llm call failed reqId=${requestId}:`,
        e,
      );
    }
    return jsonError('AI service unavailable', 502, origin, requestId);
  }

  svc
    .from('ai_interactions')
    .insert({
      user_id: user.id,
      type: 'battery_health',
      input: vehicleId,
      output: JSON.stringify(health),
      model_used: LLM_MODEL_LABEL,
    })
    .then(({ error }) => {
      if (error) {
        console.error(
          `[ai-battery-health] audit insert failed reqId=${requestId}:`,
          error.message,
        );
      }
    });

  return new Response(JSON.stringify(health), {
    status: 200,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
});
