# Driver Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build driver profile screens including vehicle management with Egypt-market EV database, favorites, settings, reviews, onboarding flow, and charging statistics dashboard.
**Architecture:** ProfileScreen serves as the hub linking to vehicle management, favorites, settings, and stats. VehicleScreen/AddVehicleScreen use an EV database of makes/models popular in Egypt (BYD, MG, Chery, etc.) to auto-fill battery capacity. ReviewModal allows post-charging ratings. OnboardingScreen guides first-time users through setup.
**Tech Stack:** React Native, Supabase, React Query, Zustand, expo-image-picker

---

## File Structure

```
src/
├── core/
│   ├── data/
│   │   └── evDatabase.ts
│   ├── services/
│   │   ├── profileService.ts
│   │   ├── vehicleService.ts
│   │   └── reviewService.ts
│   ├── queries/
│   │   ├── useProfile.ts
│   │   ├── useVehicles.ts
│   │   └── useReviews.ts
│   └── stores/
│       └── profileStore.ts
├── driver/
│   ├── screens/
│   │   ├── ProfileScreen.tsx
│   │   ├── VehicleScreen.tsx
│   │   ├── AddVehicleScreen.tsx
│   │   ├── FavoritesScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── OnboardingScreen.tsx
│   └── components/
│       ├── StatCard.tsx
│       ├── VehicleCard.tsx
│       ├── ReviewModal.tsx
│       └── SettingsRow.tsx
└── __tests__/
    ├── evDatabase.test.ts
    ├── vehicleService.test.ts
    ├── ProfileScreen.test.tsx
    └── VehicleCard.test.tsx
```

---

## Task 1: EV Database for Egypt Market

- [ ] **Step 1: Write test**
  - File: `__tests__/evDatabase.test.ts`
  ```typescript
  import { evDatabase, getModelsForMake, getVehicleSpec } from '@/core/data/evDatabase';

  describe('evDatabase', () => {
    it('has BYD', () => expect(evDatabase.some(m => m.make === 'BYD')).toBe(true));
    it('has MG', () => expect(evDatabase.some(m => m.make === 'MG')).toBe(true));
    it('returns models for make', () => {
      const models = getModelsForMake('BYD');
      expect(models.length).toBeGreaterThan(0);
      expect(models[0]).toHaveProperty('model');
      expect(models[0]).toHaveProperty('batteryCapacityKwh');
    });
    it('returns spec for specific model', () => {
      const spec = getVehicleSpec('BYD', 'Atto 3');
      expect(spec?.batteryCapacityKwh).toBeGreaterThan(0);
      expect(spec?.connectorTypes).toContain('CCS');
    });
  });
  ```

- [ ] **Step 2: Verify fails**
  ```bash
  npx jest __tests__/evDatabase.test.ts
  ```

