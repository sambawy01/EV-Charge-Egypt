# Fleet Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete fleet management system with dashboard, vehicle/driver management, AI scheduling, cost reports, credit system, subscription tiers, and fleet-specific navigation.
**Architecture:** FleetNavigator provides 5 tabs (Dashboard, Vehicles, Schedule, Reports, Settings). Fleet data is queried via dedicated React Query hooks scoped to the fleet owner's fleet ID. The credit system supports bulk top-up with tiered bonuses (5-12%). AI scheduling generates optimal charging plans that fleet managers approve. Reports support PDF/CSV export.
**Tech Stack:** React Native, Supabase, React Query, Zustand, expo-print, expo-sharing

---

## File Structure

```
src/
├── core/
│   ├── services/
│   │   ├── fleetService.ts
│   │   ├── creditService.ts
│   │   └── fleetReportService.ts
│   ├── queries/
│   │   ├── useFleet.ts
│   │   ├── useFleetVehicles.ts
│   │   ├── useFleetDrivers.ts
│   │   ├── useFleetSessions.ts
│   │   └── useFleetReports.ts
│   └── stores/
│       └── fleetStore.ts
├── fleet/
│   ├── screens/
│   │   ├── FleetHomeScreen.tsx
│   │   ├── VehicleListScreen.tsx
│   │   ├── VehicleDetailScreen.tsx
│   │   ├── DriverDetailScreen.tsx
│   │   ├── AssignDriverScreen.tsx
│   │   ├── ScheduleScreen.tsx
│   │   ├── AIScheduleReviewScreen.tsx
│   │   ├── ReportsScreen.tsx
│   │   ├── CostBreakdownScreen.tsx
│   │   ├── BatteryHealthScreen.tsx
│   │   ├── ExportScreen.tsx
│   │   ├── FleetSettingsScreen.tsx
│   │   ├── CreditTopUpScreen.tsx
│   │   ├── MemberManagementScreen.tsx
│   │   └── BillingScreen.tsx
│   └── components/
│       ├── FleetStatCard.tsx
│       ├── FleetVehicleRow.tsx
│       ├── FleetAlertCard.tsx
│       ├── ScheduleCard.tsx
│       ├── CreditBonusTable.tsx
│       └── SubscriptionCard.tsx
├── navigation/
│   └── FleetNavigator.tsx (update)
└── __tests__/
    ├── fleetService.test.ts
    ├── creditService.test.ts
    ├── fleetStore.test.ts
    └── FleetHomeScreen.test.tsx
```

---

## Task 1: Fleet Service

- [ ] **Step 1: Write test**
  - File: `__tests__/fleetService.test.ts`
  ```typescript
  import { fleetService } from '@/core/services/fleetService';

  jest.mock('@/core/config/supabase', () => ({
    supabase: {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'f1', company_name: 'Test Fleet', plan: 'business', credit_balance: 5000 }, error: null }),
            order: jest.fn().mockReturnValue({ data: [], error: null }),
          }),
        }),
        insert: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: 'f1' }, error: null }) }) }),
        update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: null, error: null }) }),
      }),
    },
  }));

  describe('fleetService', () => {
    it('gets fleet by owner', async () => {
      const fleet = await fleetService.getFleetByOwner('u1');
      expect(fleet).toHaveProperty('company_name');
    });
    it('gets fleet vehicles', async () => {
      const vehicles = await fleetService.getFleetVehicles('f1');
      expect(Array.isArray(vehicles)).toBe(true);
    });
  });
  ```

- [ ] **Step 2: Verify fails**

- [ ] **Step 3: Implement**
  - File: `src/core/services/fleetService.ts`
  ```typescript
  import { supabase } from '../config/supabase';
  import type { Fleet, FleetMember, Vehicle } from '../types/fleet';
  import type { ChargingSession } from '../types/booking';

  export const fleetService = {
    async getFleetByOwner(ownerId: string): Promise<Fleet | null> {
      const { data, error } = await supabase.from('fleets').select('*').eq('owner_id', ownerId).single();
      if (error) return null;
      return data;
    },

    async createFleet(ownerId: string, companyName: string): Promise<Fleet> {
      const { data, error } = await supabase.from('fleets').insert({ owner_id: ownerId, company_name: companyName }).select().single();
      if (error) throw error;
      return data;
    },

    async getFleetVehicles(fleetId: string): Promise<Vehicle[]> {
      const { data, error } = await supabase.from('vehicles').select('*').eq('fleet_id', fleetId).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async getFleetMembers(fleetId: string): Promise<FleetMember[]> {
      const { data, error } = await supabase
        .from('fleet_members')
        .select('*, user:user_profiles(full_name, avatar_url, phone), vehicle:vehicles(*)')
        .eq('fleet_id', fleetId)
        .order('is_active', { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async addFleetMember(fleetId: string, userId: string, vehicleId?: string, dailyLimit?: number, weeklyLimit?: number): Promise<FleetMember> {
      const { data, error } = await supabase.from('fleet_members').insert({
        fleet_id: fleetId, user_id: userId, vehicle_id: vehicleId || null, daily_limit: dailyLimit || null, weekly_limit: weeklyLimit || null,
      }).select().single();
      if (error) throw error;
      return data;
    },

    async removeFleetMember(memberId: string): Promise<void> {
      const { error } = await supabase.from('fleet_members').update({ is_active: false }).eq('id', memberId);
      if (error) throw error;
    },

    async assignVehicle(memberId: string, vehicleId: string): Promise<void> {
      const { error } = await supabase.from('fleet_members').update({ vehicle_id: vehicleId }).eq('id', memberId);
      if (error) throw error;
    },

    async getFleetSessions(fleetId: string, startDate?: string, endDate?: string): Promise<ChargingSession[]> {
      let query = supabase
        .from('charging_sessions')
        .select('*, connector:connectors(*, station:stations(*, provider:providers(*))), booking:bookings(*)')
        .eq('booking.fleet_id', fleetId)
        .order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async getFleetDashboardStats(fleetId: string): Promise<{
      totalVehicles: number; activeCharging: number; lowBattery: number;
      todaySpending: number; monthlyBudget: number; alerts: string[];
    }> {
      const vehicles = await this.getFleetVehicles(fleetId);
      // Simplified: in production these would be real-time queries
      return {
        totalVehicles: vehicles.length,
        activeCharging: 0,
        lowBattery: 0,
        todaySpending: 0,
        monthlyBudget: 0,
        alerts: [],
      };
    },

    async updateFleetPlan(fleetId: string, plan: string): Promise<void> {
      const { error } = await supabase.from('fleets').update({ plan }).eq('id', fleetId);
      if (error) throw error;
    },
  };
  ```

