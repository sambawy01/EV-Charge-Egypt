# Wallet & Payments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the wallet system with balance display, top-up via Egyptian payment methods (card, Fawry, InstaPay, mobile wallets), transaction history, PDF receipt generation, and auto-top-up.
**Architecture:** WalletService manages balance and transactions via Supabase. TopUpScreen integrates with a process-payment Edge Function that handles payment gateway interactions. Transactions are recorded atomically. PDF receipts are generated client-side and shareable.
**Tech Stack:** Supabase Edge Functions (Deno), expo-print (PDF), expo-sharing, React Query, Zustand

---

## File Structure

```
src/
├── core/
│   ├── services/
│   │   ├── walletService.ts
│   │   ├── paymentService.ts
│   │   └── receiptService.ts
│   ├── queries/
│   │   ├── useWallet.ts
│   │   ├── useTransactions.ts
│   │   └── useTopUp.ts
│   └── stores/
│       └── walletStore.ts
├── driver/
│   ├── screens/
│   │   ├── WalletScreen.tsx
│   │   ├── TopUpScreen.tsx
│   │   └── TransactionHistoryScreen.tsx
│   └── components/
│       ├── BalanceCard.tsx
│       ├── PaymentMethodSelector.tsx
│       ├── AmountSelector.tsx
│       ├── TransactionItem.tsx
│       └── ReceiptModal.tsx
├── supabase/
│   └── functions/
│       └── process-payment/
│           └── index.ts
└── __tests__/
    ├── walletService.test.ts
    ├── walletStore.test.ts
    ├── BalanceCard.test.tsx
    └── TransactionItem.test.tsx
```

---

## Task 1: Wallet Service

- [ ] **Step 1: Write test**
  - File: `__tests__/walletService.test.ts`
  ```typescript
  import { walletService } from '@/core/services/walletService';

  jest.mock('@/core/config/supabase', () => ({
    supabase: {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'w1', balance: 500, currency: 'EGP' }, error: null }),
            order: jest.fn().mockReturnValue({ data: [], error: null }),
          }),
        }),
        insert: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: 'w1', balance: 500 }, error: null }) }) }),
        update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: null, error: null }) }),
      }),
      rpc: jest.fn().mockResolvedValue({ data: { balance: 600 }, error: null }),
    },
  }));

  describe('walletService', () => {
    it('gets wallet balance', async () => {
      const wallet = await walletService.getWallet('u1');
      expect(wallet).toHaveProperty('balance');
      expect(wallet?.balance).toBe(500);
    });
    it('checks sufficient balance', () => {
      expect(walletService.hasSufficientBalance(500, 100)).toBe(true);
      expect(walletService.hasSufficientBalance(50, 100)).toBe(false);
    });
  });
  ```

- [ ] **Step 2: Verify fails**
  ```bash
  npx jest __tests__/walletService.test.ts
  ```

- [ ] **Step 3: Implement**
  - File: `src/core/services/walletService.ts`
  ```typescript
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

    async getTransactions(walletId: string, limit = 50): Promise<Transaction[]> {
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

    async recordTransaction(walletId: string, type: string, amount: number, method: PaymentMethod, referenceId?: string): Promise<Transaction> {
      const { data, error } = await supabase
        .from('transactions')
        .insert({ wallet_id: walletId, type, amount, method, reference_id: referenceId || null, status: 'completed' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  };
  ```

- [ ] **Step 4: Verify passes**
  ```bash
  npx jest __tests__/walletService.test.ts
  ```

- [ ] **Step 5: Commit**
  ```
  feat: add wallet service with balance, transactions, and fleet wallet support
  ```

---

## Task 2: Payment Service

- [ ] **Step 1: Implement**
  - File: `src/core/services/paymentService.ts`
  ```typescript
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
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: { walletId: input.walletId, amount: input.amount, method: input.method, type: 'topup' },
      });
      if (error) throw error;
      return data;
    },

    async setupAutoTopUp(walletId: string, threshold: number, amount: number): Promise<void> {
      // Auto top-up preferences stored on the wallet or user profile
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
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add payment service with top-up, auto-top-up, and Egyptian payment methods
  ```

