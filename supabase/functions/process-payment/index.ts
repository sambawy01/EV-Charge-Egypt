import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { walletId, amount, method, type } = await req.json();

    if (!walletId || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid input' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // In production: integrate with payment gateway (Fawry API, Paymob, etc.)
    // For now: simulate successful payment
    const paymentRef = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Update wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('id', walletId)
      .single();

    if (walletError) throw walletError;

    const newBalance = (wallet.balance || 0) + amount;
    await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('id', walletId);

    // Record transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        wallet_id: walletId,
        type,
        amount,
        method,
        reference_id: paymentRef,
        status: 'completed',
      })
      .select()
      .single();

    if (txError) throw txError;

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: transaction.id,
        newBalance,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