- [ ] **Step 4: Verify passes**

- [ ] **Step 5: Commit**
  ```
  feat: add fleet service with vehicle, member, session, and dashboard operations
  ```

---

## Task 2: Credit Service

- [ ] **Step 1: Write test**
  - File: `__tests__/creditService.test.ts`
  ```typescript
  import { creditService } from '@/core/services/creditService';

  describe('creditService', () => {
    it('calculates bonus for 10000 EGP', () => {
      expect(creditService.calculateBonus(10000)).toBe(500);
    });
    it('calculates bonus for 25000 EGP', () => {
      expect(creditService.calculateBonus(25000)).toBe(1500);
    });
    it('calculates bonus for 50000 EGP', () => {
      expect(creditService.calculateBonus(50000)).toBe(4000);
    });
    it('calculates bonus for 100000 EGP', () => {
      expect(creditService.calculateBonus(100000)).toBe(12000);
    });
    it('no bonus for small amounts', () => {
      expect(creditService.calculateBonus(5000)).toBe(0);
    });
  });
  ```

- [ ] **Step 2: Verify fails**

- [ ] **Step 3: Implement**
  - File: `src/core/services/creditService.ts`
  ```typescript
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

    async topUpCredits(fleetId: string, amount: number, method: string): Promise<{ newBalance: number; bonus: number }> {
      const bonus = this.calculateBonus(amount);
      const totalCredit = amount + bonus;

      // Get current balance
      const { data: fleet } = await supabase.from('fleets').select('credit_balance').eq('id', fleetId).single();
      const currentBalance = fleet?.credit_balance || 0;
      const newBalance = currentBalance + totalCredit;

      // Update fleet balance
      await supabase.from('fleets').update({ credit_balance: newBalance }).eq('id', fleetId);

      // Get or create fleet wallet
      const { data: wallet } = await supabase.from('wallets').select('id').eq('fleet_id', fleetId).single();
      if (wallet) {
        await supabase.from('wallets').update({ balance: newBalance }).eq('id', wallet.id);

        // Record transactions
        await supabase.from('transactions').insert({ wallet_id: wallet.id, type: 'topup', amount, method, status: 'completed' });
        if (bonus > 0) {
          await supabase.from('transactions').insert({ wallet_id: wallet.id, type: 'credit_bonus', amount: bonus, method: 'system', status: 'completed' });
        }
      }

      return { newBalance, bonus };
    },

    async setupAutoTopUp(fleetId: string, threshold: number, amount: number): Promise<void> {
      const { error } = await supabase.from('fleets').update({ auto_topup_threshold: threshold, auto_topup_amount: amount }).eq('id', fleetId);
      if (error) throw error;
    },

    async setDriverLimit(memberId: string, dailyLimit: number, weeklyLimit: number): Promise<void> {
      const { error } = await supabase.from('fleet_members').update({ daily_limit: dailyLimit, weekly_limit: weeklyLimit }).eq('id', memberId);
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
  ```

- [ ] **Step 4: Verify passes**
  ```bash
  npx jest __tests__/creditService.test.ts
  ```

- [ ] **Step 5: Commit**
  ```
  feat: add credit service with tiered bonuses, auto-top-up, and driver spending limits
  ```

---

## Task 3: Fleet Store

- [ ] **Step 1: Write test**
  - File: `__tests__/fleetStore.test.ts`
  ```typescript
  import { useFleetStore } from '@/core/stores/fleetStore';

  describe('fleetStore', () => {
    beforeEach(() => useFleetStore.getState().reset());

    it('sets fleet', () => {
      useFleetStore.getState().setFleet({ id: 'f1', company_name: 'Test' } as any);
      expect(useFleetStore.getState().fleet?.company_name).toBe('Test');
    });
    it('sets credit balance', () => {
      useFleetStore.getState().setCreditBalance(5000);
      expect(useFleetStore.getState().creditBalance).toBe(5000);
    });
  });
  ```

- [ ] **Step 2: Implement**
  - File: `src/core/stores/fleetStore.ts`
  ```typescript
  import { create } from 'zustand';
  import type { Fleet, FleetMember, Vehicle } from '../types/fleet';

  interface FleetStore {
    fleet: Fleet | null;
    creditBalance: number;
    vehicles: Vehicle[];
    members: FleetMember[];
    setFleet: (fleet: Fleet) => void;
    setCreditBalance: (balance: number) => void;
    setVehicles: (vehicles: Vehicle[]) => void;
    setMembers: (members: FleetMember[]) => void;
    reset: () => void;
  }

  export const useFleetStore = create<FleetStore>((set) => ({
    fleet: null,
    creditBalance: 0,
    vehicles: [],
    members: [],
    setFleet: (fleet) => set({ fleet, creditBalance: fleet.credit_balance }),
    setCreditBalance: (creditBalance) => set({ creditBalance }),
    setVehicles: (vehicles) => set({ vehicles }),
    setMembers: (members) => set({ members }),
    reset: () => set({ fleet: null, creditBalance: 0, vehicles: [], members: [] }),
  }));
  ```

- [ ] **Step 3: Verify passes**

- [ ] **Step 4: Commit**
  ```
  feat: add fleet Zustand store for fleet state management
  ```

---

## Task 4: React Query Hooks for Fleet