---

## Task 3: Process Payment Edge Function

- [ ] **Step 1: Implement**
  - File: `supabase/functions/process-payment/index.ts`
  ```typescript
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
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const { walletId, amount, method, type } = await req.json();

      if (!walletId || !amount || amount <= 0) {
        return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
      await supabase.from('wallets').update({ balance: newBalance }).eq('id', walletId);

      // Record transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({ wallet_id: walletId, type, amount, method, reference_id: paymentRef, status: 'completed' })
        .select()
        .single();

      if (txError) throw txError;

      return new Response(
        JSON.stringify({ success: true, transactionId: transaction.id, newBalance }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add process-payment Edge Function with wallet balance update
  ```

---

## Task 4: Wallet Store

- [ ] **Step 1: Write test**
  - File: `__tests__/walletStore.test.ts`
  ```typescript
  import { useWalletStore } from '@/core/stores/walletStore';

  describe('walletStore', () => {
    beforeEach(() => useWalletStore.getState().reset());

    it('sets balance', () => {
      useWalletStore.getState().setBalance(500);
      expect(useWalletStore.getState().balance).toBe(500);
    });
    it('sets wallet id', () => {
      useWalletStore.getState().setWalletId('w1');
      expect(useWalletStore.getState().walletId).toBe('w1');
    });
  });
  ```

- [ ] **Step 2: Implement**
  - File: `src/core/stores/walletStore.ts`
  ```typescript
  import { create } from 'zustand';

  interface WalletStore {
    walletId: string | null;
    balance: number;
    currency: string;
    isLoading: boolean;
    setWalletId: (id: string) => void;
    setBalance: (balance: number) => void;
    setLoading: (loading: boolean) => void;
    reset: () => void;
  }

  export const useWalletStore = create<WalletStore>((set) => ({
    walletId: null,
    balance: 0,
    currency: 'EGP',
    isLoading: false,
    setWalletId: (walletId) => set({ walletId }),
    setBalance: (balance) => set({ balance }),
    setLoading: (isLoading) => set({ isLoading }),
    reset: () => set({ walletId: null, balance: 0, isLoading: false }),
  }));
  ```

- [ ] **Step 3: Verify passes**
  ```bash
  npx jest __tests__/walletStore.test.ts
  ```

- [ ] **Step 4: Commit**
  ```
  feat: add wallet Zustand store for balance state management
  ```

---

## Task 5: React Query Hooks

- [ ] **Step 1: Implement useWallet**
  - File: `src/core/queries/useWallet.ts`
  ```typescript
  import { useQuery } from '@tanstack/react-query';
  import { walletService } from '../services/walletService';
  import { useAuthStore } from '../stores/authStore';
  import { useWalletStore } from '../stores/walletStore';
  import { useEffect } from 'react';

  export function useWallet() {
    const userId = useAuthStore((s) => s.user?.id);
    const { setWalletId, setBalance } = useWalletStore();

    const query = useQuery({
      queryKey: ['wallet', userId],
      queryFn: () => walletService.getOrCreateWallet(userId!),
      enabled: !!userId,
    });

    useEffect(() => {
      if (query.data) {
        setWalletId(query.data.id);
        setBalance(query.data.balance);
      }
    }, [query.data]);

    return query;
  }
  ```

- [ ] **Step 2: Implement useTransactions**
  - File: `src/core/queries/useTransactions.ts`
  ```typescript
  import { useQuery } from '@tanstack/react-query';
  import { walletService } from '../services/walletService';
  import { useWalletStore } from '../stores/walletStore';

  export function useTransactions(limit = 50) {
    const walletId = useWalletStore((s) => s.walletId);

    return useQuery({
      queryKey: ['transactions', walletId, limit],
      queryFn: () => walletService.getTransactions(walletId!, limit),
      enabled: !!walletId,
    });
  }
  ```

