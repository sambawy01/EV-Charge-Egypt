import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { stationId } = await req.json();

    const now = new Date();
    const hourOfDay = now.getHours();
    const dayOfWeek = now.getDay();

    const { data: analytics } = await supabase
      .from('station_analytics')
      .select('*')
      .eq('station_id', stationId)
      .eq('hour_of_day', hourOfDay)
      .eq('day_of_week', dayOfWeek)
      .single();

    const { data: connectors } = await supabase
      .from('connectors')
      .select('status')
      .eq('station_id', stationId);

    const available = connectors?.filter((c: any) => c.status === 'available').length || 0;
    const total = connectors?.length || 1;

    const occupancyPct = analytics?.avg_occupancy_pct || (1 - available / total) * 100;
    let prediction = 'No data available yet.';
    let confidence = 0.5;

    if (analytics && analytics.sample_count > 10) {
      confidence = Math.min(0.95, 0.5 + analytics.sample_count * 0.01);
      if (occupancyPct < 30) prediction = 'Usually free at this time.';
      else if (occupancyPct < 60) prediction = 'Moderately busy. Short wait possible.';
      else if (occupancyPct < 80) prediction = 'Gets busy around now. Consider booking ahead.';
      else prediction = 'Usually very busy at this time. Try off-peak hours.';
    }

    const result = {
      stationId,
      currentStatus: available > 0 ? 'available' : 'occupied',
      prediction,
      confidence,
      bestTimeToVisit:
        occupancyPct > 50 ? '6:00 AM – 9:00 AM or 9:00 PM – 11:00 PM' : 'Good time to visit now',
      averageWaitMin: analytics?.avg_wait_min || 0,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
