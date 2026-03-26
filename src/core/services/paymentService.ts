import { supabase } from '../config/supabase';
import type { PaymentMethod } from '../types/wallet';

interface TopUpInput {
  walletId: string;
  amount: number;
  method: PaymentMethod;
}

interface TopUpResult {
  success: boolean;
  transactionId: string;
  newBalance: number;
}

export const paymentService = {
  async topUp(input: TopUpInput): Promise<TopUpResult> {
    const { data, error } = await supabase.functions.invoke(
      'process-payment',
      {
        body: {
          walletId: input.walletId,
          amount: input.amount,
          method: input.method,
          type: 'topup',
        },
      },
    );
    if (error) throw error;
    return data;
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