- [ ] **Step 3: Implement useTopUp**
  - File: `src/core/queries/useTopUp.ts`
  ```typescript
  import { useMutation, useQueryClient } from '@tanstack/react-query';
  import { paymentService } from '../services/paymentService';
  import { useWalletStore } from '../stores/walletStore';
  import { useAuthStore } from '../stores/authStore';

  export function useTopUp() {
    const walletId = useWalletStore((s) => s.walletId);
    const userId = useAuthStore((s) => s.user?.id);
    const queryClient = useQueryClient();
    const setBalance = useWalletStore((s) => s.setBalance);

    return useMutation({
      mutationFn: (input: { amount: number; method: any }) =>
        paymentService.topUp({ walletId: walletId!, amount: input.amount, method: input.method }),
      onSuccess: (result) => {
        setBalance(result.newBalance);
        queryClient.invalidateQueries({ queryKey: ['wallet', userId] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
      },
    });
  }
  ```

- [ ] **Step 4: Commit**
  ```
  feat: add React Query hooks for wallet, transactions, and top-up mutation
  ```

---

## Task 6: Balance Card Component

- [ ] **Step 1: Write test**
  - File: `__tests__/BalanceCard.test.tsx`
  ```typescript
  import React from 'react';
  import { render } from '@testing-library/react-native';
  import { BalanceCard } from '@/driver/components/BalanceCard';

  describe('BalanceCard', () => {
    it('renders balance', () => {
      const { getByText } = render(<BalanceCard balance={500} currency="EGP" onTopUp={() => {}} />);
      expect(getByText('500.00 EGP')).toBeTruthy();
    });
    it('shows top up button', () => {
      const { getByText } = render(<BalanceCard balance={0} currency="EGP" onTopUp={() => {}} />);
      expect(getByText('Top Up')).toBeTruthy();
    });
  });
  ```

- [ ] **Step 2: Implement**
  - File: `src/driver/components/BalanceCard.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, StyleSheet } from 'react-native';
  import { Button } from '@/core/components';
  import { colors } from '@/core/theme/colors';
  import { spacing, borderRadius } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';
  import { formatEGP } from '@/core/utils/formatCurrency';

  interface Props { balance: number; currency: string; onTopUp: () => void; }

  export function BalanceCard({ balance, currency, onTopUp }: Props) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Wallet Balance</Text>
        <Text style={styles.balance}>{formatEGP(balance)}</Text>
        <Button title="Top Up" onPress={onTopUp} variant="secondary" size="md" style={styles.button} />
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { backgroundColor: colors.primaryDark, borderRadius: borderRadius.xl, padding: spacing.xl, alignItems: 'center' },
    label: { ...typography.caption, color: colors.primaryLight, marginBottom: spacing.xs },
    balance: { ...typography.h1, color: colors.white, fontSize: 36 },
    button: { marginTop: spacing.lg, minWidth: 140 },
  });
  ```

- [ ] **Step 3: Commit**
  ```
  feat: add BalanceCard component with wallet balance display
  ```

---

## Task 7: Payment Method Selector & Amount Selector

- [ ] **Step 1: Implement PaymentMethodSelector**
  - File: `src/driver/components/PaymentMethodSelector.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
  import { colors } from '@/core/theme/colors';
  import { spacing, borderRadius } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';
  import { paymentService } from '@/core/services/paymentService';
  import type { PaymentMethod } from '@/core/types/wallet';

  interface Props { selected: PaymentMethod | null; onSelect: (method: PaymentMethod) => void; }

  export function PaymentMethodSelector({ selected, onSelect }: Props) {
    const methods = paymentService.getPaymentMethods();
    return (
      <View>
        <Text style={styles.label}>Payment Method</Text>
        {methods.map((m) => (
          <TouchableOpacity key={m.key} style={[styles.option, selected === m.key && styles.optionSelected]} onPress={() => onSelect(m.key)}>
            <Text style={styles.icon}>{m.icon}</Text>
            <Text style={[styles.text, selected === m.key && styles.textSelected]}>{m.label}</Text>
            <View style={[styles.radio, selected === m.key && styles.radioSelected]} />
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  const styles = StyleSheet.create({
    label: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.sm },
    option: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, marginBottom: spacing.sm, backgroundColor: colors.surface },
    optionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    icon: { fontSize: 24, marginRight: spacing.md },
    text: { flex: 1, ...typography.body, color: colors.text },
    textSelected: { color: colors.primaryDark, fontWeight: '600' },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border },
    radioSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  });
  ```

