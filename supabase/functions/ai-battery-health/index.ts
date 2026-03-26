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

    const { userId, vehicleId } = await req.json();

    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single();
    const { data: sessions } = await supabase
      .from('charging_sessions')
      .select('*, connector:connectors(*)')
      .eq('user_id', userId)
      .not('end_time', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);

    const fastCharges = sessions?.filter((s: any) => s.connector?.power_kw >= 50).length || 0;
    const totalCharges = sessions?.length || 1;
    const fastChargeRatio = fastCharges / totalCharges;

    const prompt = `Analyze this EV battery health based on charging patterns.

Vehicle: ${vehicle?.make} ${vehicle?.model}, ${vehicle?.battery_capacity_kwh}kWh
Total sessions: ${totalCharges}
Fast charge ratio: ${(fastChargeRatio * 100).toFixed(0)}%
Sessions data: ${JSON.stringify(
      sessions?.slice(0, 20).map((s: any) => ({
        kwh: s.kwh_delivered,
        powerKw: s.connector?.power_kw,
        date: s.start_time,
      })),
    )}

Return JSON: { "score": number (0-100), "fastChargeRatio": number, "avgDepthOfDischarge": number, "recommendations": ["..."], "degradationEstimate": "..." }`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const aiResponse = await response.json();
    const text = aiResponse.content?.[0]?.text || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const health = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : {
          score: 85,
          fastChargeRatio,
          avgDepthOfDischarge: 0.6,
          recommendations: ['Insufficient data for analysis.'],
          degradationEstimate: 'N/A',
        };

    await supabase.from('ai_interactions').insert({
      user_id: userId,
      type: 'battery_health',
      input: vehicleId,
      output: JSON.stringify(health),
      model_used: 'claude-sonnet-4-20250514',
    });

    return new Response(JSON.stringify(health), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
