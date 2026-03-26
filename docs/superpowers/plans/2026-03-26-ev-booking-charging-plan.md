# Booking & Charging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the full booking flow (select connector, time slot, confirm) and live charging session screen with real-time kWh/cost tracking, booking management, and push notifications.
**Architecture:** BookingScreen guides users through connector selection and scheduling. BookingService creates bookings via provider adapters and syncs to Supabase. ChargingSessionScreen polls for live updates via Supabase Realtime subscriptions. Push notifications via expo-notifications for booking reminders and charging completion.
**Tech Stack:** React Native, Supabase Realtime, expo-notifications, Zustand, React Query, Animated API

---

## File Structure

```
src/
├── core/
│   ├── services/
│   │   ├── bookingService.ts
│   │   ├── chargingService.ts
│   │   └── notificationService.ts
│   ├── queries/
│   │   ├── useBookings.ts
│   │   ├── useChargingSession.ts
│   │   └── useCreateBooking.ts
│   └── stores/
│       └── bookingStore.ts (update)
├── driver/
│   ├── screens/
│   │   ├── BookingScreen.tsx
│   │   ├── ChargingSessionScreen.tsx
│   │   ├── BookingsListScreen.tsx
│   │   └── BookingDetailScreen.tsx
│   └── components/
│       ├── ConnectorSelector.tsx
│       ├── TimeSlotPicker.tsx
│       ├── PriceEstimate.tsx
│       ├── ChargingProgress.tsx
│       └── BookingCard.tsx
└── __tests__/
    ├── bookingService.test.ts
    ├── chargingService.test.ts
    ├── BookingScreen.test.tsx
    └── BookingCard.test.tsx
```

---

## Task 1: Booking Service

- [ ] **Step 1: Write test**
  - File: `__tests__/bookingService.test.ts`
  ```typescript
  import { bookingService } from '@/core/services/bookingService';

  jest.mock('@/core/config/supabase', () => ({
    supabase: {
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: 'b1', status: 'confirmed' }, error: null }) }) }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({ data: [{ id: 'b1', status: 'confirmed' }], error: null }),
            single: jest.fn().mockResolvedValue({ data: { id: 'b1', status: 'confirmed' }, error: null }),
          }),
        }),
        update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: null, error: null }) }),
      }),
    },
  }));

  describe('bookingService', () => {
    it('creates a booking', async () => {
      const booking = await bookingService.createBooking({
        userId: 'u1', connectorId: 'c1', stationId: 's1', vehicleId: 'v1',
        scheduledStart: new Date().toISOString(), scheduledEnd: new Date().toISOString(),
      });
      expect(booking).toHaveProperty('id');
    });
    it('fetches user bookings', async () => {
      const bookings = await bookingService.getUserBookings('u1');
      expect(Array.isArray(bookings)).toBe(true);
    });
    it('cancels a booking', async () => {
      await expect(bookingService.cancelBooking('b1')).resolves.not.toThrow();
    });
  });
  ```

- [ ] **Step 2: Verify fails**
  ```bash
  npx jest __tests__/bookingService.test.ts
  ```

- [ ] **Step 3: Implement**
  - File: `src/core/services/bookingService.ts`
  ```typescript
  import { supabase } from '../config/supabase';
  import type { Booking } from '../types/booking';
  import { SERVICE_FEE_EGP } from '../config/constants';

  interface CreateBookingInput {
    userId: string;
    connectorId: string;
    stationId: string;
    vehicleId?: string;
    fleetId?: string;
    scheduledStart: string;
    scheduledEnd: string;
  }

  export const bookingService = {
    async createBooking(input: CreateBookingInput): Promise<Booking> {
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: input.userId,
          connector_id: input.connectorId,
          station_id: input.stationId,
          vehicle_id: input.vehicleId || null,
          fleet_id: input.fleetId || null,
          status: 'confirmed',
          scheduled_start: input.scheduledStart,
          scheduled_end: input.scheduledEnd,
        })
        .select('*, station:stations(*, provider:providers(*)), connector:connectors(*)')
        .single();
      if (error) throw error;
      return data;
    },

    async getUserBookings(userId: string, status?: string): Promise<Booking[]> {
      let query = supabase
        .from('bookings')
        .select('*, station:stations(*, provider:providers(*)), connector:connectors(*)')
        .eq('user_id', userId)
        .order('scheduled_start', { ascending: false });
      if (status) query = query.eq('status', status) as any;
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async getBookingById(bookingId: string): Promise<Booking | null> {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, station:stations(*, provider:providers(*)), connector:connectors(*)')
        .eq('id', bookingId)
        .single();
      if (error) return null;
      return data;
    },

    async cancelBooking(bookingId: string): Promise<void> {
      const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
      if (error) throw error;
    },

    async activateBooking(bookingId: string): Promise<void> {
      const { error } = await supabase.from('bookings').update({ status: 'active' }).eq('id', bookingId);
      if (error) throw error;
    },

    estimateCost(pricePerKwh: number, estimatedKwh: number, isFleet: boolean): { providerCost: number; serviceFee: number; total: number } {
      const providerCost = pricePerKwh * estimatedKwh;
      const serviceFee = isFleet ? 0 : SERVICE_FEE_EGP;
      return { providerCost, serviceFee, total: providerCost + serviceFee };
    },
  };
  ```