- [ ] **Step 2: Implement AmountSelector**
  - File: `src/driver/components/AmountSelector.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
  import { colors } from '@/core/theme/colors';
  import { spacing, borderRadius } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';
  import { paymentService } from '@/core/services/paymentService';

  interface Props { amount: number; onAmountChange: (amount: number) => void; }

  export function AmountSelector({ amount, onAmountChange }: Props) {
    const presets = paymentService.getTopUpPresets();
    return (
      <View>
        <Text style={styles.label}>Amount (EGP)</Text>
        <TextInput
          style={styles.input}
          value={amount > 0 ? amount.toString() : ''}
          onChangeText={(text) => onAmountChange(Number(text) || 0)}
          keyboardType="numeric"
          placeholder="Enter amount"
          placeholderTextColor={colors.textTertiary}
        />
        <View style={styles.presets}>
          {presets.map((p) => (
            <TouchableOpacity key={p} style={[styles.preset, amount === p && styles.presetActive]} onPress={() => onAmountChange(p)}>
              <Text style={[styles.presetText, amount === p && styles.presetTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    label: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.sm },
    input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, ...typography.h2, color: colors.text, textAlign: 'center' },
    presets: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, gap: spacing.sm },
    preset: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
    presetActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    presetText: { ...typography.bodyBold, color: colors.textSecondary, fontSize: 14 },
    presetTextActive: { color: colors.primaryDark },
  });
  ```

- [ ] **Step 3: Commit**
  ```
  feat: add PaymentMethodSelector and AmountSelector components
  ```

---

## Task 8: Transaction Item Component

- [ ] **Step 1: Write test**
  - File: `__tests__/TransactionItem.test.tsx`
  ```typescript
  import React from 'react';
  import { render } from '@testing-library/react-native';
  import { TransactionItem } from '@/driver/components/TransactionItem';

  const mockTx = { id: 't1', type: 'topup', amount: 200, method: 'fawry', status: 'completed', created_at: '2026-03-26T10:00:00Z' } as any;

  describe('TransactionItem', () => {
    it('renders amount', () => {
      const { getByText } = render(<TransactionItem transaction={mockTx} />);
      expect(getByText('+200.00 EGP')).toBeTruthy();
    });
  });
  ```

- [ ] **Step 2: Implement**
  - File: `src/driver/components/TransactionItem.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, StyleSheet } from 'react-native';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';
  import { formatEGP } from '@/core/utils/formatCurrency';
  import type { Transaction } from '@/core/types/wallet';

  const TYPE_CONFIG: Record<string, { label: string; icon: string; isCredit: boolean }> = {
    topup: { label: 'Top Up', icon: '💰', isCredit: true },
    charge: { label: 'Charging', icon: '⚡', isCredit: false },
    subscription: { label: 'Subscription', icon: '📋', isCredit: false },
    refund: { label: 'Refund', icon: '↩️', isCredit: true },
    credit_bonus: { label: 'Credit Bonus', icon: '🎁', isCredit: true },
  };

  export function TransactionItem({ transaction }: { transaction: Transaction }) {
    const config = TYPE_CONFIG[transaction.type] || { label: transaction.type, icon: '💳', isCredit: false };
    const date = new Date(transaction.created_at);
    const amountStr = `${config.isCredit ? '+' : '-'}${formatEGP(Math.abs(transaction.amount))}`;

    return (
      <View style={styles.row}>
        <Text style={styles.icon}>{config.icon}</Text>
        <View style={styles.info}>
          <Text style={styles.label}>{config.label}</Text>
          <Text style={styles.date}>{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
        <Text style={[styles.amount, config.isCredit ? styles.credit : styles.debit]}>{amountStr}</Text>
      </View>
    );
  }

  const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    icon: { fontSize: 24, marginRight: spacing.md },
    info: { flex: 1 },
    label: { ...typography.bodyBold, color: colors.text, fontSize: 15 },
    date: { ...typography.small, color: colors.textTertiary, marginTop: 2 },
    amount: { ...typography.bodyBold },
    credit: { color: colors.success },
    debit: { color: colors.text },
  });
  ```

