import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { origin, destination, currentBatteryPct, vehicleId, userId } = await req.json();

    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single();
    const { data: stations } = await supabase
      .from('stations')
      .select('*, connectors(*)')
      .eq('is_active', true);

    const prompt = `Plan an EV road trip in Egypt.

Origin: ${origin.lat}, ${origin.lng}
Destination: ${destination}
Vehicle: ${vehicle?.make} ${vehicle?.model}, ${vehicle?.battery_capacity_kwh}kWh battery
Current Battery: ${currentBatteryPct}%
Available charging stations: ${JSON.stringify(
      stations?.map((s: any) => ({
        id: s.id,
        name: s.name,
        lat: s.latitude,
        lng: s.longitude,
        area: s.area,
        connectors: s.connectors?.map((c: any) => ({
          type: c.type,
          kw: c.power_kw,
          price: c.price_per_kwh,
        })),
      })),
    )}

Return a JSON object with this structure:
{ "stops": [{ "stationId": "...", "stationName": "...", "address": "...", "latitude": number, "longitude": number, "estimatedArrival": "HH:MM", "chargeTimeMin": number, "estimatedKwh": number, "estimatedCost": number }], "totalDistanceKm": number, "totalTimeMin": number, "totalChargeCost": number, "summary": "..." }

Consider: realistic range at highway speeds (~150Wh/km with AC), arrive at each stop with >15% battery, prefer fast chargers, minimize total cost.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const aiResponse = await response.json();
    const text = aiResponse.content?.[0]?.text || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const routePlan = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : {
          stops: [],
          totalDistanceKm: 0,
          totalTimeMin: 0,
          totalChargeCost: 0,
          summary: 'Could not plan route.',
        };

    await supabase.from('ai_interactions').insert({
      user_id: userId,
      type: 'route_plan',
      input: JSON.stringify({ origin, destination, currentBatteryPct }),
      output: JSON.stringify(routePlan),
      model_used: 'claude-sonnet-4-20250514',
    });

    return new Response(JSON.stringify(routePlan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
