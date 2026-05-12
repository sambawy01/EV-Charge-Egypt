import { supabase } from '../config/supabase';
import type { PaymentMethod } from '../types/wallet';

interface TopUpInput {
  walletId: string;
  amount: number;
  method: PaymentMethod;
  /**
   * Optional caller-supplied idempotency key. If omitted, paymentService
   * generates a fresh one with crypto.randomUUID(). The hardened
   * process-payment Edge Function REQUIRES this — it rejects the request
   * with 400 otherwise — and uses it to dedupe replays so a network retry
   * never double-credits the wallet.
   */
  idempotencyKey?: string;
}

interface TopUpResult {
  success: boolean;
  transactionId: string;
  newBalance: number;
  /** True when the request was a replay (matched a prior idempotency key). */
  duplicate?: boolean;
  /** True while the gateway integration is still in simulate mode. */
  simulated?: boolean;
}

export const paymentService = {
  async topUp(input: TopUpInput): Promise<TopUpResult> {
    const idempotencyKey = input.idempotencyKey ?? crypto.randomUUID();
    const { data, error } = await supabase.functions.invoke(
      'process-payment',
      {
        body: {
          walletId: input.walletId,
          amount: input.amount,
          method: input.method,
          type: 'topup',
          idempotencyKey,
        },
      },
    );
    if (error) throw error;
    // The hardened process-payment Edge Function wraps its payload in a
    // top-level `data` field. supabase.functions.invoke does NOT unwrap that
    // (it returns the entire JSON body under its own `data` key), so we have
    // to dereference once. Some replay paths or future shape tweaks may also
    // return the payload at the top level, so fall back to `data` itself.
    const payload = (data && typeof data === 'object' && 'data' in data
      ? (data as { data: Record<string, unknown> }).data
      : data) as {
      transactionId: string;
      newBalance: number;
      duplicate?: boolean;
      simulated?: boolean;
    };
    return {
      success: true,
      transactionId: payload.transactionId,
      newBalance: payload.newBalance,
      duplicate: payload.duplicate,
      simulated: payload.simulated,
    };
  },

  async setupAutoTopUp(
    walletId: string,
    threshold: number,
    amount: number,
  ): Promise<void> {
    const { error } = await supabase
      .from('wallets')
      .update({ auto_topup_threshold: threshold, auto_topup_amount: amount } as any)
      .eq('id', walletId);
    if (error) throw error;
  },

  getPaymentMethods(): { key: PaymentMethod; label: string; icon: string }[] {
    return [
      { key: 'card', label: 'Credit/Debit Card', icon: '💳' },
      { key: 'fawry', label: 'Fawry', icon: '🏪' },
      { key: 'instapay', label: 'InstaPay', icon: '🏦' },
      { key: 'vodafone_cash', label: 'Vodafone Cash', icon: '📱' },
      { key: 'orange_cash', label: 'Orange Cash', icon: '📱' },
      { key: 'etisalat_cash', label: 'Etisalat Cash', icon: '📱' },
    ];
  },

  getTopUpPresets(): number[] {
    return [50, 100, 200, 500, 1000];
  },
};