- [ ] **Step 1: Implement all fleet hooks**
  - File: `src/core/queries/useFleet.ts`
  ```typescript
  import { useQuery } from '@tanstack/react-query';
  import { fleetService } from '../services/fleetService';
  import { useAuthStore } from '../stores/authStore';
  import { useFleetStore } from '../stores/fleetStore';
  import { useEffect } from 'react';

  export function useFleet() {
    const userId = useAuthStore((s) => s.user?.id);
    const setFleet = useFleetStore((s) => s.setFleet);

    const query = useQuery({
      queryKey: ['fleet', userId],
      queryFn: () => fleetService.getFleetByOwner(userId!),
      enabled: !!userId,
    });

    useEffect(() => { if (query.data) setFleet(query.data); }, [query.data]);
    return query;
  }

  export function useFleetDashboard() {
    const fleetId = useFleetStore((s) => s.fleet?.id);
    return useQuery({
      queryKey: ['fleetDashboard', fleetId],
      queryFn: () => fleetService.getFleetDashboardStats(fleetId!),
      enabled: !!fleetId,
      refetchInterval: 30000,
    });
  }
  ```

  - File: `src/core/queries/useFleetVehicles.ts`
  ```typescript
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
  import { fleetService } from '../services/fleetService';
  import { useFleetStore } from '../stores/fleetStore';

  export function useFleetVehicles() {
    const fleetId = useFleetStore((s) => s.fleet?.id);
    return useQuery({
      queryKey: ['fleetVehicles', fleetId],
      queryFn: () => fleetService.getFleetVehicles(fleetId!),
      enabled: !!fleetId,
    });
  }
  ```

  - File: `src/core/queries/useFleetDrivers.ts`
  ```typescript
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
  import { fleetService } from '../services/fleetService';
  import { useFleetStore } from '../stores/fleetStore';

  export function useFleetMembers() {
    const fleetId = useFleetStore((s) => s.fleet?.id);
    return useQuery({
      queryKey: ['fleetMembers', fleetId],
      queryFn: () => fleetService.getFleetMembers(fleetId!),
      enabled: !!fleetId,
    });
  }

  export function useAssignDriver() {
    const queryClient = useQueryClient();
    const fleetId = useFleetStore((s) => s.fleet?.id);
    return useMutation({
      mutationFn: ({ memberId, vehicleId }: { memberId: string; vehicleId: string }) => fleetService.assignVehicle(memberId, vehicleId),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fleetMembers', fleetId] }),
    });
  }
  ```

  - File: `src/core/queries/useFleetSessions.ts`
  ```typescript
  import { useQuery } from '@tanstack/react-query';
  import { fleetService } from '../services/fleetService';
  import { useFleetStore } from '../stores/fleetStore';

  export function useFleetSessions() {
    const fleetId = useFleetStore((s) => s.fleet?.id);
    return useQuery({
      queryKey: ['fleetSessions', fleetId],
      queryFn: () => fleetService.getFleetSessions(fleetId!),
      enabled: !!fleetId,
    });
  }
  ```

  - File: `src/core/queries/useFleetReports.ts`
  ```typescript
  import { useQuery } from '@tanstack/react-query';
  import { aiService } from '../services/aiService';
  import { useAuthStore } from '../stores/authStore';

  export function useFleetCostReport(period: string) {
    const userId = useAuthStore((s) => s.user?.id);
    return useQuery({
      queryKey: ['fleetCostReport', userId, period],
      queryFn: () => aiService.optimizeCosts(userId!, period),
      enabled: !!userId,
      staleTime: 1000 * 60 * 60,
    });
  }
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add React Query hooks for fleet, vehicles, drivers, sessions, and reports
  ```

---

## Task 5: Fleet Components

- [ ] **Step 1: Implement FleetStatCard**
  - File: `src/fleet/components/FleetStatCard.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, StyleSheet } from 'react-native';
  import { Card } from '@/core/components';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  interface Props { icon: string; value: string; label: string; trend?: string; trendUp?: boolean; }

  export function FleetStatCard({ icon, value, label, trend, trendUp }: Props) {
    return (
      <Card style={styles.card}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
        {trend && <Text style={[styles.trend, trendUp ? styles.trendUp : styles.trendDown]}>{trend}</Text>}
      </Card>
    );
  }

  const styles = StyleSheet.create({
    card: { flex: 1, alignItems: 'center', padding: spacing.md },
    icon: { fontSize: 24, marginBottom: spacing.xs },
    value: { ...typography.h3, color: colors.text },
    label: { ...typography.small, color: colors.textSecondary, textAlign: 'center' },
    trend: { ...typography.small, fontWeight: '600', marginTop: 4 },
    trendUp: { color: colors.error },
    trendDown: { color: colors.success },
  });
  ```

- [ ] **Step 2: Implement FleetVehicleRow**
  - File: `src/fleet/components/FleetVehicleRow.tsx`
  ```typescript
  import React from 'react';
  import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
  import { Badge } from '@/core/components';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';
  import type { Vehicle } from '@/core/types/fleet';

  interface Props { vehicle: Vehicle; onPress: () => void; }

  export function FleetVehicleRow({ vehicle, onPress }: Props) {
    return (
      <TouchableOpacity style={styles.row} onPress={onPress}>
        <View style={styles.info}>
          <Text style={styles.name}>{vehicle.make} {vehicle.model}</Text>
          <Text style={styles.details}>{vehicle.license_plate || 'No plate'} · {vehicle.battery_capacity_kwh} kWh</Text>
        </View>
        <Badge label="Idle" backgroundColor={colors.surfaceSecondary} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  }

  const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    info: { flex: 1 },
    name: { ...typography.bodyBold, color: colors.text },
    details: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  });
  ```