- [ ] **Step 3: Commit**
  ```
  feat: add TransactionItem component with type icons and credit/debit display
  ```

---

## Task 9: Wallet Screen

- [ ] **Step 1: Implement**
  - File: `src/driver/screens/WalletScreen.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, FlatList, StyleSheet } from 'react-native';
  import { Header, LoadingScreen } from '@/core/components';
  import { BalanceCard } from '../components/BalanceCard';
  import { TransactionItem } from '../components/TransactionItem';
  import { useWallet } from '@/core/queries/useWallet';
  import { useTransactions } from '@/core/queries/useTransactions';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function WalletScreen({ navigation }: any) {
    const { data: wallet, isLoading: walletLoading } = useWallet();
    const { data: transactions, isLoading: txLoading } = useTransactions(10);

    if (walletLoading) return <LoadingScreen message="Loading wallet..." />;

    return (
      <View style={styles.container}>
        <Header title="Wallet" />
        <FlatList
          data={transactions || []}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View>
              <BalanceCard balance={wallet?.balance || 0} currency={wallet?.currency || 'EGP'} onTopUp={() => navigation.navigate('TopUp')} />
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                <Text style={styles.seeAll} onPress={() => navigation.navigate('TransactionHistory')}>See All</Text>
              </View>
            </View>
          }
          renderItem={({ item }) => <TransactionItem transaction={item} />}
          ListEmptyComponent={<Text style={styles.empty}>No transactions yet</Text>}
          contentContainerStyle={styles.content}
        />
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.md },
    sectionTitle: { ...typography.bodyBold, color: colors.text },
    seeAll: { ...typography.caption, color: colors.primary },
    empty: { ...typography.body, color: colors.textTertiary, textAlign: 'center', paddingVertical: spacing.xl },
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add WalletScreen with balance card and recent transactions
  ```

---

## Task 10: Top Up Screen

- [ ] **Step 1: Implement**
  - File: `src/driver/screens/TopUpScreen.tsx`
  ```typescript
  import React, { useState } from 'react';
  import { View, ScrollView, StyleSheet, Alert } from 'react-native';
  import { Header, Button } from '@/core/components';
  import { AmountSelector } from '../components/AmountSelector';
  import { PaymentMethodSelector } from '../components/PaymentMethodSelector';
  import { useTopUp } from '@/core/queries/useTopUp';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import type { PaymentMethod } from '@/core/types/wallet';

  export function TopUpScreen({ navigation }: any) {
    const [amount, setAmount] = useState(0);
    const [method, setMethod] = useState<PaymentMethod | null>(null);
    const topUp = useTopUp();

    const handleTopUp = async () => {
      if (amount <= 0) { Alert.alert('Error', 'Please enter an amount'); return; }
      if (!method) { Alert.alert('Error', 'Please select a payment method'); return; }
      try {
        await topUp.mutateAsync({ amount, method });
        Alert.alert('Success', `${amount} EGP added to your wallet!`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } catch (e: any) { Alert.alert('Payment Failed', e.message); }
    };

    return (
      <View style={styles.container}>
        <Header title="Top Up Wallet" onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.content}>
          <AmountSelector amount={amount} onAmountChange={setAmount} />
          <View style={styles.spacer} />
          <PaymentMethodSelector selected={method} onSelect={setMethod} />
        </ScrollView>
        <View style={styles.footer}>
          <Button title={`Pay ${amount > 0 ? amount + ' EGP' : ''}`} onPress={handleTopUp} loading={topUp.isPending} size="lg" disabled={amount <= 0 || !method} />
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: 100 },
    spacer: { height: spacing.xl },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add TopUpScreen with amount selection and Egyptian payment methods
  ```

