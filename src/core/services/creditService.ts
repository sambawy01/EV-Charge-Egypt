import { supabase } from '../config/supabase';
import { CREDIT_BONUSES } from '../config/constants';

export const creditService = {
  calculateBonus(amount: number): number {
    const thresholds = Object.keys(CREDIT_BONUSES).map(Number).sort((a, b) => b - a);
    for (const threshold of thresholds) {
      if (amount >= threshold) return CREDIT_BONUSES[threshold];
    }
    return 0;
  },

  async topUpCredits(
    fleetId: string,
    amount: number,
    method: string,
  ): Promise<{ newBalance: number; bonus: number }> {
    const bonus = this.calculateBonus(amount);
    const totalCredit = amount + bonus;

    const { data: fleet } = await supabase.from('fleets').select('credit_balance').eq('id', fleetId).single();
    const currentBalance = (fleet as any)?.credit_balance || 0;
    const newBalance = currentBalance + totalCredit;

    await supabase.from('fleets').update({ credit_balance: newBalance }).eq('id', fleetId);

    const { data: wallet } = await supabase.from('wallets').select('id').eq('fleet_id', fleetId).single();
    if (wallet) {
      await supabase.from('wallets').update({ balance: newBalance }).eq('id', (wallet as any).id);
      await supabase.from('transactions').insert({
        wallet_id: (wallet as any).id,
        type: 'topup',
        amount,
        method,
        status: 'completed',
      });
      if (bonus > 0) {
        await supabase.from('transactions').insert({
          wallet_id: (wallet as any).id,
          type: 'credit_bonus',
          amount: bonus,
          method: 'system',
          status: 'completed',
        });
      }
    }

    return { newBalance, bonus };
  },

  async setupAutoTopUp(fleetId: string, threshold: number, amount: number): Promise<void> {
    const { error } = await supabase
      .from('fleets')
      .update({ auto_topup_threshold: threshold, auto_topup_amount: amount })
      .eq('id', fleetId);
    if (error) throw error;
  },

  async setDriverLimit(memberId: string, dailyLimit: number, weeklyLimit: number): Promise<void> {
    const { error } = await supabase
      .from('fleet_members')
      .update({ daily_limit: dailyLimit, weekly_limit: weeklyLimit })
      .eq('id', memberId);
    if (error) throw error;
  },

  getBonusTiers(): { amount: number; bonus: number; discount: string }[] {
    return [
      { amount: 10000, bonus: 500, discount: '5%' },
      { amount: 25000, bonus: 1500, discount: '6%' },
      { amount: 50000, bonus: 4000, discount: '8%' },
      { amount: 100000, bonus: 12000, discount: '12%' },
    ];
  },
};
