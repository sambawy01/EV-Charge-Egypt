import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Header, Button, LoadingScreen } from '@/core/components';
import { ConnectorSelector } from '../components/ConnectorSelector';
import { TimeSlotPicker, TimeSlotOption } from '../components/TimeSlotPicker';
import { PriceEstimate } from '../components/PriceEstimate';
import { useStationDetail } from '@/core/queries/useStationDetail';
import { useCreateBooking } from '@/core/queries/useCreateBooking';
import { bookingService } from '@/core/services/bookingService';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import type { Connector } from '@/core/types/station';

function getTimeSlotDates(slot: TimeSlotOption): {
  start: string;
  end: string;
} {
  const now = new Date();
  const start = now.toISOString();
  const durations: Record<TimeSlotOption, number> = {
    now: 60,
    '30min': 30,
    '1hr': 60,
    '2hr': 120,
  };
  const end = new Date(
    now.getTime() + durations[slot] * 60000,
  ).toISOString();
  return { start, end };
}

function getEstimatedKwh(slot: TimeSlotOption): number {
  const map: Record<TimeSlotOption, number> = {
    now: 30,
    '30min': 15,
    '1hr': 30,
    '2hr': 50,
  };
  return map[slot];
}

export function BookingScreen({ route, navigation }: any) {
  const { stationId } = route.params;
  const { data: station, isLoading } = useStationDetail(stationId);
  const createBooking = useCreateBooking();
  const [selectedConnector, setSelectedConnector] =
    useState<Connector | null>(null);
  const [timeSlot, setTimeSlot] = useState<TimeSlotOption>('now');

  const estimate = useMemo(() => {
    if (!selectedConnector) return null;
    const estimatedKwh = getEstimatedKwh(timeSlot);
    return bookingService.estimateCost(
      selectedConnector.price_per_kwh,
      estimatedKwh,
      false,
    );
  }, [selectedConnector, timeSlot]);

  const handleConfirm = async () => {
    if (!selectedConnector) {
      Alert.alert('Error', 'Please select a connector');
      return;
    }
    const { start, end } = getTimeSlotDates(timeSlot);
    try {
      const booking = await createBooking.mutateAsync({
        connectorId: selectedConnector.id,
        stationId,
        scheduledStart: start,
        scheduledEnd: end,
      });
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
        <ConnectorSelector
          connectors={station.connectors || []}
          selectedId={selectedConnector?.id || null}
          onSelect={setSelectedConnector}
        />
        <View style={styles.spacer} />
        <TimeSlotPicker selected={timeSlot} onSelect={setTimeSlot} />
        <View style={styles.spacer} />
        {estimate && (
          <PriceEstimate
            providerCost={estimate.providerCost}
            serviceFee={estimate.serviceFee}
            total={estimate.total}
            estimatedKwh={getEstimatedKwh(timeSlot)}
          />
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title="Confirm Booking"
          onPress={handleConfirm}
          loading={createBooking.isPending}
          size="lg"
          disabled={!selectedConnector}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 100 },
  spacer: { height: spacing.lg },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