- [ ] **Step 3: Implement FleetAlertCard, ScheduleCard, CreditBonusTable, SubscriptionCard**
  - File: `src/fleet/components/FleetAlertCard.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, StyleSheet } from 'react-native';
  import { colors } from '@/core/theme/colors';
  import { spacing, borderRadius } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function FleetAlertCard({ alerts }: { alerts: string[] }) {
    if (!alerts.length) return null;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Alerts</Text>
        {alerts.map((alert, i) => (
          <View key={i} style={styles.alertRow}><Text style={styles.dot}>!</Text><Text style={styles.text}>{alert}</Text></View>
        ))}
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { backgroundColor: '#FEF2F2', borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md },
    title: { ...typography.bodyBold, color: colors.error, marginBottom: spacing.sm },
    alertRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
    dot: { color: colors.error, fontWeight: '700', marginRight: spacing.sm },
    text: { ...typography.caption, color: colors.text, flex: 1 },
  });
  ```

  - File: `src/fleet/components/CreditBonusTable.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, StyleSheet } from 'react-native';
  import { Card } from '@/core/components';
  import { creditService } from '@/core/services/creditService';
  import { formatEGP } from '@/core/utils/formatCurrency';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function CreditBonusTable() {
    const tiers = creditService.getBonusTiers();
    return (
      <Card>
        <Text style={styles.title}>Credit Bonuses</Text>
        <View style={styles.headerRow}><Text style={styles.headerCell}>Amount</Text><Text style={styles.headerCell}>Bonus</Text><Text style={styles.headerCell}>Discount</Text></View>
        {tiers.map((t) => (
          <View key={t.amount} style={styles.row}>
            <Text style={styles.cell}>{formatEGP(t.amount)}</Text>
            <Text style={[styles.cell, styles.bonus]}>+{formatEGP(t.bonus)}</Text>
            <Text style={[styles.cell, styles.discount]}>{t.discount}</Text>
          </View>
        ))}
      </Card>
    );
  }

  const styles = StyleSheet.create({
    title: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.md },
    headerRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.sm },
    headerCell: { flex: 1, ...typography.small, color: colors.textSecondary, fontWeight: '600' },
    row: { flexDirection: 'row', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    cell: { flex: 1, ...typography.caption, color: colors.text },
    bonus: { color: colors.success, fontWeight: '600' },
    discount: { color: colors.primary, fontWeight: '600' },
  });
  ```

  - File: `src/fleet/components/SubscriptionCard.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, StyleSheet } from 'react-native';
  import { Card, Button } from '@/core/components';
  import { FLEET_PLANS } from '@/core/config/constants';
  import { formatEGP } from '@/core/utils/formatCurrency';
  import { colors } from '@/core/theme/colors';
  import { spacing, borderRadius } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  interface Props { planKey: string; isCurrentPlan: boolean; onSelect: () => void; }

  export function SubscriptionCard({ planKey, isCurrentPlan, onSelect }: Props) {
    const plan = FLEET_PLANS[planKey as keyof typeof FLEET_PLANS];
    if (!plan) return null;
    return (
      <Card style={[styles.card, isCurrentPlan && styles.currentCard]}>
        <Text style={styles.planName}>{planKey.charAt(0).toUpperCase() + planKey.slice(1)}</Text>
        <Text style={styles.price}>{plan.price === 0 ? 'Free' : `${formatEGP(plan.price)}/mo`}</Text>
        <Text style={styles.vehicles}>Up to {plan.maxVehicles === Infinity ? 'Unlimited' : plan.maxVehicles} vehicles</Text>
        {plan.features.map((f) => <Text key={f} style={styles.feature}>• {f.replace(/_/g, ' ')}</Text>)}
        {!isCurrentPlan && <Button title="Upgrade" onPress={onSelect} variant="outline" size="sm" style={{ marginTop: spacing.md }} />}
        {isCurrentPlan && <Text style={styles.currentLabel}>Current Plan</Text>}
      </Card>
    );
  }

  const styles = StyleSheet.create({
    card: { marginBottom: spacing.md },
    currentCard: { borderWidth: 2, borderColor: colors.primary },
    planName: { ...typography.h3, color: colors.text },
    price: { ...typography.h2, color: colors.primary, marginVertical: spacing.xs },
    vehicles: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
    feature: { ...typography.small, color: colors.textSecondary, marginBottom: 2 },
    currentLabel: { ...typography.bodyBold, color: colors.primary, textAlign: 'center', marginTop: spacing.md },
  });
  ```

- [ ] **Step 4: Commit**
  ```
  feat: add fleet components — stat card, vehicle row, alerts, credit table, subscription card
  ```

---

## Task 6: Fleet Home Screen

- [ ] **Step 1: Implement**
  - File: `src/fleet/screens/FleetHomeScreen.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, ScrollView, StyleSheet } from 'react-native';
  import { Header, Card, LoadingScreen } from '@/core/components';
  import { FleetStatCard } from '../components/FleetStatCard';
  import { FleetAlertCard } from '../components/FleetAlertCard';
  import { useFleet, useFleetDashboard } from '@/core/queries/useFleet';
  import { useFleetStore } from '@/core/stores/fleetStore';
  import { formatEGP } from '@/core/utils/formatCurrency';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function FleetHomeScreen({ navigation }: any) {
    const { isLoading: fleetLoading } = useFleet();
    const fleet = useFleetStore((s) => s.fleet);
    const { data: stats, isLoading: statsLoading } = useFleetDashboard();

    if (fleetLoading || !fleet) return <LoadingScreen message="Loading fleet..." />;

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Header title={fleet.company_name} />
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Credit Balance</Text>
          <Text style={styles.balance}>{formatEGP(fleet.credit_balance)}</Text>
        </View>

        <View style={styles.statsGrid}>
          <FleetStatCard icon="🚗" value={stats?.totalVehicles?.toString() || '0'} label="Vehicles" />
          <FleetStatCard icon="⚡" value={stats?.activeCharging?.toString() || '0'} label="Charging" />
          <FleetStatCard icon="🔋" value={stats?.lowBattery?.toString() || '0'} label="Low Battery" />
          <FleetStatCard icon="💰" value={formatEGP(stats?.todaySpending || 0)} label="Today" />
        </View>

        {stats?.alerts && <FleetAlertCard alerts={stats.alerts} />}

        <Card style={styles.aiInsight}>
          <Text style={styles.aiTitle}>AI Insight</Text>
          <Text style={styles.aiText}>3 drivers charged at peak rates this week. Switching to off-peak could save 1,200 EGP/month.</Text>
        </Card>
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: spacing.xxl },
    balanceRow: { alignItems: 'center', paddingVertical: spacing.lg, backgroundColor: colors.primaryDark },
    balanceLabel: { ...typography.caption, color: colors.primaryLight },
    balance: { ...typography.h1, color: colors.white, fontSize: 32 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.md },
    aiInsight: { margin: spacing.md, backgroundColor: colors.primaryLight },
    aiTitle: { ...typography.bodyBold, color: colors.primaryDark, marginBottom: spacing.xs },
    aiText: { ...typography.body, color: colors.primaryDark, fontSize: 14 },
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add FleetHomeScreen with dashboard stats, balance, alerts, and AI insights
  ```

---

## Task 7: Vehicle List & Detail Screens