- [ ] **Step 3: Implement**
  - File: `src/core/data/evDatabase.ts`
  ```typescript
  export interface EVModel {
    make: string;
    model: string;
    year: number;
    batteryCapacityKwh: number;
    rangeKm: number;
    connectorTypes: string[];
    maxChargingKw: number;
  }

  export const evDatabase: EVModel[] = [
    // BYD (most popular EV brand in Egypt)
    { make: 'BYD', model: 'Atto 3', year: 2024, batteryCapacityKwh: 60.48, rangeKm: 420, connectorTypes: ['CCS', 'Type2'], maxChargingKw: 80 },
    { make: 'BYD', model: 'Han EV', year: 2024, batteryCapacityKwh: 85.44, rangeKm: 521, connectorTypes: ['CCS', 'Type2'], maxChargingKw: 120 },
    { make: 'BYD', model: 'Seal', year: 2024, batteryCapacityKwh: 82.56, rangeKm: 570, connectorTypes: ['CCS', 'Type2'], maxChargingKw: 150 },
    { make: 'BYD', model: 'Dolphin', year: 2024, batteryCapacityKwh: 44.9, rangeKm: 340, connectorTypes: ['CCS', 'Type2'], maxChargingKw: 60 },
    { make: 'BYD', model: 'Tang EV', year: 2024, batteryCapacityKwh: 108.8, rangeKm: 530, connectorTypes: ['CCS', 'Type2'], maxChargingKw: 110 },
    // MG
    { make: 'MG', model: 'MG4', year: 2024, batteryCapacityKwh: 64, rangeKm: 450, connectorTypes: ['CCS', 'Type2'], maxChargingKw: 135 },
    { make: 'MG', model: 'MG5 EV', year: 2024, batteryCapacityKwh: 61.1, rangeKm: 400, connectorTypes: ['CCS', 'Type2'], maxChargingKw: 87 },
    { make: 'MG', model: 'ZS EV', year: 2024, batteryCapacityKwh: 51, rangeKm: 320, connectorTypes: ['CCS', 'Type2'], maxChargingKw: 76 },
    { make: 'MG', model: 'Marvel R', year: 2024, batteryCapacityKwh: 70, rangeKm: 402, connectorTypes: ['CCS', 'Type2'], maxChargingKw: 92 },
    // Chery
    { make: 'Chery', model: 'Tiggo 8 Pro e+', year: 2024, batteryCapacityKwh: 19.3, rangeKm: 80, connectorTypes: ['Type2'], maxChargingKw: 6.6 },
    { make: 'Chery', model: 'eQ7', year: 2024, batteryCapacityKwh: 68.7, rangeKm: 412, connectorTypes: ['CCS', 'Type2'], maxChargingKw: 80 },
    // BMW
    { make: 'BMW', model: 'iX3', year: 2024, batteryCapacityKwh: 80, rangeKm: 460, connectorTypes: ['CCS', 'Type2'], maxChargingKw: 150 },
    { make: 'BMW', model: 'iX', year: 2024, batteryCapacityKwh: 76.6, rangeKm: 425, connectorTypes: ['CCS', 'Type2'], maxChargingKw: 195 },
    { make: 'BMW', model: 'i4', year: 2024, batteryCapacityKwh: 83.9, rangeKm: 590, connectorTypes: ['CCS', 'Type2'], maxChargingKw: 205 },
    // Mercedes
    { make: 'Mercedes', model: 'EQC', year: 2024, batteryCapacityKwh: 80, rangeKm: 437, connectorTypes: ['CCS', 'Type2'], maxChargingKw: 110 },
    { make: 'Mercedes', model: 'EQA', year: 2024, batteryCapacityKwh: 66.5, rangeKm: 426, connectorTypes: ['CCS', 'Type2'], maxChargingKw: 100 },
    { make: 'Mercedes', model: 'EQS', year: 2024, batteryCapacityKwh: 107.8, rangeKm: 770, connectorTypes: ['CCS', 'Type2'], maxChargingKw: 200 },
    // Tesla
    { make: 'Tesla', model: 'Model 3', year: 2024, batteryCapacityKwh: 60, rangeKm: 491, connectorTypes: ['CCS', 'Type2'], maxChargingKw: 170 },
    { make: 'Tesla', model: 'Model Y', year: 2024, batteryCapacityKwh: 75, rangeKm: 533, connectorTypes: ['CCS', 'Type2'], maxChargingKw: 250 },
    // Hyundai
    { make: 'Hyundai', model: 'Ioniq 5', year: 2024, batteryCapacityKwh: 77.4, rangeKm: 481, connectorTypes: ['CCS', 'Type2'], maxChargingKw: 220 },
    { make: 'Hyundai', model: 'Kona Electric', year: 2024, batteryCapacityKwh: 65.4, rangeKm: 455, connectorTypes: ['CCS', 'Type2'], maxChargingKw: 77 },
    // Kia
    { make: 'Kia', model: 'EV6', year: 2024, batteryCapacityKwh: 77.4, rangeKm: 528, connectorTypes: ['CCS', 'Type2'], maxChargingKw: 233 },
    { make: 'Kia', model: 'Niro EV', year: 2024, batteryCapacityKwh: 64.8, rangeKm: 463, connectorTypes: ['CCS', 'Type2'], maxChargingKw: 77 },
    // Nissan
    { make: 'Nissan', model: 'Leaf', year: 2024, batteryCapacityKwh: 40, rangeKm: 270, connectorTypes: ['CHAdeMO', 'Type2'], maxChargingKw: 50 },
    // JAC
    { make: 'JAC', model: 'E10X', year: 2024, batteryCapacityKwh: 30.2, rangeKm: 200, connectorTypes: ['Type2', 'GBT'], maxChargingKw: 30 },
    { make: 'JAC', model: 'iEV7S', year: 2024, batteryCapacityKwh: 39.2, rangeKm: 280, connectorTypes: ['CCS', 'Type2'], maxChargingKw: 40 },
  ];

  export function getMakes(): string[] {
    return [...new Set(evDatabase.map(v => v.make))].sort();
  }

  export function getModelsForMake(make: string): EVModel[] {
    return evDatabase.filter(v => v.make === make).sort((a, b) => a.model.localeCompare(b.model));
  }

  export function getVehicleSpec(make: string, model: string): EVModel | undefined {
    return evDatabase.find(v => v.make === make && v.model === model);
  }
  ```

