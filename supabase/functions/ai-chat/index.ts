import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { message, userId, history } = await req.json();

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId);
    const { data: recentSessions } = await supabase
      .from('charging_sessions')
      .select('*, connector:connectors(*, station:stations(*))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    const systemPrompt = `You are Charge AI, the intelligent assistant for WattsOn — Egypt's unified EV charging platform.

You help drivers with:
- Finding charging stations (5 providers: IKARUS, Sha7en, Elsewedy Plug, Kilowatt EV, New Energy)
- Comparing prices across providers
- Trip planning with charging stops
- Troubleshooting charging issues
- Battery care tips
- Cost optimization

User context:
- Name: ${profile?.full_name || 'Driver'}
- Vehicles: ${vehicles?.map((v: any) => `${v.make} ${v.model} (${v.battery_capacity_kwh}kWh)`).join(', ') || 'None registered'}
- Recent charges: ${recentSessions?.length || 0} sessions
- Location: Egypt (Cairo area)
- Currency: EGP

Be concise, helpful, and Egypt-specific. Use EGP for all prices. Reference real Egyptian areas and landmarks.`;

    const messages = [
      ...(history || []).map((h: any) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

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
        system: systemPrompt,
        messages,
      }),
    });

    const aiResponse = await response.json();
    const aiMessage = aiResponse.content?.[0]?.text || 'Sorry, I could not process that.';

    await supabase.from('ai_interactions').insert({
      user_id: userId,
      type: 'chat',
      input: message,
      output: aiMessage,
      model_used: 'claude-sonnet-4-20250514',
    });

    return new Response(JSON.stringify({ message: aiMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
