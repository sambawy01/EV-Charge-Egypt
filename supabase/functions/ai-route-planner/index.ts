/**
 * ai-route-planner
 *
 * Plan an EV road trip via Claude. Stations are pre-filtered to a 50km
 * corridor around the origin→destination line and capped at 20 — this
 * shrinks the prompt from ~30K tokens to ~3K and dramatically improves
 * latency + cost.
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
import { filterStationsToCorridor } from '../_shared/geo.ts';
import { callLlm, extractJson, LlmError } from '../_shared/llm.ts';

const LLM_TIMEOUT_MS = 20_000;
const LLM_MODEL_LABEL = Deno.env.get('OLLAMA_MODEL') || 'gpt-oss:120b';

const MAX_PLACE_LEN = 500;
const CORRIDOR_KM = 50;
const MAX_CORRIDOR_STATIONS = 20;

type LatLng = { lat: number; lng: number };

function isLatLng(v: unknown): v is LatLng {
  if (!v || typeof v !== 'object') return false;
  const { lat, lng } = v as Record<string, unknown>;
  return (
    typeof lat === 'number' &&
    Number.isFinite(lat) &&
    lat >= -90 &&
    lat <= 90 &&
    typeof lng === 'number' &&
    Number.isFinite(lng) &&
    lng >= -180 &&
    lng <= 180
  );
}

function fallbackRoute() {
  return {
    stops: [],
    totalDistanceKm: 0,
    totalTimeMin: 0,
    totalChargeCost: 0,
    summary: 'Could not plan route.',
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
    console.error('[ai-route-planner] missing env vars');
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
    'ai-route-planner',
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
  const {
    origin: routeOrigin,
    destination,
    currentBatteryPct,
    vehicleId,
    destinationLatLng,
  } = body as Record<string, unknown>;

  if (!isLatLng(routeOrigin)) {
    return jsonError(
      'origin must be { lat, lng } in valid range',
      400,
      origin,
      requestId,
    );
  }

  // Destination can be a string (geocoded client-side) but we still need a
  // lat/lng for corridor filtering. Accept destinationLatLng as a separate
  // field; require it.
  if (typeof destination !== 'string' || destination.length === 0) {
    return jsonError('destination must be a non-empty string', 400, origin, requestId);
  }
  if (destination.length > MAX_PLACE_LEN) {
    return jsonError(
      `destination must be ≤ ${MAX_PLACE_LEN} chars`,
      400,
      origin,
      requestId,
    );
  }
  if (!isLatLng(destinationLatLng)) {
    return jsonError(
      'destinationLatLng must be { lat, lng } in valid range',
      400,
      origin,
      requestId,
    );
  }
  const cleanDestination = stripControlChars(destination);

  if (
    typeof currentBatteryPct !== 'number' ||
    !Number.isFinite(currentBatteryPct) ||
    currentBatteryPct < 0 ||
    currentBatteryPct > 100
  ) {
    return jsonError(
      'currentBatteryPct must be a number in [0,100]',
      400,
      origin,
      requestId,
    );
  }
  if (!isUuid(vehicleId)) {
    return jsonError('vehicleId must be a UUID', 400, origin, requestId);
  }

  // Vehicle must belong to the authed user — RLS enforces this via userClient.
  const { data: vehicle, error: vehErr } = await userClient
    .from('vehicles')
    .select('make, model, battery_capacity_kwh, user_id')
    .eq('id', vehicleId)
    .maybeSingle();
  if (vehErr) {
    console.error(
      `[ai-route-planner] vehicle query failed reqId=${requestId}:`,
      vehErr.message,
    );
    return jsonError('Failed to load vehicle', 500, origin, requestId);
  }
  if (!vehicle) {
    return jsonError('Vehicle not found', 404, origin, requestId);
  }

  // Stations are public read — use the user client (RLS for public stations
  // permits read).
  const { data: stations, error: stnErr } = await userClient
    .from('stations')
    .select('id, name, area, latitude, longitude, connectors(type, power_kw, price_per_kwh)')
    .eq('is_active', true);
  if (stnErr) {
    console.error(
      `[ai-route-planner] stations query failed reqId=${requestId}:`,
      stnErr.message,
    );
    return jsonError('Failed to load stations', 500, origin, requestId);
  }

  const corridor = filterStationsToCorridor(
    (stations ?? []) as Array<{
      id: string;
      name: string;
      area: string | null;
      latitude: number | null;
      longitude: number | null;
      connectors: Array<{ type: string; power_kw: number; price_per_kwh: number }>;
    }>,
    (routeOrigin as LatLng).lat,
    (routeOrigin as LatLng).lng,
    (destinationLatLng as LatLng).lat,
    (destinationLatLng as LatLng).lng,
    CORRIDOR_KM,
    MAX_CORRIDOR_STATIONS,
  );

  const stationPayload = corridor.map((s) => ({
    id: s.id,
    name: s.name,
    lat: s.latitude,
    lng: s.longitude,
    area: s.area,
    connectors: (s.connectors ?? []).map((c) => ({
      type: c.type,
      kw: c.power_kw,
      price: c.price_per_kwh,
    })),
  }));

  const safeMake = stripControlChars(String(vehicle.make ?? '')).slice(0, 40);
  const safeModel = stripControlChars(String(vehicle.model ?? '')).slice(0, 60);
  const cap = Number(vehicle.battery_capacity_kwh);
  const capStr = Number.isFinite(cap) ? `${cap}` : 'unknown';

  const prompt = `Plan an EV road trip in Egypt.

Origin: ${(routeOrigin as LatLng).lat}, ${(routeOrigin as LatLng).lng}
Destination: ${cleanDestination} (${(destinationLatLng as LatLng).lat}, ${(destinationLatLng as LatLng).lng})
Vehicle: ${safeMake} ${safeModel}, ${capStr}kWh battery
Current Battery: ${currentBatteryPct}%
Available charging stations (pre-filtered to ${CORRIDOR_KM}km corridor, top ${stationPayload.length}): ${JSON.stringify(stationPayload)}

Return a JSON object with this structure:
{ "stops": [{ "stationId": "...", "stationName": "...", "address": "...", "latitude": number, "longitude": number, "estimatedArrival": "HH:MM", "chargeTimeMin": number, "estimatedKwh": number, "estimatedCost": number }], "totalDistanceKm": number, "totalTimeMin": number, "totalChargeCost": number, "summary": "..." }

Consider: realistic range at highway speeds (~150Wh/km with AC), arrive at each stop with >15% battery, prefer fast chargers, minimize total cost.`;

  let routePlan: unknown = fallbackRoute();
  try {
    const result = await callLlm({
      caller: 'ai-route-planner',
      timeoutMs: LLM_TIMEOUT_MS,
      maxTokens: 1500,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });
    const parsed = extractJson(result.text);
    if (parsed) {
      routePlan = parsed;
    } else {
      console.error(
        `[ai-route-planner] JSON extract failed reqId=${requestId}: ${result.text.slice(0, 200)}`,
      );
      routePlan = fallbackRoute();
    }
  } catch (e) {
    if (e instanceof LlmError) {
      console.error(
        `[ai-route-planner] llm ${e.status} reqId=${requestId}: ${e.body.slice(0, 500)}`,
      );
    } else {
      console.error(
        `[ai-route-planner] llm call failed reqId=${requestId}:`,
        e,
      );
    }
    return jsonError('AI service unavailable', 502, origin, requestId);
  }

  svc
    .from('ai_interactions')
    .insert({
      user_id: user.id,
      type: 'route_plan',
      input: JSON.stringify({
        origin: routeOrigin,
        destination: cleanDestination,
        destinationLatLng,
        currentBatteryPct,
      }),
      output: JSON.stringify(routePlan),
      model_used: LLM_MODEL_LABEL,
    })
    .then(({ error }) => {
      if (error) {
        console.error(
          `[ai-route-planner] audit insert failed reqId=${requestId}:`,
          error.message,
        );
      }
    });

  return new Response(JSON.stringify(routePlan), {
    status: 200,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
});