- [ ] **Step 4: Verify passes**
  ```bash
  npx jest __tests__/evDatabase.test.ts
  ```

- [ ] **Step 5: Commit**
  ```
  feat: add Egypt-market EV database with BYD, MG, Chery, BMW, Tesla, and more
  ```

---

## Task 2: Vehicle Service

- [ ] **Step 1: Write test**
  - File: `__tests__/vehicleService.test.ts`
  ```typescript
  import { vehicleService } from '@/core/services/vehicleService';

  jest.mock('@/core/config/supabase', () => ({
    supabase: {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ order: jest.fn().mockReturnValue({ data: [{ id: 'v1', make: 'BYD', model: 'Atto 3' }], error: null }) }) }),
        insert: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: 'v1' }, error: null }) }) }),
        delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      }),
    },
  }));

  describe('vehicleService', () => {
    it('gets user vehicles', async () => {
      const vehicles = await vehicleService.getUserVehicles('u1');
      expect(vehicles.length).toBeGreaterThan(0);
    });
    it('adds a vehicle', async () => {
      const vehicle = await vehicleService.addVehicle({ userId: 'u1', make: 'BYD', model: 'Atto 3', batteryCapacityKwh: 60.48, connectorTypes: ['CCS', 'Type2'] });
      expect(vehicle).toHaveProperty('id');
    });
  });
  ```

- [ ] **Step 2: Implement**
  - File: `src/core/services/vehicleService.ts`
  ```typescript
  import { supabase } from '../config/supabase';
  import type { Vehicle } from '../types/fleet';

  interface AddVehicleInput {
    userId: string;
    fleetId?: string;
    make: string;
    model: string;
    year?: number;
    batteryCapacityKwh: number;
    connectorTypes: string[];
    licensePlate?: string;
  }

  export const vehicleService = {
    async getUserVehicles(userId: string): Promise<Vehicle[]> {
      const { data, error } = await supabase.from('vehicles').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async addVehicle(input: AddVehicleInput): Promise<Vehicle> {
      const { data, error } = await supabase.from('vehicles').insert({
        user_id: input.userId,
        fleet_id: input.fleetId || null,
        make: input.make,
        model: input.model,
        year: input.year || null,
        battery_capacity_kwh: input.batteryCapacityKwh,
        connector_types: input.connectorTypes,
        license_plate: input.licensePlate || null,
      }).select().single();
      if (error) throw error;
      return data;
    },

    async deleteVehicle(vehicleId: string): Promise<void> {
      const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId);
      if (error) throw error;
    },

    async updateVehicle(vehicleId: string, updates: Partial<AddVehicleInput>): Promise<void> {
      const { error } = await supabase.from('vehicles').update(updates).eq('id', vehicleId);
      if (error) throw error;
    },
  };
  ```

- [ ] **Step 3: Verify passes**
  ```bash
  npx jest __tests__/vehicleService.test.ts
  ```

- [ ] **Step 4: Commit**
  ```
  feat: add vehicle service with CRUD operations
  ```

---

## Task 3: Profile & Review Services

- [ ] **Step 1: Implement profileService**
  - File: `src/core/services/profileService.ts`
  ```typescript
  import { supabase } from '../config/supabase';
  import type { UserProfile } from '../types/auth';

  export const profileService = {
    async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
      const { error } = await supabase.from('user_profiles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', userId);
      if (error) throw error;
    },

    async getChargingStats(userId: string): Promise<{ totalSessions: number; totalKwh: number; totalSpent: number; co2SavedKg: number }> {
      const { data, error } = await supabase.from('charging_sessions').select('kwh_delivered, cost_total').eq('user_id', userId).not('end_time', 'is', null);
      if (error) throw error;
      const sessions = data || [];
      const totalKwh = sessions.reduce((sum, s) => sum + (s.kwh_delivered || 0), 0);
      const totalSpent = sessions.reduce((sum, s) => sum + (s.cost_total || 0), 0);
      // Average ICE car emits ~0.21 kg CO2 per km, EV uses ~0.15 kWh/km
      const kmEquivalent = totalKwh / 0.15;
      const co2SavedKg = kmEquivalent * 0.21;
      return { totalSessions: sessions.length, totalKwh, totalSpent, co2SavedKg };
    },
  };
  ```