---

## Task 11: Transaction History Screen

- [ ] **Step 1: Implement**
  - File: `src/driver/screens/TransactionHistoryScreen.tsx`
  ```typescript
  import React from 'react';
  import { View, FlatList, Text, StyleSheet } from 'react-native';
  import { Header, LoadingScreen } from '@/core/components';
  import { TransactionItem } from '../components/TransactionItem';
  import { useTransactions } from '@/core/queries/useTransactions';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function TransactionHistoryScreen({ navigation }: any) {
    const { data: transactions, isLoading } = useTransactions(200);

    if (isLoading) return <LoadingScreen />;

    return (
      <View style={styles.container}>
        <Header title="Transaction History" onBack={() => navigation.goBack()} />
        <FlatList
          data={transactions || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TransactionItem transaction={item} />}
          ListEmptyComponent={<Text style={styles.empty}>No transactions yet</Text>}
          contentContainerStyle={styles.content}
        />
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md },
    empty: { ...typography.body, color: colors.textTertiary, textAlign: 'center', padding: spacing.xl },
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add TransactionHistoryScreen with full transaction list
  ```

---

## Task 12: Receipt Service & Modal

- [ ] **Step 1: Implement receipt service**
  - File: `src/core/services/receiptService.ts`
  ```typescript
  import * as Print from 'expo-print';
  import * as Sharing from 'expo-sharing';
  import { formatEGP } from '../utils/formatCurrency';

  interface ReceiptData {
    bookingId: string;
    stationName: string;
    providerName: string;
    connectorType: string;
    date: string;
    kwhDelivered: number;
    providerCost: number;
    serviceFee: number;
    total: number;
    paymentMethod: string;
  }

  export const receiptService = {
    generateHTML(data: ReceiptData): string {
      return `
        <!DOCTYPE html><html><head><meta charset="utf-8"><style>
          body { font-family: Arial; padding: 40px; max-width: 400px; margin: auto; }
          h1 { color: #10B981; font-size: 20px; text-align: center; }
          .logo { text-align: center; font-size: 24px; margin-bottom: 20px; }
          .divider { border-top: 1px solid #E5E7EB; margin: 16px 0; }
          .row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
          .total { font-weight: bold; font-size: 18px; color: #064E3B; }
          .footer { text-align: center; color: #9CA3AF; font-size: 12px; margin-top: 24px; }
        </style></head><body>
          <div class="logo">⚡</div>
          <h1>EV Charge Egypt</h1>
          <p style="text-align:center;color:#6B7280;">Charging Receipt</p>
          <div class="divider"></div>
          <div class="row"><span>Station</span><span>${data.stationName}</span></div>
          <div class="row"><span>Provider</span><span>${data.providerName}</span></div>
          <div class="row"><span>Connector</span><span>${data.connectorType}</span></div>
          <div class="row"><span>Date</span><span>${data.date}</span></div>
          <div class="row"><span>Energy</span><span>${data.kwhDelivered.toFixed(1)} kWh</span></div>
          <div class="divider"></div>
          <div class="row"><span>Charging Cost</span><span>${formatEGP(data.providerCost)}</span></div>
          <div class="row"><span>Service Fee</span><span>${formatEGP(data.serviceFee)}</span></div>
          <div class="divider"></div>
          <div class="row total"><span>Total</span><span>${formatEGP(data.total)}</span></div>
          <div class="row"><span>Payment</span><span>${data.paymentMethod}</span></div>
          <div class="footer">Ref: ${data.bookingId}<br/>Thank you for charging with us!</div>
        </body></html>
      `;
    },

    async generateAndShare(data: ReceiptData): Promise<void> {
      const html = this.generateHTML(data);
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Receipt' });
    },
  };
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add receipt service with PDF generation and sharing
  ```

---

**Total: 12 tasks, ~32 steps**