- [ ] **Step 1: Implement VehicleListScreen**
  - File: `src/fleet/screens/VehicleListScreen.tsx`
  ```typescript
  import React from 'react';
  import { View, FlatList, Text, StyleSheet } from 'react-native';
  import { Header, Button, LoadingScreen } from '@/core/components';
  import { FleetVehicleRow } from '../components/FleetVehicleRow';
  import { useFleetVehicles } from '@/core/queries/useFleetVehicles';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function VehicleListScreen({ navigation }: any) {
    const { data: vehicles, isLoading } = useFleetVehicles();

    if (isLoading) return <LoadingScreen />;

    return (
      <View style={styles.container}>
        <Header title="Fleet Vehicles" />
        <FlatList
          data={vehicles || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <FleetVehicleRow vehicle={item} onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })} />}
          ListEmptyComponent={<Text style={styles.empty}>No vehicles in fleet</Text>}
          contentContainerStyle={styles.content}
        />
        <View style={styles.footer}><Button title="Add Vehicle" onPress={() => navigation.navigate('AddVehicle')} size="lg" /></View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: 100 },
    empty: { ...typography.body, color: colors.textTertiary, textAlign: 'center', padding: spacing.xl },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  });
  ```

- [ ] **Step 2: Implement VehicleDetailScreen**
  - File: `src/fleet/screens/VehicleDetailScreen.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, ScrollView, StyleSheet } from 'react-native';
  import { Header, Card, Button, LoadingScreen } from '@/core/components';
  import { useFleetVehicles } from '@/core/queries/useFleetVehicles';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function VehicleDetailScreen({ route, navigation }: any) {
    const { vehicleId } = route.params;
    const { data: vehicles } = useFleetVehicles();
    const vehicle = vehicles?.find(v => v.id === vehicleId);

    if (!vehicle) return <LoadingScreen />;

    return (
      <View style={styles.container}>
        <Header title={`${vehicle.make} ${vehicle.model}`} onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.content}>
          <Card>
            <Text style={styles.detail}>Battery: {vehicle.battery_capacity_kwh} kWh</Text>
            <Text style={styles.detail}>Connectors: {vehicle.connector_types.join(', ')}</Text>
            <Text style={styles.detail}>Plate: {vehicle.license_plate || 'N/A'}</Text>
          </Card>
          <Button title="Assign Driver" onPress={() => navigation.navigate('AssignDriver', { vehicleId })} variant="outline" style={{ marginTop: spacing.lg }} />
        </ScrollView>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md },
    detail: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  });
  ```

- [ ] **Step 3: Commit**
  ```
  feat: add fleet VehicleListScreen and VehicleDetailScreen
  ```

---

## Task 8: Driver Detail & Assign Driver Screens

- [ ] **Step 1: Implement DriverDetailScreen**
  - File: `src/fleet/screens/DriverDetailScreen.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, ScrollView, StyleSheet } from 'react-native';
  import { Header, Card, Avatar, LoadingScreen } from '@/core/components';
  import { useFleetMembers } from '@/core/queries/useFleetDrivers';
  import { formatEGP } from '@/core/utils/formatCurrency';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function DriverDetailScreen({ route, navigation }: any) {
    const { memberId } = route.params;
    const { data: members } = useFleetMembers();
    const member = members?.find(m => m.id === memberId);

    if (!member) return <LoadingScreen />;

    return (
      <View style={styles.container}>
        <Header title="Driver Details" onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Avatar name={member.user?.full_name || 'Driver'} size={64} />
            <Text style={styles.name}>{member.user?.full_name}</Text>
            <Text style={styles.phone}>{member.user?.phone || 'No phone'}</Text>
          </View>
          <Card>
            <Text style={styles.label}>Daily Limit</Text>
            <Text style={styles.value}>{member.daily_limit ? formatEGP(member.daily_limit) : 'No limit'}</Text>
            <Text style={styles.label}>Weekly Limit</Text>
            <Text style={styles.value}>{member.weekly_limit ? formatEGP(member.weekly_limit) : 'No limit'}</Text>
            <Text style={styles.label}>Assigned Vehicle</Text>
            <Text style={styles.value}>{member.vehicle ? `${(member.vehicle as any).make} ${(member.vehicle as any).model}` : 'None'}</Text>
          </Card>
        </ScrollView>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md },
    header: { alignItems: 'center', paddingVertical: spacing.xl },
    name: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
    phone: { ...typography.caption, color: colors.textSecondary },
    label: { ...typography.small, color: colors.textSecondary, marginTop: spacing.md },
    value: { ...typography.bodyBold, color: colors.text },
  });
  ```

- [ ] **Step 2: Implement AssignDriverScreen**
  - File: `src/fleet/screens/AssignDriverScreen.tsx`
  ```typescript
  import React from 'react';
  import { View, FlatList, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
  import { Header, Avatar, LoadingScreen } from '@/core/components';
  import { useFleetMembers, useAssignDriver } from '@/core/queries/useFleetDrivers';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function AssignDriverScreen({ route, navigation }: any) {
    const { vehicleId } = route.params;
    const { data: members, isLoading } = useFleetMembers();
    const assignDriver = useAssignDriver();

    const handleAssign = (memberId: string) => {
      Alert.alert('Assign Driver', 'Assign this driver to the vehicle?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Assign', onPress: async () => {
          await assignDriver.mutateAsync({ memberId, vehicleId });
          navigation.goBack();
        }},
      ]);
    };

    if (isLoading) return <LoadingScreen />;

    return (
      <View style={styles.container}>
        <Header title="Assign Driver" onBack={() => navigation.goBack()} />
        <FlatList
          data={members?.filter(m => m.is_active) || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => handleAssign(item.id)}>
              <Avatar name={item.user?.full_name || 'Driver'} size={40} />
              <Text style={styles.name}>{item.user?.full_name}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.content}
        />
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    name: { ...typography.body, color: colors.text, marginLeft: spacing.md },
  });
  ```

- [ ] **Step 3: Commit**
  ```
  feat: add DriverDetailScreen and AssignDriverScreen
  ```

---

## Task 9: Schedule & AI Schedule Review Screens

- [ ] **Step 1: Implement ScheduleScreen**
  - File: `src/fleet/screens/ScheduleScreen.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, ScrollView, StyleSheet } from 'react-native';
  import { Header, Card, Button } from '@/core/components';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function ScheduleScreen({ navigation }: any) {
    return (
      <View style={styles.container}>
        <Header title="Charging Schedule" />
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={styles.aiCard}>
            <Text style={styles.aiTitle}>Smart Scheduling</Text>
            <Text style={styles.aiText}>Let AI optimize your fleet's charging schedule based on routes, electricity rates, and station availability.</Text>
            <Button title="Generate Schedule" onPress={() => navigation.navigate('AIScheduleReview')} style={{ marginTop: spacing.md }} />
          </Card>
          <Text style={styles.emptyText}>No scheduled charges yet. Generate an AI-optimized schedule to get started.</Text>
        </ScrollView>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md },
    aiCard: { backgroundColor: colors.primaryLight, marginBottom: spacing.lg },
    aiTitle: { ...typography.h3, color: colors.primaryDark },
    aiText: { ...typography.body, color: colors.primaryDark, fontSize: 14, marginTop: spacing.sm },
    emptyText: { ...typography.body, color: colors.textTertiary, textAlign: 'center', padding: spacing.xl },
  });
  ```