- [ ] **Step 2: Implement reviewService**
  - File: `src/core/services/reviewService.ts`
  ```typescript
  import { supabase } from '../config/supabase';
  import type { Review } from '../types/station';

  export const reviewService = {
    async getStationReviews(stationId: string): Promise<Review[]> {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, user:user_profiles(full_name, avatar_url)')
        .eq('station_id', stationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async createReview(userId: string, stationId: string, rating: number, comment?: string): Promise<Review> {
      const { data, error } = await supabase
        .from('reviews')
        .insert({ user_id: userId, station_id: stationId, rating, comment: comment || null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  };
  ```

- [ ] **Step 3: Commit**
  ```
  feat: add profile service with charging stats and review service
  ```

---

## Task 4: React Query Hooks

- [ ] **Step 1: Implement useVehicles**
  - File: `src/core/queries/useVehicles.ts`
  ```typescript
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
  import { vehicleService } from '../services/vehicleService';
  import { useAuthStore } from '../stores/authStore';

  export function useVehicles() {
    const userId = useAuthStore((s) => s.user?.id);
    return useQuery({
      queryKey: ['vehicles', userId],
      queryFn: () => vehicleService.getUserVehicles(userId!),
      enabled: !!userId,
    });
  }

  export function useAddVehicle() {
    const userId = useAuthStore((s) => s.user?.id);
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (input: { make: string; model: string; batteryCapacityKwh: number; connectorTypes: string[]; year?: number; licensePlate?: string }) =>
        vehicleService.addVehicle({ ...input, userId: userId! }),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicles', userId] }),
    });
  }

  export function useDeleteVehicle() {
    const userId = useAuthStore((s) => s.user?.id);
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (vehicleId: string) => vehicleService.deleteVehicle(vehicleId),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicles', userId] }),
    });
  }
  ```

- [ ] **Step 2: Implement useProfile and useReviews**
  - File: `src/core/queries/useProfile.ts`
  ```typescript
  import { useQuery } from '@tanstack/react-query';
  import { profileService } from '../services/profileService';
  import { useAuthStore } from '../stores/authStore';

  export function useChargingStats() {
    const userId = useAuthStore((s) => s.user?.id);
    return useQuery({
      queryKey: ['chargingStats', userId],
      queryFn: () => profileService.getChargingStats(userId!),
      enabled: !!userId,
    });
  }
  ```

  - File: `src/core/queries/useReviews.ts`
  ```typescript
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
  import { reviewService } from '../services/reviewService';
  import { useAuthStore } from '../stores/authStore';

  export function useStationReviews(stationId: string | null) {
    return useQuery({
      queryKey: ['reviews', stationId],
      queryFn: () => reviewService.getStationReviews(stationId!),
      enabled: !!stationId,
    });
  }

  export function useCreateReview() {
    const userId = useAuthStore((s) => s.user?.id);
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (input: { stationId: string; rating: number; comment?: string }) =>
        reviewService.createReview(userId!, input.stationId, input.rating, input.comment),
      onSuccess: (_, vars) => queryClient.invalidateQueries({ queryKey: ['reviews', vars.stationId] }),
    });
  }
  ```

- [ ] **Step 3: Commit**
  ```
  feat: add React Query hooks for vehicles, charging stats, and reviews
  ```

---

## Task 5: Vehicle Card & Stat Card Components

- [ ] **Step 1: Implement VehicleCard**
  - File: `src/driver/components/VehicleCard.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
  import { Card, Badge } from '@/core/components';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';
  import type { Vehicle } from '@/core/types/fleet';

  interface Props { vehicle: Vehicle; onPress?: () => void; onDelete?: () => void; }

  export function VehicleCard({ vehicle, onPress, onDelete }: Props) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.name}>{vehicle.make} {vehicle.model}</Text>
              <Text style={styles.details}>{vehicle.battery_capacity_kwh} kWh · {vehicle.connector_types.join(', ')}</Text>
              {vehicle.license_plate && <Text style={styles.plate}>{vehicle.license_plate}</Text>}
            </View>
            {vehicle.year && <Badge label={String(vehicle.year)} backgroundColor={colors.surfaceSecondary} color={colors.textSecondary} />}
          </View>
          {onDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}><Text style={styles.deleteText}>Remove</Text></TouchableOpacity>
          )}
        </Card>
      </TouchableOpacity>
    );
  }

  const styles = StyleSheet.create({
    card: { marginBottom: spacing.sm },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    info: { flex: 1 },
    name: { ...typography.bodyBold, color: colors.text },
    details: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    plate: { ...typography.small, color: colors.accent, marginTop: 4, fontWeight: '600' },
    deleteBtn: { marginTop: spacing.sm, alignSelf: 'flex-start' },
    deleteText: { ...typography.caption, color: colors.error },
  });
  ```

