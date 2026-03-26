export type TransactionType = 'topup' | 'charge' | 'subscription' | 'refund' | 'credit_bonus';
export type PaymentMethod = 'card' | 'fawry' | 'instapay' | 'vodafone_cash' | 'orange_cash' | 'etisalat_cash' | 'credits' | 'system';

export interface Wallet {
  id: string;
  user_id: string | null;
  fleet_id: string | null;
  balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  type: TransactionType;
  amount: number;
  method: PaymentMethod | null;
  reference_id: string | null;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}
