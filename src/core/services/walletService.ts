import { supabase } from '../config/supabase';
import type { Wallet, Transaction, PaymentMethod } from '../types/wallet';

export const walletService = {
  async getWallet(userId: string): Promise<Wallet | null> {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) return null;
    return data;
  },

  async getOrCreateWallet(userId: string): Promise<Wallet> {
    const existing = await this.getWallet(userId);
    if (existing) return existing;

    const { data, error } = await supabase
      .from('wallets')
      .insert({ user_id: userId, balance: 0, currency: 'EGP' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getTransactions(
    walletId: string,
    limit = 50,
  ): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('wallet_id', walletId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  async getFleetWallet(fleetId: string): Promise<Wallet | null> {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('fleet_id', fleetId)
      .single();
    if (error) return null;
    return data;
  },

  hasSufficientBalance(balance: number, amount: number): boolean {
    return balance >= amount;
  },

  async recordTransaction(
    walletId: string,
    type: string,
    amount: number,
    method: PaymentMethod,
    referenceId?: string,
  ): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        wallet_id: walletId,
        type,
        amount,
        method,
        reference_id: referenceId || null,
        status: 'completed',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