- [ ] **Step 2: Implement StatCard**
  - File: `src/driver/components/StatCard.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, StyleSheet } from 'react-native';
  import { colors } from '@/core/theme/colors';
  import { spacing, borderRadius } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  interface Props { icon: string; value: string; label: string; color?: string; }

  export function StatCard({ icon, value, label, color = colors.primary }: Props) {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[styles.value, { color }]}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.lg },
    icon: { fontSize: 24, marginBottom: spacing.xs },
    value: { ...typography.h3, marginBottom: 2 },
    label: { ...typography.small, color: colors.textSecondary, textAlign: 'center' },
  });
  ```

- [ ] **Step 3: Commit**
  ```
  feat: add VehicleCard and StatCard components
  ```

---

## Task 6: Profile Screen

- [ ] **Step 1: Implement**
  - File: `src/driver/screens/ProfileScreen.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
  import { Header, Avatar, Card, LoadingScreen } from '@/core/components';
  import { StatCard } from '../components/StatCard';
  import { useAuthStore } from '@/core/stores/authStore';
  import { useChargingStats } from '@/core/queries/useProfile';
  import { useAuth } from '@/core/auth/useAuth';
  import { formatEGP, formatKWh } from '@/core/utils/formatCurrency';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function ProfileScreen({ navigation }: any) {
    const user = useAuthStore((s) => s.user);
    const { signOut } = useAuth();
    const { data: stats } = useChargingStats();

    if (!user) return <LoadingScreen />;

    const menuItems = [
      { label: 'My Vehicles', icon: '🚗', screen: 'Vehicle' },
      { label: 'Favorites', icon: '⭐', screen: 'Favorites' },
      { label: 'Settings', icon: '⚙️', screen: 'Settings' },
    ];

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Header title="Profile" />
        <View style={styles.profileSection}>
          <Avatar name={user.full_name} uri={user.avatar_url} size={72} />
          <Text style={styles.name}>{user.full_name}</Text>
          <Text style={styles.role}>{user.role === 'driver' ? 'EV Driver' : 'Fleet Manager'}</Text>
        </View>

        {stats && (
          <View style={styles.statsGrid}>
            <StatCard icon="⚡" value={stats.totalSessions.toString()} label="Sessions" />
            <StatCard icon="🔋" value={formatKWh(stats.totalKwh)} label="Charged" />
            <StatCard icon="💰" value={formatEGP(stats.totalSpent)} label="Spent" color={colors.accent} />
            <StatCard icon="🌿" value={`${stats.co2SavedKg.toFixed(0)} kg`} label="CO2 Saved" color={colors.success} />
          </View>
        )}

        <View style={styles.menu}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.screen} style={styles.menuItem} onPress={() => navigation.navigate(item.screen)}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: spacing.xxl },
    profileSection: { alignItems: 'center', paddingVertical: spacing.xl },
    name: { ...typography.h2, color: colors.text, marginTop: spacing.md },
    role: { ...typography.caption, color: colors.textSecondary },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.md },
    menu: { marginTop: spacing.xl, paddingHorizontal: spacing.md },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    menuIcon: { fontSize: 22, marginRight: spacing.md },
    menuLabel: { flex: 1, ...typography.body, color: colors.text },
    menuArrow: { fontSize: 22, color: colors.textTertiary },
    logoutBtn: { marginTop: spacing.xl, alignItems: 'center', padding: spacing.md },
    logoutText: { ...typography.bodyBold, color: colors.error },
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add ProfileScreen with stats, menu, and sign out
  ```

---

## Task 7: Vehicle Screen & Add Vehicle Screen