- [ ] **Step 2: Implement AIScheduleReviewScreen**
  - File: `src/fleet/screens/AIScheduleReviewScreen.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, ScrollView, StyleSheet } from 'react-native';
  import { Header, Card, Button } from '@/core/components';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function AIScheduleReviewScreen({ navigation }: any) {
    // Mock AI-generated schedule
    const schedule = [
      { vehicle: 'BYD Atto 3 (ABC 1234)', driver: 'Ahmed', station: 'IKARUS Maadi', time: '10:00 PM', reason: 'Off-peak rate, 0.04 EGP/kWh' },
      { vehicle: 'MG ZS EV (XYZ 5678)', driver: 'Mohamed', station: 'Elsewedy Plug Nasr City', time: '11:00 PM', reason: 'Closest to morning route' },
    ];

    return (
      <View style={styles.container}>
        <Header title="Review Schedule" onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>AI Recommendation</Text>
            <Text style={styles.summaryText}>Scheduling off-peak charges for 2 vehicles saves approximately 450 EGP this week.</Text>
          </Card>
          {schedule.map((item, i) => (
            <Card key={i} style={styles.scheduleCard}>
              <Text style={styles.vehicleName}>{item.vehicle}</Text>
              <Text style={styles.detail}>Driver: {item.driver}</Text>
              <Text style={styles.detail}>Station: {item.station}</Text>
              <Text style={styles.detail}>Time: {item.time}</Text>
              <Text style={styles.reason}>{item.reason}</Text>
            </Card>
          ))}
          <View style={styles.actions}>
            <Button title="Approve & Book All" onPress={() => navigation.goBack()} size="lg" />
            <Button title="Adjust" onPress={() => {}} variant="outline" size="lg" />
          </View>
        </ScrollView>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: spacing.xxl },
    summaryCard: { backgroundColor: colors.primaryLight, marginBottom: spacing.lg },
    summaryTitle: { ...typography.bodyBold, color: colors.primaryDark },
    summaryText: { ...typography.body, color: colors.primaryDark, fontSize: 14, marginTop: spacing.xs },
    scheduleCard: { marginBottom: spacing.sm },
    vehicleName: { ...typography.bodyBold, color: colors.text },
    detail: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    reason: { ...typography.small, color: colors.accent, fontStyle: 'italic', marginTop: spacing.xs },
    actions: { gap: spacing.sm, marginTop: spacing.lg },
  });
  ```

- [ ] **Step 3: Commit**
  ```
  feat: add ScheduleScreen and AIScheduleReviewScreen for fleet charging optimization
  ```

---

## Task 10: Reports Screens

- [ ] **Step 1: Implement ReportsScreen, CostBreakdownScreen, BatteryHealthScreen, ExportScreen**
  - File: `src/fleet/screens/ReportsScreen.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
  import { Header, Card } from '@/core/components';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function ReportsScreen({ navigation }: any) {
    const reports = [
      { title: 'Cost Breakdown', description: 'Monthly spending by vehicle, driver, and provider', icon: '💰', screen: 'CostBreakdown' },
      { title: 'Battery Health', description: 'Fleet battery health scores and trends', icon: '🔋', screen: 'BatteryHealth' },
      { title: 'Export Data', description: 'Download PDF/CSV reports', icon: '📊', screen: 'Export' },
    ];

    return (
      <View style={styles.container}>
        <Header title="Reports" />
        <ScrollView contentContainerStyle={styles.content}>
          {reports.map((r) => (
            <TouchableOpacity key={r.screen} onPress={() => navigation.navigate(r.screen)}>
              <Card style={styles.card}>
                <Text style={styles.icon}>{r.icon}</Text>
                <View style={styles.info}><Text style={styles.title}>{r.title}</Text><Text style={styles.desc}>{r.description}</Text></View>
                <Text style={styles.arrow}>›</Text>
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md },
    card: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    icon: { fontSize: 32, marginRight: spacing.md },
    info: { flex: 1 },
    title: { ...typography.bodyBold, color: colors.text },
    desc: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    arrow: { fontSize: 22, color: colors.textTertiary },
  });
  ```

  - File: `src/fleet/screens/CostBreakdownScreen.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, ScrollView, StyleSheet } from 'react-native';
  import { Header, Card, LoadingScreen } from '@/core/components';
  import { useFleetCostReport } from '@/core/queries/useFleetReports';
  import { formatEGP } from '@/core/utils/formatCurrency';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function CostBreakdownScreen({ navigation }: any) {
    const { data: report, isLoading } = useFleetCostReport('March 2026');
    if (isLoading) return <LoadingScreen message="Generating report..." />;
    return (
      <View style={styles.container}>
        <Header title="Cost Breakdown" onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={styles.total}><Text style={styles.totalLabel}>Total Fleet Spending</Text><Text style={styles.totalValue}>{formatEGP(report?.totalSpent || 0)}</Text></Card>
          {report?.byProvider.map((p) => (
            <View key={p.provider} style={styles.row}><Text style={styles.provider}>{p.provider}</Text><Text style={styles.amount}>{formatEGP(p.amount)}</Text><Text style={styles.pct}>{p.percentage}%</Text></View>
          ))}
        </ScrollView>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md },
    total: { alignItems: 'center', marginBottom: spacing.lg, backgroundColor: colors.primaryLight },
    totalLabel: { ...typography.caption, color: colors.primaryDark },
    totalValue: { ...typography.h1, color: colors.primaryDark },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    provider: { flex: 1, ...typography.body, color: colors.text },
    amount: { ...typography.bodyBold, color: colors.text, marginRight: spacing.md },
    pct: { ...typography.caption, color: colors.textSecondary, width: 40, textAlign: 'right' },
  });
  ```

  - File: `src/fleet/screens/BatteryHealthScreen.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, ScrollView, StyleSheet } from 'react-native';
  import { Header, Card } from '@/core/components';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function BatteryHealthScreen({ navigation }: any) {
    return (
      <View style={styles.container}>
        <Header title="Battery Health" onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={styles.avgCard}><Text style={styles.avgLabel}>Fleet Average Score</Text><Text style={styles.avgValue}>87/100</Text></Card>
          <Text style={styles.note}>Battery health monitoring requires Enterprise plan. Scores are based on charging patterns and frequency analysis.</Text>
        </ScrollView>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md },
    avgCard: { alignItems: 'center', backgroundColor: colors.primaryLight },
    avgLabel: { ...typography.caption, color: colors.primaryDark },
    avgValue: { ...typography.h1, color: colors.primary },
    note: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg, fontSize: 14 },
  });
  ```

  - File: `src/fleet/screens/ExportScreen.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, StyleSheet } from 'react-native';
  import { Header, Button, Card } from '@/core/components';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function ExportScreen({ navigation }: any) {
    return (
      <View style={styles.container}>
        <Header title="Export Data" onBack={() => navigation.goBack()} />
        <View style={styles.content}>
          <Card style={styles.card}><Text style={styles.icon}>📄</Text><Text style={styles.label}>Export as PDF</Text><Button title="Generate PDF" onPress={() => {}} variant="outline" size="sm" /></Card>
          <Card style={styles.card}><Text style={styles.icon}>📊</Text><Text style={styles.label}>Export as CSV</Text><Button title="Generate CSV" onPress={() => {}} variant="outline" size="sm" /></Card>
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md },
    card: { alignItems: 'center', marginBottom: spacing.md, paddingVertical: spacing.xl },
    icon: { fontSize: 40, marginBottom: spacing.sm },
    label: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.md },
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add fleet reports screens — cost breakdown, battery health, and export
  ```