- [ ] **Step 4: Verify passes**
  ```bash
  npx jest __tests__/bookingService.test.ts
  ```

- [ ] **Step 5: Commit**
  ```
  feat: add booking service with create, cancel, list, and cost estimation
  ```

---

## Task 2: Charging Service

- [ ] **Step 1: Write test**
  - File: `__tests__/chargingService.test.ts`
  ```typescript
  import { chargingService } from '@/core/services/chargingService';

  jest.mock('@/core/config/supabase', () => ({
    supabase: {
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: 's1', kwh_delivered: 0 }, error: null }) }) }),
        update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: { id: 's1', kwh_delivered: 25.5, cost_total: 11.275 }, error: null }) }),
        select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: 's1' }, error: null }) }) }),
      }),
      channel: jest.fn().mockReturnValue({ on: jest.fn().mockReturnValue({ subscribe: jest.fn() }), unsubscribe: jest.fn() }),
    },
  }));

  describe('chargingService', () => {
    it('starts a charging session', async () => {
      const session = await chargingService.startSession({ bookingId: 'b1', userId: 'u1', connectorId: 'c1' });
      expect(session).toHaveProperty('id');
    });
  });
  ```

- [ ] **Step 2: Verify fails**

- [ ] **Step 3: Implement**
  - File: `src/core/services/chargingService.ts`
  ```typescript
  import { supabase } from '../config/supabase';
  import type { ChargingSession } from '../types/booking';
  import { SERVICE_FEE_EGP } from '../config/constants';

  interface StartSessionInput { bookingId: string; userId: string; connectorId: string; }

  export const chargingService = {
    async startSession(input: StartSessionInput): Promise<ChargingSession> {
      const { data, error } = await supabase
        .from('charging_sessions')
        .insert({
          booking_id: input.bookingId,
          user_id: input.userId,
          connector_id: input.connectorId,
          start_time: new Date().toISOString(),
          kwh_delivered: 0,
          cost_provider: 0,
          cost_service_fee: SERVICE_FEE_EGP,
          cost_total: 0,
          payment_status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async stopSession(sessionId: string, kwhDelivered: number, pricePerKwh: number, isFleet: boolean): Promise<ChargingSession> {
      const costProvider = kwhDelivered * pricePerKwh;
      const serviceFee = isFleet ? 0 : SERVICE_FEE_EGP;
      const costTotal = costProvider + serviceFee;

      const { data, error } = await supabase
        .from('charging_sessions')
        .update({
          end_time: new Date().toISOString(),
          kwh_delivered: kwhDelivered,
          cost_provider: costProvider,
          cost_service_fee: serviceFee,
          cost_total: costTotal,
          payment_status: 'completed',
        })
        .eq('id', sessionId);
      if (error) throw error;
      return data as any;
    },

    async getActiveSession(userId: string): Promise<ChargingSession | null> {
      const { data, error } = await supabase
        .from('charging_sessions')
        .select('*')
        .eq('user_id', userId)
        .is('end_time', null)
        .single();
      if (error) return null;
      return data;
    },

    subscribeToSession(sessionId: string, onUpdate: (session: ChargingSession) => void) {
      const channel = supabase
        .channel(`session-${sessionId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'charging_sessions', filter: `id=eq.${sessionId}` },
          (payload) => onUpdate(payload.new as ChargingSession))
        .subscribe();
      return () => { channel.unsubscribe(); };
    },
  };
  ```

- [ ] **Step 4: Verify passes**
  ```bash
  npx jest __tests__/chargingService.test.ts
  ```

- [ ] **Step 5: Commit**
  ```
  feat: add charging service with start/stop, active session, and realtime subscription
  ```

---

## Task 3: React Query Hooks for Bookings

- [ ] **Step 1: Implement useBookings**
  - File: `src/core/queries/useBookings.ts`
  ```typescript
  import { useQuery } from '@tanstack/react-query';
  import { bookingService } from '../services/bookingService';
  import { useAuthStore } from '../stores/authStore';

  export function useBookings(status?: string) {
    const userId = useAuthStore((s) => s.user?.id);
    return useQuery({
      queryKey: ['bookings', userId, status],
      queryFn: () => bookingService.getUserBookings(userId!, status),
      enabled: !!userId,
    });
  }

  export function useBookingDetail(bookingId: string | null) {
    return useQuery({
      queryKey: ['booking', bookingId],
      queryFn: () => bookingService.getBookingById(bookingId!),
      enabled: !!bookingId,
    });
  }
  ```

- [ ] **Step 2: Implement useCreateBooking**
  - File: `src/core/queries/useCreateBooking.ts`
  ```typescript
  import { useMutation, useQueryClient } from '@tanstack/react-query';
  import { bookingService } from '../services/bookingService';
  import { useAuthStore } from '../stores/authStore';

  export function useCreateBooking() {
    const userId = useAuthStore((s) => s.user?.id);
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (input: { connectorId: string; stationId: string; vehicleId?: string; scheduledStart: string; scheduledEnd: string }) =>
        bookingService.createBooking({ ...input, userId: userId! }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
      },
    });
  }

  export function useCancelBooking() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (bookingId: string) => bookingService.cancelBooking(bookingId),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
    });
  }
  ```

- [ ] **Step 3: Implement useChargingSession**
  - File: `src/core/queries/useChargingSession.ts`
  ```typescript
  import { useQuery } from '@tanstack/react-query';
  import { useEffect, useState } from 'react';
  import { chargingService } from '../services/chargingService';
  import { useAuthStore } from '../stores/authStore';
  import type { ChargingSession } from '../types/booking';
  import { CHARGING_POLL_MS } from '../config/constants';

  export function useActiveSession() {
    const userId = useAuthStore((s) => s.user?.id);
    return useQuery({
      queryKey: ['activeSession', userId],
      queryFn: () => chargingService.getActiveSession(userId!),
      enabled: !!userId,
      refetchInterval: CHARGING_POLL_MS,
    });
  }

  export function useRealtimeSession(sessionId: string | null) {
    const [session, setSession] = useState<ChargingSession | null>(null);

    useEffect(() => {
      if (!sessionId) return;
      const unsubscribe = chargingService.subscribeToSession(sessionId, setSession);
      return unsubscribe;
    }, [sessionId]);

    return session;
  }
  ```

- [ ] **Step 4: Commit**
  ```
  feat: add React Query hooks for bookings, create/cancel mutations, and realtime session
  ```

---

## Task 4: Connector Selector Component

- [ ] **Step 1: Implement**
  - File: `src/driver/components/ConnectorSelector.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
  import { colors } from '@/core/theme/colors';
  import { spacing, borderRadius } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';
  import { formatPricePerKWh } from '@/core/utils/formatCurrency';
  import type { Connector } from '@/core/types/station';

  interface Props { connectors: Connector[]; selectedId: string | null; onSelect: (connector: Connector) => void; }

  export function ConnectorSelector({ connectors, selectedId, onSelect }: Props) {
    const available = connectors.filter(c => c.status === 'available');
    return (
      <View>
        <Text style={styles.label}>Select Connector</Text>
        {available.length === 0 && <Text style={styles.noAvailable}>No connectors available</Text>}
        {available.map((c) => (
          <TouchableOpacity key={c.id} style={[styles.option, selectedId === c.id && styles.optionSelected]} onPress={() => onSelect(c)}>
            <View style={styles.typeTag}><Text style={styles.typeText}>{c.type}</Text></View>
            <View style={styles.details}>
              <Text style={styles.power}>{c.power_kw} kW</Text>
              <Text style={styles.price}>{formatPricePerKWh(c.price_per_kwh)}</Text>
            </View>
            <View style={[styles.radio, selectedId === c.id && styles.radioSelected]} />
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  const styles = StyleSheet.create({
    label: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.sm },
    noAvailable: { ...typography.body, color: colors.error, fontStyle: 'italic' },
    option: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, marginBottom: spacing.sm, backgroundColor: colors.surface },
    optionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    typeTag: { backgroundColor: colors.primaryDark, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 6, marginRight: spacing.md },
    typeText: { color: colors.white, fontWeight: '700', fontSize: 13 },
    details: { flex: 1 },
    power: { ...typography.bodyBold, color: colors.text, fontSize: 15 },
    price: { ...typography.caption, color: colors.textSecondary },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border },
    radioSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add ConnectorSelector component for booking flow
  ```

---

## Task 5: Time Slot Picker

- [ ] **Step 1: Implement**
  - File: `src/driver/components/TimeSlotPicker.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
  import { colors } from '@/core/theme/colors';
  import { spacing, borderRadius } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export type TimeSlotOption = 'now' | '30min' | '1hr' | '2hr';

  const OPTIONS: { key: TimeSlotOption; label: string; description: string }[] = [
    { key: 'now', label: 'Now', description: 'Start charging immediately' },
    { key: '30min', label: '30 min', description: 'Reserve for 30 minutes' },
    { key: '1hr', label: '1 hour', description: 'Reserve for 1 hour' },
    { key: '2hr', label: '2 hours', description: 'Reserve for 2 hours' },
  ];

  interface Props { selected: TimeSlotOption; onSelect: (slot: TimeSlotOption) => void; }

  export function TimeSlotPicker({ selected, onSelect }: Props) {
    return (
      <View>
        <Text style={styles.label}>When</Text>
        <View style={styles.grid}>
          {OPTIONS.map((opt) => (
            <TouchableOpacity key={opt.key} style={[styles.option, selected === opt.key && styles.optionSelected]} onPress={() => onSelect(opt.key)}>
              <Text style={[styles.optionLabel, selected === opt.key && styles.labelSelected]}>{opt.label}</Text>
              <Text style={[styles.optionDesc, selected === opt.key && styles.descSelected]}>{opt.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    label: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.sm },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    option: { flex: 1, minWidth: '45%', padding: spacing.md, borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, backgroundColor: colors.surface },
    optionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    optionLabel: { ...typography.bodyBold, color: colors.text, fontSize: 15 },
    labelSelected: { color: colors.primaryDark },
    optionDesc: { ...typography.small, color: colors.textTertiary, marginTop: 2 },
    descSelected: { color: colors.primaryDark },
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add TimeSlotPicker component with now, 30min, 1hr, 2hr options
  ```

---

## Task 6: Price Estimate Component

- [ ] **Step 1: Implement**
  - File: `src/driver/components/PriceEstimate.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, StyleSheet } from 'react-native';
  import { Card } from '@/core/components';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';
  import { formatEGP } from '@/core/utils/formatCurrency';

  interface Props { providerCost: number; serviceFee: number; total: number; estimatedKwh: number; }

  export function PriceEstimate({ providerCost, serviceFee, total, estimatedKwh }: Props) {
    return (
      <Card style={styles.card}>
        <Text style={styles.title}>Price Estimate</Text>
        <View style={styles.row}><Text style={styles.label}>Charging ({estimatedKwh.toFixed(1)} kWh)</Text><Text style={styles.value}>{formatEGP(providerCost)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Service fee</Text><Text style={styles.value}>{formatEGP(serviceFee)}</Text></View>
        <View style={styles.divider} />
        <View style={styles.row}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>{formatEGP(total)}</Text></View>
      </Card>
    );
  }

  const styles = StyleSheet.create({
    card: { backgroundColor: colors.primaryLight },
    title: { ...typography.bodyBold, color: colors.primaryDark, marginBottom: spacing.sm },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    label: { ...typography.caption, color: colors.textSecondary },
    value: { ...typography.caption, color: colors.text, fontWeight: '600' },
    divider: { height: 1, backgroundColor: colors.primary, opacity: 0.2, marginVertical: spacing.sm },
    totalLabel: { ...typography.bodyBold, color: colors.primaryDark },
    totalValue: { ...typography.bodyBold, color: colors.primaryDark, fontSize: 18 },
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add PriceEstimate component showing cost breakdown
  ```

---

## Task 7: Booking Screen

- [ ] **Step 1: Implement**
  - File: `src/driver/screens/BookingScreen.tsx`
  ```typescript
  import React, { useState, useMemo } from 'react';
  import { View, ScrollView, StyleSheet, Alert } from 'react-native';
  import { Header, Button, LoadingScreen } from '@/core/components';
  import { ConnectorSelector } from '../components/ConnectorSelector';
  import { TimeSlotPicker, TimeSlotOption } from '../components/TimeSlotPicker';
  import { PriceEstimate } from '../components/PriceEstimate';
  import { useStationDetail } from '@/core/queries/useStationDetail';
  import { useCreateBooking } from '@/core/queries/useCreateBooking';
  import { bookingService } from '@/core/services/bookingService';
  import { useBookingStore } from '@/core/stores/bookingStore';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import type { Connector } from '@/core/types/station';

  function getTimeSlotDates(slot: TimeSlotOption): { start: string; end: string } {
    const now = new Date();
    const start = now.toISOString();
    const durations: Record<TimeSlotOption, number> = { now: 60, '30min': 30, '1hr': 60, '2hr': 120 };
    const end = new Date(now.getTime() + durations[slot] * 60000).toISOString();
    return { start, end };
  }

  export function BookingScreen({ route, navigation }: any) {
    const { stationId } = route.params;
    const { data: station, isLoading } = useStationDetail(stationId);
    const createBooking = useCreateBooking();
    const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
    const [timeSlot, setTimeSlot] = useState<TimeSlotOption>('now');

    const estimate = useMemo(() => {
      if (!selectedConnector) return null;
      const estimatedKwh = timeSlot === 'now' ? 30 : timeSlot === '30min' ? 15 : timeSlot === '1hr' ? 30 : 50;
      return bookingService.estimateCost(selectedConnector.price_per_kwh, estimatedKwh, false);
    }, [selectedConnector, timeSlot]);

    const handleConfirm = async () => {
      if (!selectedConnector) { Alert.alert('Error', 'Please select a connector'); return; }
      const { start, end } = getTimeSlotDates(timeSlot);
      try {
        const booking = await createBooking.mutateAsync({ connectorId: selectedConnector.id, stationId, scheduledStart: start, scheduledEnd: end });
        navigation.replace('BookingDetail', { bookingId: booking.id });
      } catch (e: any) {
        Alert.alert('Booking Failed', e.message);
      }
    };

    if (isLoading || !station) return <LoadingScreen />;

    return (
      <View style={styles.container}>
        <Header title="Book Charger" onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.content}>
          <ConnectorSelector connectors={station.connectors || []} selectedId={selectedConnector?.id || null} onSelect={setSelectedConnector} />
          <View style={styles.spacer} />
          <TimeSlotPicker selected={timeSlot} onSelect={setTimeSlot} />
          <View style={styles.spacer} />
          {estimate && (
            <PriceEstimate
              providerCost={estimate.providerCost}
              serviceFee={estimate.serviceFee}
              total={estimate.total}
              estimatedKwh={timeSlot === 'now' ? 30 : timeSlot === '30min' ? 15 : timeSlot === '1hr' ? 30 : 50}
            />
          )}
        </ScrollView>
        <View style={styles.footer}>
          <Button title="Confirm Booking" onPress={handleConfirm} loading={createBooking.isPending} size="lg" disabled={!selectedConnector} />
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: 100 },
    spacer: { height: spacing.lg },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add BookingScreen with connector selection, time slot, and price estimate
  ```

---

## Task 8: Charging Progress Component

- [ ] **Step 1: Implement**
  - File: `src/driver/components/ChargingProgress.tsx`
  ```typescript
  import React, { useEffect, useRef } from 'react';
  import { View, Text, StyleSheet, Animated } from 'react-native';
  import { colors } from '@/core/theme/colors';
  import { spacing, borderRadius } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';
  import { formatEGP, formatKWh } from '@/core/utils/formatCurrency';

  interface Props { kwhDelivered: number; costTotal: number; targetKwh: number; elapsedMinutes: number; estimatedMinutesRemaining: number; }

  export function ChargingProgress({ kwhDelivered, costTotal, targetKwh, elapsedMinutes, estimatedMinutesRemaining }: Props) {
    const progress = Math.min(kwhDelivered / targetKwh, 1);
    const animatedWidth = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(animatedWidth, { toValue: progress, duration: 500, useNativeDriver: false }).start();
    }, [progress]);

    return (
      <View style={styles.container}>
        <View style={styles.circle}>
          <Text style={styles.percentage}>{Math.round(progress * 100)}%</Text>
          <Text style={styles.kwhText}>{formatKWh(kwhDelivered)}</Text>
        </View>

        <View style={styles.progressBarContainer}>
          <Animated.View style={[styles.progressBar, { width: animatedWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatEGP(costTotal)}</Text>
            <Text style={styles.statLabel}>Cost so far</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{elapsedMinutes} min</Text>
            <Text style={styles.statLabel}>Elapsed</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{estimatedMinutesRemaining} min</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { alignItems: 'center', padding: spacing.lg },
    circle: { width: 160, height: 160, borderRadius: 80, borderWidth: 8, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
    percentage: { ...typography.h1, color: colors.primary, fontSize: 40 },
    kwhText: { ...typography.caption, color: colors.textSecondary },
    progressBarContainer: { width: '100%', height: 8, backgroundColor: colors.primaryLight, borderRadius: borderRadius.full, marginBottom: spacing.lg },
    progressBar: { height: '100%', backgroundColor: colors.primary, borderRadius: borderRadius.full },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
    stat: { alignItems: 'center' },
    statValue: { ...typography.bodyBold, color: colors.text },
    statLabel: { ...typography.small, color: colors.textSecondary },
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add ChargingProgress component with animated progress and live stats
  ```

---

## Task 9: Charging Session Screen

- [ ] **Step 1: Implement**
  - File: `src/driver/screens/ChargingSessionScreen.tsx`
  ```typescript
  import React, { useState, useEffect, useCallback } from 'react';
  import { View, Text, StyleSheet, Alert } from 'react-native';
  import { Header, Button, Card } from '@/core/components';
  import { ChargingProgress } from '../components/ChargingProgress';
  import { useRealtimeSession } from '@/core/queries/useChargingSession';
  import { chargingService } from '@/core/services/chargingService';
  import { useBookingStore } from '@/core/stores/bookingStore';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function ChargingSessionScreen({ route, navigation }: any) {
    const { sessionId, connectorPowerKw, pricePerKwh } = route.params;
    const realtimeSession = useRealtimeSession(sessionId);
    const [localKwh, setLocalKwh] = useState(0);
    const [localCost, setLocalCost] = useState(0);
    const [startTime] = useState(Date.now());
    const [isStopping, setIsStopping] = useState(false);

    // Simulate charging progress locally (in real app, comes from provider via Edge Function)
    useEffect(() => {
      const interval = setInterval(() => {
        setLocalKwh(prev => {
          const newKwh = prev + (connectorPowerKw / 3600) * 5; // 5 second intervals
          setLocalCost(newKwh * pricePerKwh + 10);
          return newKwh;
        });
      }, 5000);
      return () => clearInterval(interval);
    }, [connectorPowerKw, pricePerKwh]);

    // Update from realtime if available
    useEffect(() => {
      if (realtimeSession) {
        setLocalKwh(realtimeSession.kwh_delivered);
        setLocalCost(realtimeSession.cost_total);
      }
    }, [realtimeSession]);

    const handleStop = useCallback(async () => {
      Alert.alert('Stop Charging', 'Are you sure you want to stop?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Stop', style: 'destructive', onPress: async () => {
          setIsStopping(true);
          try {
            await chargingService.stopSession(sessionId, localKwh, pricePerKwh, false);
            navigation.replace('BookingsTab');
          } catch (e: any) { Alert.alert('Error', e.message); setIsStopping(false); }
        }},
      ]);
    }, [sessionId, localKwh, pricePerKwh, navigation]);

    const elapsed = Math.round((Date.now() - startTime) / 60000);
    const targetKwh = 50; // Could be from vehicle battery capacity
    const remaining = Math.max(0, Math.round(((targetKwh - localKwh) / (connectorPowerKw || 1)) * 60));

    return (
      <View style={styles.container}>
        <Header title="Charging" />
        <View style={styles.body}>
          <ChargingProgress kwhDelivered={localKwh} costTotal={localCost} targetKwh={targetKwh} elapsedMinutes={elapsed} estimatedMinutesRemaining={remaining} />

          <Card style={styles.whileYouWait}>
            <Text style={styles.waitTitle}>While you wait</Text>
            <Text style={styles.waitText}>Explore nearby amenities and offers</Text>
          </Card>
        </View>
        <View style={styles.footer}>
          <Button title="Stop Charging" onPress={handleStop} variant="outline" size="lg" loading={isStopping} style={{ borderColor: colors.error }} textStyle={{ color: colors.error }} />
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    body: { flex: 1, padding: spacing.md },
    whileYouWait: { marginTop: spacing.lg },
    waitTitle: { ...typography.bodyBold, color: colors.text },
    waitText: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
    footer: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add ChargingSessionScreen with live progress, cost tracking, and stop button
  ```

---

## Task 10: Booking Card Component

- [ ] **Step 1: Write test**
  - File: `__tests__/BookingCard.test.tsx`
  ```typescript
  import React from 'react';
  import { render } from '@testing-library/react-native';
  import { BookingCard } from '@/driver/components/BookingCard';

  const mockBooking = { id: 'b1', status: 'confirmed', scheduled_start: '2026-03-26T10:00:00Z', scheduled_end: '2026-03-26T11:00:00Z', station: { name: 'IKARUS Maadi', provider: { name: 'IKARUS' } }, connector: { type: 'CCS', power_kw: 60 } } as any;

  describe('BookingCard', () => {
    it('renders station name', () => {
      const { getByText } = render(<BookingCard booking={mockBooking} onPress={() => {}} />);
      expect(getByText('IKARUS Maadi')).toBeTruthy();
    });
    it('shows status', () => {
      const { getByText } = render(<BookingCard booking={mockBooking} onPress={() => {}} />);
      expect(getByText('Confirmed')).toBeTruthy();
    });
  });
  ```

- [ ] **Step 2: Implement**
  - File: `src/driver/components/BookingCard.tsx`
  ```typescript
  import React from 'react';
  import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
  import { Card, Badge } from '@/core/components';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';
  import type { Booking, BookingStatus } from '@/core/types/booking';

  const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string }> = {
    pending: { label: 'Pending', color: colors.warning },
    confirmed: { label: 'Confirmed', color: colors.primary },
    active: { label: 'Charging', color: colors.info },
    completed: { label: 'Completed', color: colors.textTertiary },
    cancelled: { label: 'Cancelled', color: colors.error },
    no_show: { label: 'No Show', color: colors.error },
  };

  interface Props { booking: Booking; onPress: () => void; }

  export function BookingCard({ booking, onPress }: Props) {
    const config = STATUS_CONFIG[booking.status];
    const date = new Date(booking.scheduled_start);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.name}>{booking.station?.name}</Text>
              <Text style={styles.provider}>{booking.station?.provider?.name} · {booking.connector?.type} {booking.connector?.power_kw}kW</Text>
              <Text style={styles.time}>{dateStr} at {timeStr}</Text>
            </View>
            <Badge label={config.label} backgroundColor={config.color} />
          </View>
        </Card>
      </TouchableOpacity>
    );
  }

  const styles = StyleSheet.create({
    card: { marginHorizontal: spacing.md, marginVertical: spacing.xs },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    info: { flex: 1, marginRight: spacing.md },
    name: { ...typography.bodyBold, color: colors.text },
    provider: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    time: { ...typography.caption, color: colors.accent, marginTop: 4 },
  });
  ```

- [ ] **Step 3: Commit**
  ```
  feat: add BookingCard component with status badge and scheduling info
  ```

---

## Task 11: Bookings List Screen

- [ ] **Step 1: Implement**
  - File: `src/driver/screens/BookingsListScreen.tsx`
  ```typescript
  import React, { useState } from 'react';
  import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
  import { Header, LoadingScreen } from '@/core/components';
  import { BookingCard } from '../components/BookingCard';
  import { useBookings } from '@/core/queries/useBookings';
  import { colors } from '@/core/theme/colors';
  import { spacing, borderRadius } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  const TABS = [
    { key: undefined, label: 'All' },
    { key: 'confirmed', label: 'Upcoming' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Past' },
  ];

  export function BookingsListScreen({ navigation }: any) {
    const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
    const { data: bookings, isLoading } = useBookings(activeTab);

    return (
      <View style={styles.container}>
        <Header title="My Bookings" />
        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <TouchableOpacity key={tab.label} style={[styles.tab, activeTab === tab.key && styles.tabActive]} onPress={() => setActiveTab(tab.key)}>
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {isLoading ? <LoadingScreen /> : (
          <FlatList
            data={bookings || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <BookingCard booking={item} onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id })} />
            )}
            ListEmptyComponent={<Text style={styles.empty}>No bookings yet. Find a station and charge!</Text>}
            contentContainerStyle={{ paddingVertical: spacing.md }}
          />
        )}
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    tabs: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
    tab: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    tabText: { ...typography.caption, color: colors.textSecondary },
    tabTextActive: { color: colors.white, fontWeight: '600' },
    empty: { ...typography.body, color: colors.textTertiary, textAlign: 'center', padding: spacing.xl },
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add BookingsListScreen with tab filtering for upcoming/active/past
  ```

---

## Task 12: Booking Detail Screen

- [ ] **Step 1: Implement**
  - File: `src/driver/screens/BookingDetailScreen.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
  import { Header, Card, Badge, Button, LoadingScreen } from '@/core/components';
  import { useBookingDetail } from '@/core/queries/useBookings';
  import { useCancelBooking } from '@/core/queries/useCreateBooking';
  import { chargingService } from '@/core/services/chargingService';
  import { bookingService } from '@/core/services/bookingService';
  import { useAuthStore } from '@/core/stores/authStore';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function BookingDetailScreen({ route, navigation }: any) {
    const { bookingId } = route.params;
    const { data: booking, isLoading } = useBookingDetail(bookingId);
    const cancelBooking = useCancelBooking();
    const userId = useAuthStore((s) => s.user?.id);

    if (isLoading || !booking) return <LoadingScreen />;

    const handleCancel = () => {
      Alert.alert('Cancel Booking', 'Are you sure?', [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: () => cancelBooking.mutate(bookingId) },
      ]);
    };

    const handleStartCharging = async () => {
      try {
        await bookingService.activateBooking(bookingId);
        const session = await chargingService.startSession({ bookingId, userId: userId!, connectorId: booking.connector_id });
        navigation.replace('ChargingSession', {
          sessionId: session.id,
          connectorPowerKw: booking.connector?.power_kw || 60,
          pricePerKwh: booking.connector?.price_per_kwh || 0.05,
        });
      } catch (e: any) { Alert.alert('Error', e.message); }
    };

    const date = new Date(booking.scheduled_start);

    return (
      <View style={styles.container}>
        <Header title="Booking Details" onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.content}>
          <Card>
            <Text style={styles.stationName}>{booking.station?.name}</Text>
            <Text style={styles.provider}>{booking.station?.provider?.name}</Text>
            <Text style={styles.address}>{booking.station?.address}</Text>
          </Card>
          <Card style={styles.section}>
            <View style={styles.detailRow}><Text style={styles.label}>Connector</Text><Text style={styles.value}>{booking.connector?.type} · {booking.connector?.power_kw}kW</Text></View>
            <View style={styles.detailRow}><Text style={styles.label}>Date</Text><Text style={styles.value}>{date.toLocaleDateString()}</Text></View>
            <View style={styles.detailRow}><Text style={styles.label}>Time</Text><Text style={styles.value}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text></View>
            <View style={styles.detailRow}><Text style={styles.label}>Status</Text><Badge label={booking.status} backgroundColor={colors.primary} /></View>
          </Card>
          {booking.status === 'confirmed' && (
            <View style={styles.actions}>
              <Button title="Start Charging" onPress={handleStartCharging} size="lg" />
              <Button title="Cancel Booking" onPress={handleCancel} variant="outline" size="lg" style={{ borderColor: colors.error }} textStyle={{ color: colors.error }} loading={cancelBooking.isPending} />
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: spacing.xxl },
    stationName: { ...typography.h3, color: colors.text },
    provider: { ...typography.caption, color: colors.primary, marginTop: 2 },
    address: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
    section: { marginTop: spacing.md },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    label: { ...typography.caption, color: colors.textSecondary },
    value: { ...typography.bodyBold, color: colors.text, fontSize: 14 },
    actions: { gap: spacing.sm, marginTop: spacing.xl },
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add BookingDetailScreen with start charging and cancel actions
  ```

---

## Task 13: Notification Service (Push)

- [ ] **Step 1: Implement**
  - File: `src/core/services/notificationService.ts`
  ```typescript
  import * as Notifications from 'expo-notifications';
  import { Platform } from 'react-native';

  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true }),
  });

  export const notificationService = {
    async requestPermission(): Promise<boolean> {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    },

    async getPushToken(): Promise<string | null> {
      try {
        const { data } = await Notifications.getExpoPushTokenAsync();
        return data;
      } catch { return null; }
    },

    async scheduleBookingReminder(bookingId: string, stationName: string, scheduledStart: string) {
      const triggerDate = new Date(new Date(scheduledStart).getTime() - 10 * 60000); // 10 min before
      if (triggerDate <= new Date()) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Charging Reminder',
          body: `Your charger at ${stationName} is ready in 10 minutes!`,
          data: { bookingId, type: 'booking_reminder' },
        },
        trigger: { date: triggerDate, type: Notifications.SchedulableTriggerInputTypes.DATE },
      });
    },

    async sendChargingComplete(stationName: string, kwhDelivered: number) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Charging Complete',
          body: `${kwhDelivered.toFixed(1)} kWh delivered at ${stationName}. Please move your car.`,
          data: { type: 'charging_complete' },
        },
        trigger: null, // Immediate
      });
    },
  };
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add notification service with booking reminder and charging complete alerts
  ```

---

## Task 14: Update Booking Store

- [ ] **Step 1: Update bookingStore with booking flow state**
  - File: `src/core/stores/bookingStore.ts` (already exists, verify it has needed fields)
  ```typescript
  // Ensure bookingStore has: selectedStation, selectedConnector, activeBooking, activeSession
  // Already implemented in Foundation plan — verify it works with new screens
  ```

- [ ] **Step 2: Commit**
  ```
  chore: verify booking store integration with booking and charging screens
  ```

---

## Task 15: Integration Test

- [ ] **Step 1: Run all tests**
  ```bash
  npx jest --verbose
  ```

- [ ] **Step 2: Verify TypeScript compiles**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 3: Commit**
  ```
  chore: verify booking and charging feature — all tests pass
  ```

---

**Total: 15 tasks, ~40 steps**