- [ ] **Step 1: Implement VehicleScreen**
  - File: `src/driver/screens/VehicleScreen.tsx`
  ```typescript
  import React from 'react';
  import { View, FlatList, Text, StyleSheet, Alert } from 'react-native';
  import { Header, Button, LoadingScreen } from '@/core/components';
  import { VehicleCard } from '../components/VehicleCard';
  import { useVehicles, useDeleteVehicle } from '@/core/queries/useVehicles';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function VehicleScreen({ navigation }: any) {
    const { data: vehicles, isLoading } = useVehicles();
    const deleteVehicle = useDeleteVehicle();

    const handleDelete = (vehicleId: string) => {
      Alert.alert('Remove Vehicle', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => deleteVehicle.mutate(vehicleId) },
      ]);
    };

    if (isLoading) return <LoadingScreen />;

    return (
      <View style={styles.container}>
        <Header title="My Vehicles" onBack={() => navigation.goBack()} />
        <FlatList
          data={vehicles || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VehicleCard vehicle={item} onDelete={() => handleDelete(item.id)} />}
          ListEmptyComponent={<Text style={styles.empty}>No vehicles yet. Add your first EV!</Text>}
          contentContainerStyle={styles.content}
        />
        <View style={styles.footer}>
          <Button title="Add Vehicle" onPress={() => navigation.navigate('AddVehicle')} size="lg" />
        </View>
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

- [ ] **Step 2: Implement AddVehicleScreen**
  - File: `src/driver/screens/AddVehicleScreen.tsx`
  ```typescript
  import React, { useState, useMemo } from 'react';
  import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
  import { Header, Button } from '@/core/components';
  import { getMakes, getModelsForMake, getVehicleSpec } from '@/core/data/evDatabase';
  import { useAddVehicle } from '@/core/queries/useVehicles';
  import { colors } from '@/core/theme/colors';
  import { spacing, borderRadius } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function AddVehicleScreen({ navigation }: any) {
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [licensePlate, setLicensePlate] = useState('');
    const addVehicle = useAddVehicle();

    const makes = getMakes();
    const models = useMemo(() => make ? getModelsForMake(make) : [], [make]);
    const spec = useMemo(() => make && model ? getVehicleSpec(make, model) : null, [make, model]);

    const handleAdd = async () => {
      if (!spec) { Alert.alert('Error', 'Please select make and model'); return; }
      try {
        await addVehicle.mutateAsync({
          make: spec.make, model: spec.model, batteryCapacityKwh: spec.batteryCapacityKwh,
          connectorTypes: spec.connectorTypes, year: spec.year, licensePlate: licensePlate || undefined,
        });
        navigation.goBack();
      } catch (e: any) { Alert.alert('Error', e.message); }
    };

    return (
      <View style={styles.container}>
        <Header title="Add Vehicle" onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.label}>Make</Text>
          <View style={styles.chipRow}>
            {makes.map((m) => (
              <TouchableOpacity key={m} style={[styles.chip, make === m && styles.chipActive]} onPress={() => { setMake(m); setModel(''); }}>
                <Text style={[styles.chipText, make === m && styles.chipTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {make && (
            <>
              <Text style={styles.label}>Model</Text>
              <View style={styles.chipRow}>
                {models.map((m) => (
                  <TouchableOpacity key={m.model} style={[styles.chip, model === m.model && styles.chipActive]} onPress={() => setModel(m.model)}>
                    <Text style={[styles.chipText, model === m.model && styles.chipTextActive]}>{m.model}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {spec && (
            <View style={styles.specCard}>
              <Text style={styles.specTitle}>{spec.make} {spec.model}</Text>
              <Text style={styles.specLine}>Battery: {spec.batteryCapacityKwh} kWh</Text>
              <Text style={styles.specLine}>Range: {spec.rangeKm} km</Text>
              <Text style={styles.specLine}>Connectors: {spec.connectorTypes.join(', ')}</Text>
              <Text style={styles.specLine}>Max Charge: {spec.maxChargingKw} kW</Text>
            </View>
          )}

          <Text style={styles.label}>License Plate (optional)</Text>
          <TextInput style={styles.input} value={licensePlate} onChangeText={setLicensePlate} placeholder="e.g. ABC 1234" placeholderTextColor={colors.textTertiary} />
        </ScrollView>
        <View style={styles.footer}>
          <Button title="Add Vehicle" onPress={handleAdd} loading={addVehicle.isPending} size="lg" disabled={!spec} />
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: 100 },
    label: { ...typography.bodyBold, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
    chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    chipText: { ...typography.caption, color: colors.textSecondary },
    chipTextActive: { color: colors.primaryDark, fontWeight: '600' },
    specCard: { backgroundColor: colors.primaryLight, padding: spacing.md, borderRadius: borderRadius.lg, marginTop: spacing.md },
    specTitle: { ...typography.bodyBold, color: colors.primaryDark, marginBottom: spacing.sm },
    specLine: { ...typography.caption, color: colors.primaryDark, marginBottom: 4 },
    input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, ...typography.body, color: colors.text },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  });
  ```

- [ ] **Step 3: Commit**
  ```
  feat: add VehicleScreen and AddVehicleScreen with EV database auto-fill
  ```

---

## Task 8: Favorites Screen

- [ ] **Step 1: Implement**
  - File: `src/driver/screens/FavoritesScreen.tsx`
  ```typescript
  import React from 'react';
  import { View, FlatList, Text, StyleSheet } from 'react-native';
  import { Header, LoadingScreen } from '@/core/components';
  import { StationListItem } from '../components/StationListItem';
  import { useFavorites } from '@/core/queries/useFavorites';
  import { useStations } from '@/core/queries/useStations';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function FavoritesScreen({ navigation }: any) {
    const { data: favoriteIds } = useFavorites();
    const { data: allStations, isLoading } = useStations();

    const favorites = allStations?.filter(s => favoriteIds?.includes(s.id)) || [];

    if (isLoading) return <LoadingScreen />;

    return (
      <View style={styles.container}>
        <Header title="Favorite Stations" onBack={() => navigation.goBack()} />
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <StationListItem station={item} onPress={() => navigation.navigate('StationDetail', { stationId: item.id })} />
          )}
          ListEmptyComponent={<Text style={styles.empty}>No favorite stations yet. Tap the heart on any station to save it!</Text>}
          contentContainerStyle={styles.content}
        />
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingVertical: spacing.md },
    empty: { ...typography.body, color: colors.textTertiary, textAlign: 'center', padding: spacing.xl },
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add FavoritesScreen for bookmarked stations
  ```

---

## Task 9: Settings Screen

- [ ] **Step 1: Implement SettingsRow**
  - File: `src/driver/components/SettingsRow.tsx`
  ```typescript
  import React from 'react';
  import { TouchableOpacity, View, Text, Switch, StyleSheet } from 'react-native';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  interface Props { label: string; icon?: string; value?: string; isSwitch?: boolean; switchValue?: boolean; onPress?: () => void; onToggle?: (value: boolean) => void; }

  export function SettingsRow({ label, icon, value, isSwitch, switchValue, onPress, onToggle }: Props) {
    return (
      <TouchableOpacity style={styles.row} onPress={onPress} disabled={isSwitch && !onPress}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.label}>{label}</Text>
        {isSwitch ? (
          <Switch value={switchValue} onValueChange={onToggle} trackColor={{ true: colors.primary }} />
        ) : value ? (
          <Text style={styles.value}>{value}</Text>
        ) : (
          <Text style={styles.arrow}>›</Text>
        )}
      </TouchableOpacity>
    );
  }

  const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    icon: { fontSize: 20, marginRight: spacing.md },
    label: { flex: 1, ...typography.body, color: colors.text },
    value: { ...typography.caption, color: colors.textSecondary },
    arrow: { fontSize: 22, color: colors.textTertiary },
  });
  ```

- [ ] **Step 2: Implement SettingsScreen**
  - File: `src/driver/screens/SettingsScreen.tsx`
  ```typescript
  import React, { useState } from 'react';
  import { View, ScrollView, Text, StyleSheet } from 'react-native';
  import { Header } from '@/core/components';
  import { SettingsRow } from '../components/SettingsRow';
  import { useAuthStore } from '@/core/stores/authStore';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function SettingsScreen({ navigation }: any) {
    const user = useAuthStore((s) => s.user);
    const [notifications, setNotifications] = useState(true);
    const [language, setLanguage] = useState(user?.preferred_lang || 'en');

    return (
      <View style={styles.container}>
        <Header title="Settings" onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.section}>General</Text>
          <SettingsRow icon="🌐" label="Language" value={language === 'ar' ? 'العربية' : 'English'} onPress={() => setLanguage(l => l === 'en' ? 'ar' : 'en')} />
          <SettingsRow icon="🔔" label="Push Notifications" isSwitch switchValue={notifications} onToggle={setNotifications} />

          <Text style={styles.section}>Payment</Text>
          <SettingsRow icon="💳" label="Payment Methods" onPress={() => {}} />
          <SettingsRow icon="💰" label="Auto Top-Up" onPress={() => {}} />

          <Text style={styles.section}>Privacy</Text>
          <SettingsRow icon="🔒" label="Change Password" onPress={() => {}} />
          <SettingsRow icon="📋" label="Privacy Policy" onPress={() => {}} />
          <SettingsRow icon="📄" label="Terms of Service" onPress={() => {}} />

          <Text style={styles.section}>About</Text>
          <SettingsRow icon="ℹ️" label="App Version" value="1.0.0" />
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

- [ ] **Step 3: Commit**
  ```
  feat: add SettingsScreen with language, notifications, payment, and privacy options
  ```

---

## Task 10: Review Modal

- [ ] **Step 1: Implement**
  - File: `src/driver/components/ReviewModal.tsx`
  ```typescript
  import React, { useState } from 'react';
  import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
  import { Button } from '@/core/components';
  import { useCreateReview } from '@/core/queries/useReviews';
  import { colors } from '@/core/theme/colors';
  import { spacing, borderRadius } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  interface Props { visible: boolean; stationId: string; stationName: string; onClose: () => void; }

  export function ReviewModal({ visible, stationId, stationName, onClose }: Props) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const createReview = useCreateReview();

    const handleSubmit = async () => {
      if (rating === 0) return;
      await createReview.mutateAsync({ stationId, rating, comment: comment || undefined });
      setRating(0); setComment(''); onClose();
    };

    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.title}>Rate {stationName}</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Text style={[styles.star, star <= rating && styles.starActive]}>{star <= rating ? '★' : '☆'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} value={comment} onChangeText={setComment} placeholder="Share your experience (optional)" placeholderTextColor={colors.textTertiary} multiline numberOfLines={3} />
            <View style={styles.actions}>
              <Button title="Submit Review" onPress={handleSubmit} loading={createReview.isPending} disabled={rating === 0} />
              <Button title="Cancel" onPress={onClose} variant="ghost" />
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl },
    title: { ...typography.h3, color: colors.text, textAlign: 'center' },
    stars: { flexDirection: 'row', justifyContent: 'center', marginVertical: spacing.lg, gap: spacing.md },
    star: { fontSize: 36, color: colors.border },
    starActive: { color: colors.warning },
    input: { backgroundColor: colors.surfaceSecondary, borderRadius: borderRadius.md, padding: spacing.md, ...typography.body, color: colors.text, minHeight: 80, textAlignVertical: 'top' },
    actions: { marginTop: spacing.lg, gap: spacing.sm },
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add ReviewModal with star rating and comment input
  ```

---

## Task 11: Onboarding Screen

- [ ] **Step 1: Implement**
  - File: `src/driver/screens/OnboardingScreen.tsx`
  ```typescript
  import React, { useState } from 'react';
  import { View, Text, StyleSheet } from 'react-native';
  import { Button } from '@/core/components';
  import { locationService } from '@/core/services/locationService';
  import { notificationService } from '@/core/services/notificationService';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  const STEPS = [
    { title: 'Add Your Vehicle', description: 'Tell us what you drive so we can find the right chargers for you.', icon: '🚗', action: 'Add Vehicle' },
    { title: 'Enable Location', description: 'Find charging stations near you and get directions.', icon: '📍', action: 'Enable Location' },
    { title: 'Stay Notified', description: 'Get alerts when your charger is ready or your session ends.', icon: '🔔', action: 'Enable Notifications' },
  ];

  export function OnboardingScreen({ navigation }: any) {
    const [currentStep, setCurrentStep] = useState(0);

    const handleAction = async () => {
      if (currentStep === 0) {
        navigation.navigate('AddVehicle');
        setCurrentStep(1);
      } else if (currentStep === 1) {
        await locationService.requestPermission();
        setCurrentStep(2);
      } else if (currentStep === 2) {
        await notificationService.requestPermission();
        navigation.replace('DriverTabs');
      }
    };

    const step = STEPS[currentStep];

    return (
      <View style={styles.container}>
        <View style={styles.progress}>
          {STEPS.map((_, i) => <View key={i} style={[styles.dot, i <= currentStep && styles.dotActive]} />)}
        </View>
        <View style={styles.content}>
          <Text style={styles.icon}>{step.icon}</Text>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.description}>{step.description}</Text>
        </View>
        <View style={styles.actions}>
          <Button title={step.action} onPress={handleAction} size="lg" />
          <Button title="Skip" onPress={() => navigation.replace('DriverTabs')} variant="ghost" />
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, justifyContent: 'space-between' },
    progress: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, paddingTop: spacing.xl },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
    dotActive: { backgroundColor: colors.primary, width: 24 },
    content: { alignItems: 'center' },
    icon: { fontSize: 64, marginBottom: spacing.lg },
    title: { ...typography.h2, color: colors.text, textAlign: 'center' },
    description: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md, maxWidth: 300 },
    actions: { gap: spacing.sm },
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add OnboardingScreen with vehicle, location, and notification setup steps
  ```

---

## Task 12: Integration Test

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
  chore: verify driver profile feature — all tests pass
  ```

---

**Total: 12 tasks, ~32 steps**