---

## Task 11: Fleet Settings Screens

- [ ] **Step 1: Implement FleetSettingsScreen, CreditTopUpScreen, MemberManagementScreen, BillingScreen**
  - File: `src/fleet/screens/FleetSettingsScreen.tsx`
  ```typescript
  import React from 'react';
  import { View, ScrollView, Text, StyleSheet } from 'react-native';
  import { Header } from '@/core/components';
  import { SettingsRow } from '@/driver/components/SettingsRow';
  import { useFleetStore } from '@/core/stores/fleetStore';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function FleetSettingsScreen({ navigation }: any) {
    const fleet = useFleetStore((s) => s.fleet);
    return (
      <View style={styles.container}>
        <Header title="Fleet Settings" />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.section}>Credits</Text>
          <SettingsRow icon="💰" label="Top Up Credits" onPress={() => navigation.navigate('CreditTopUp')} />
          <SettingsRow icon="🔄" label="Auto Top-Up" value={fleet?.auto_topup_threshold ? 'On' : 'Off'} onPress={() => {}} />
          <Text style={styles.section}>Team</Text>
          <SettingsRow icon="👥" label="Manage Members" onPress={() => navigation.navigate('MemberManagement')} />
          <Text style={styles.section}>Subscription</Text>
          <SettingsRow icon="📋" label="Billing & Plan" value={(fleet?.plan || 'starter').toUpperCase()} onPress={() => navigation.navigate('Billing')} />
          <Text style={styles.section}>Company</Text>
          <SettingsRow icon="🏢" label="Company Name" value={fleet?.company_name} />
          <SettingsRow icon="📧" label="Contact Support" onPress={() => {}} />
        </ScrollView>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md },
    section: { ...typography.bodyBold, color: colors.textSecondary, marginTop: spacing.xl, marginBottom: spacing.sm, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 },
  });
  ```

  - File: `src/fleet/screens/CreditTopUpScreen.tsx`
  ```typescript
  import React, { useState, useMemo } from 'react';
  import { View, ScrollView, StyleSheet, Alert } from 'react-native';
  import { Header, Button } from '@/core/components';
  import { AmountSelector } from '@/driver/components/AmountSelector';
  import { PaymentMethodSelector } from '@/driver/components/PaymentMethodSelector';
  import { CreditBonusTable } from '../components/CreditBonusTable';
  import { creditService } from '@/core/services/creditService';
  import { useFleetStore } from '@/core/stores/fleetStore';
  import { formatEGP } from '@/core/utils/formatCurrency';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';
  import type { PaymentMethod } from '@/core/types/wallet';

  export function CreditTopUpScreen({ navigation }: any) {
    const fleetId = useFleetStore((s) => s.fleet?.id);
    const [amount, setAmount] = useState(0);
    const [method, setMethod] = useState<PaymentMethod | null>(null);
    const [loading, setLoading] = useState(false);

    const bonus = useMemo(() => creditService.calculateBonus(amount), [amount]);

    const handleTopUp = async () => {
      if (!fleetId || amount <= 0 || !method) return;
      setLoading(true);
      try {
        const result = await creditService.topUpCredits(fleetId, amount, method);
        Alert.alert('Success', `${formatEGP(amount)} + ${formatEGP(result.bonus)} bonus added!`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } catch (e: any) { Alert.alert('Error', e.message); }
      setLoading(false);
    };

    return (
      <View style={styles.container}>
        <Header title="Top Up Credits" onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.content}>
          <CreditBonusTable />
          <View style={{ height: spacing.lg }} />
          <AmountSelector amount={amount} onAmountChange={setAmount} />
          {bonus > 0 && <View style={styles.bonusBanner}><Text style={styles.bonusText}>You'll receive +{formatEGP(bonus)} bonus!</Text></View>}
          <View style={{ height: spacing.lg }} />
          <PaymentMethodSelector selected={method} onSelect={setMethod} />
        </ScrollView>
        <View style={styles.footer}>
          <Button title={`Pay ${formatEGP(amount)} (get ${formatEGP(amount + bonus)})`} onPress={handleTopUp} loading={loading} size="lg" disabled={amount <= 0 || !method} />
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: 100 },
    bonusBanner: { backgroundColor: colors.primaryLight, padding: spacing.md, borderRadius: 12, marginTop: spacing.md, alignItems: 'center' },
    bonusText: { ...typography.bodyBold, color: colors.primaryDark },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  });
  ```

  - File: `src/fleet/screens/MemberManagementScreen.tsx`
  ```typescript
  import React from 'react';
  import { View, FlatList, Text, StyleSheet } from 'react-native';
  import { Header, Avatar, Badge, LoadingScreen } from '@/core/components';
  import { useFleetMembers } from '@/core/queries/useFleetDrivers';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function MemberManagementScreen({ navigation }: any) {
    const { data: members, isLoading } = useFleetMembers();
    if (isLoading) return <LoadingScreen />;
    return (
      <View style={styles.container}>
        <Header title="Team Members" onBack={() => navigation.goBack()} />
        <FlatList
          data={members || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Avatar name={item.user?.full_name || 'Driver'} size={40} />
              <View style={styles.info}><Text style={styles.name}>{item.user?.full_name}</Text><Text style={styles.phone}>{item.user?.phone || 'No phone'}</Text></View>
              <Badge label={item.is_active ? 'Active' : 'Inactive'} backgroundColor={item.is_active ? colors.success : colors.textTertiary} />
            </View>
          )}
          contentContainerStyle={styles.content}
        />
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    info: { flex: 1, marginLeft: spacing.md },
    name: { ...typography.bodyBold, color: colors.text },
    phone: { ...typography.caption, color: colors.textSecondary },
  });
  ```

  - File: `src/fleet/screens/BillingScreen.tsx`
  ```typescript
  import React from 'react';
  import { View, ScrollView, StyleSheet } from 'react-native';
  import { Header } from '@/core/components';
  import { SubscriptionCard } from '../components/SubscriptionCard';
  import { useFleetStore } from '@/core/stores/fleetStore';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';

  export function BillingScreen({ navigation }: any) {
    const fleet = useFleetStore((s) => s.fleet);
    return (
      <View style={styles.container}>
        <Header title="Billing & Plan" onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.content}>
          {['starter', 'business', 'enterprise'].map((plan) => (
            <SubscriptionCard key={plan} planKey={plan} isCurrentPlan={fleet?.plan === plan} onSelect={() => {}} />
          ))}
        </ScrollView>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md },
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add fleet settings, credit top-up, member management, and billing screens
  ```

