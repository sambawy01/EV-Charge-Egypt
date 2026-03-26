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

    const { userId, period } = await req.json();

    const { data: sessions } = await supabase
      .from('charging_sessions')
      .select('*, connector:connectors(*, station:stations(*, provider:providers(*)))')
      .eq('user_id', userId)
      .not('end_time', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    const prompt = `Analyze this EV driver's charging costs and provide optimization tips.

Charging sessions (${period}):
${JSON.stringify(
  sessions?.map((s: any) => ({
    date: s.start_time,
    station: s.connector?.station?.name,
    provider: s.connector?.station?.provider?.name,
    kwh: s.kwh_delivered,
    providerCost: s.cost_provider,
    serviceFee: s.cost_service_fee,
    total: s.cost_total,
    connectorType: s.connector?.type,
    powerKw: s.connector?.power_kw,
  })),
)}

Return JSON: { "totalSpent": number, "period": "${period}", "byProvider": [{"provider":"...","amount":number,"percentage":number}], "savings": [{"description":"...","amountSavable":number}], "tips": ["..."], "monthOverMonthChange": number }

Use EGP currency. Be specific about Egyptian providers and locations.`;

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
    const report = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : { totalSpent: 0, period, byProvider: [], savings: [], tips: [], monthOverMonthChange: 0 };

    await supabase.from('ai_interactions').insert({
      user_id: userId,
      type: 'cost_optimizer',
      input: period,
      output: JSON.stringify(report),
      model_used: 'claude-sonnet-4-20250514',
    });

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
