/**
 * ai-cost-optimizer
 *
 * Returns a JSON cost-analysis report for the authenticated user's charging
 * history over the requested period.
 *
 * Hardening: JWT auth, 10/min rate limit, period allow-list, 20s upstream
 * timeout, defensive JSON parse with structured fallback.
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import {
  corsHeaders,
  getAuthedUser,
  jsonError,
  newRequestId,
} from '../_shared/auth.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';

const ALLOWED_PERIODS = ['week', 'month', 'quarter', 'year'] as const;
type Period = (typeof ALLOWED_PERIODS)[number];

const ANTHROPIC_TIMEOUT_MS = 20_000;
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';

function fallbackReport(period: Period) {
  return {
    totalSpent: 0,
    period,
    byProvider: [],
    savings: [],
    tips: [],
    monthOverMonthChange: 0,
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
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!supabaseUrl || !anonKey || !serviceKey || !anthropicKey) {
    console.error('[ai-cost-optimizer] missing env vars');
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
    'ai-cost-optimizer',
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
  const { period } = body as Record<string, unknown>;
  if (
    typeof period !== 'string' ||
    !ALLOWED_PERIODS.includes(period as Period)
  ) {
    return jsonError(
      `period must be one of: ${ALLOWED_PERIODS.join(', ')}`,
      400,
      origin,
      requestId,
    );
  }
  const periodValue = period as Period;

  const { data: sessions, error: sessErr } = await userClient
    .from('charging_sessions')
    .select(
      '*, connector:connectors(*, station:stations(*, provider:providers(*)))',
    )
    .eq('user_id', user.id)
    .not('end_time', 'is', null)
    .order('created_at', { ascending: false })
    .limit(100);

  if (sessErr) {
    console.error(
      `[ai-cost-optimizer] sessions query failed reqId=${requestId}:`,
      sessErr.message,
    );
    return jsonError('Failed to load sessions', 500, origin, requestId);
  }

  const sessionSummary = (sessions ?? []).map((s: Record<string, unknown>) => {
    const conn = s.connector as Record<string, unknown> | null;
    const station = conn?.station as Record<string, unknown> | null;
    const provider = station?.provider as Record<string, unknown> | null;
    return {
      date: s.start_time,
      station: station?.name,
      provider: provider?.name,
      kwh: s.kwh_delivered,
      providerCost: s.cost_provider,
      serviceFee: s.cost_service_fee,
      total: s.cost_total,
      connectorType: conn?.type,
      powerKw: conn?.power_kw,
    };
  });

  const prompt = `Analyze this EV driver's charging costs and provide optimization tips.

Charging sessions (${periodValue}):
${JSON.stringify(sessionSummary)}

Return JSON: { "totalSpent": number, "period": "${periodValue}", "byProvider": [{"provider":"...","amount":number,"percentage":number}], "savings": [{"description":"...","amountSavable":number}], "tips": ["..."], "monthOverMonthChange": number }

Use EGP currency. Be specific about Egyptian providers and locations.`;

  let report: unknown = fallbackReport(periodValue);
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: AbortSignal.timeout(ANTHROPIC_TIMEOUT_MS),
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!response.ok) {
      const t = await response.text().catch(() => '<no body>');
      console.error(
        `[ai-cost-optimizer] anthropic ${response.status} reqId=${requestId}: ${t.slice(0, 500)}`,
      );
      return jsonError('AI service unavailable', 502, origin, requestId);
    }
    const aiResponse = await response.json();
    const text: string =
      aiResponse?.content?.[0]?.type === 'text'
        ? aiResponse.content[0].text
        : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        report = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error(
          `[ai-cost-optimizer] JSON parse failed reqId=${requestId}:`,
          e,
        );
        report = fallbackReport(periodValue);
      }
    }
  } catch (e) {
    console.error(
      `[ai-cost-optimizer] anthropic call failed reqId=${requestId}:`,
      e,
    );
    return jsonError('AI service unavailable', 502, origin, requestId);
  }

  svc
    .from('ai_interactions')
    .insert({
      user_id: user.id,
      type: 'cost_optimizer',
      input: periodValue,
      output: JSON.stringify(report),
      model_used: ANTHROPIC_MODEL,
    })
    .then(({ error }) => {
      if (error) {
        console.error(
          `[ai-cost-optimizer] audit insert failed reqId=${requestId}:`,
          error.message,
        );
      }
    });

  return new Response(JSON.stringify(report), {
    status: 200,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
});