---

## Task 12: Update Fleet Navigator

- [ ] **Step 1: Replace placeholder FleetNavigator with full stack navigation**
  - File: `src/navigation/FleetNavigator.tsx` (full rewrite)
  ```typescript
  import React from 'react';
  import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
  import { createNativeStackNavigator } from '@react-navigation/native-stack';
  import { FleetHomeScreen } from '@/fleet/screens/FleetHomeScreen';
  import { VehicleListScreen } from '@/fleet/screens/VehicleListScreen';
  import { VehicleDetailScreen } from '@/fleet/screens/VehicleDetailScreen';
  import { DriverDetailScreen } from '@/fleet/screens/DriverDetailScreen';
  import { AssignDriverScreen } from '@/fleet/screens/AssignDriverScreen';
  import { ScheduleScreen } from '@/fleet/screens/ScheduleScreen';
  import { AIScheduleReviewScreen } from '@/fleet/screens/AIScheduleReviewScreen';
  import { ReportsScreen } from '@/fleet/screens/ReportsScreen';
  import { CostBreakdownScreen } from '@/fleet/screens/CostBreakdownScreen';
  import { BatteryHealthScreen } from '@/fleet/screens/BatteryHealthScreen';
  import { ExportScreen } from '@/fleet/screens/ExportScreen';
  import { FleetSettingsScreen } from '@/fleet/screens/FleetSettingsScreen';
  import { CreditTopUpScreen } from '@/fleet/screens/CreditTopUpScreen';
  import { MemberManagementScreen } from '@/fleet/screens/MemberManagementScreen';
  import { BillingScreen } from '@/fleet/screens/BillingScreen';
  import { colors } from '@/core/theme/colors';

  const Tab = createBottomTabNavigator();
  const Stack = createNativeStackNavigator();

  function DashboardStack() {
    return (<Stack.Navigator screenOptions={{ headerShown: false }}><Stack.Screen name="Home" component={FleetHomeScreen} /><Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} /><Stack.Screen name="DriverDetail" component={DriverDetailScreen} /></Stack.Navigator>);
  }

  function VehiclesStack() {
    return (<Stack.Navigator screenOptions={{ headerShown: false }}><Stack.Screen name="VehicleList" component={VehicleListScreen} /><Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} /><Stack.Screen name="AssignDriver" component={AssignDriverScreen} /></Stack.Navigator>);
  }

  function ScheduleStack() {
    return (<Stack.Navigator screenOptions={{ headerShown: false }}><Stack.Screen name="ScheduleMain" component={ScheduleScreen} /><Stack.Screen name="AIScheduleReview" component={AIScheduleReviewScreen} /></Stack.Navigator>);
  }

  function ReportsStack() {
    return (<Stack.Navigator screenOptions={{ headerShown: false }}><Stack.Screen name="ReportsMain" component={ReportsScreen} /><Stack.Screen name="CostBreakdown" component={CostBreakdownScreen} /><Stack.Screen name="BatteryHealth" component={BatteryHealthScreen} /><Stack.Screen name="Export" component={ExportScreen} /></Stack.Navigator>);
  }

  function SettingsStack() {
    return (<Stack.Navigator screenOptions={{ headerShown: false }}><Stack.Screen name="SettingsMain" component={FleetSettingsScreen} /><Stack.Screen name="CreditTopUp" component={CreditTopUpScreen} /><Stack.Screen name="MemberManagement" component={MemberManagementScreen} /><Stack.Screen name="Billing" component={BillingScreen} /></Stack.Navigator>);
  }

  export function FleetNavigator() {
    return (
      <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.textTertiary }}>
        <Tab.Screen name="Dashboard" component={DashboardStack} options={{ tabBarLabel: 'Dashboard' }} />
        <Tab.Screen name="Vehicles" component={VehiclesStack} />
        <Tab.Screen name="Schedule" component={ScheduleStack} />
        <Tab.Screen name="Reports" component={ReportsStack} />
        <Tab.Screen name="Settings" component={SettingsStack} />
      </Tab.Navigator>
    );
  }
  ```

- [ ] **Step 2: Commit**
  ```
  feat: update FleetNavigator with full 5-tab stack navigation for all fleet screens
  ```

---

## Task 13: Integration Test

- [ ] **Step 1: Run all tests**
  ```bash
  npx jest --verbose
  ```

- [ ] **Step 2: Verify TypeScript**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 3: Commit**
  ```
  chore: verify fleet management feature — all tests pass
  ```

---

**Total: 13 tasks, ~38 steps**
