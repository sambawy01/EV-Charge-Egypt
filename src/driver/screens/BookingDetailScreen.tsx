import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
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
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: () => cancelBooking.mutate(bookingId),
      },
    ]);
  };

  const handleStartCharging = async () => {
    try {
      await bookingService.activateBooking(bookingId);
      const session = await chargingService.startSession({
        bookingId,
        userId: userId!,
        connectorId: booking.connector_id,
      });
      navigation.replace('ChargingSession', {
        sessionId: session.id,
        connectorPowerKw: booking.connector?.power_kw || 60,
        pricePerKwh: booking.connector?.price_per_kwh || 0.05,
      });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const date = new Date(booking.scheduled_start);

  return (
    <View style={styles.container}>
      <Header title="Booking Details" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={styles.stationName}>{booking.station?.name}</Text>
          <Text style={styles.provider}>
            {booking.station?.provider?.name}
          </Text>
          <Text style={styles.address}>{booking.station?.address}</Text>
        </Card>
        <Card style={styles.section}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Connector</Text>
            <Text style={styles.value}>
              {booking.connector?.type} · {booking.connector?.power_kw}kW
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{date.toLocaleDateString()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Time</Text>
            <Text style={styles.value}>
              {date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Status</Text>
            <Badge label={booking.status} backgroundColor={colors.primary} />
          </View>
        </Card>
        {booking.status === 'confirmed' && (
          <View style={styles.actions}>
            <Button
              title="Start Charging"
              onPress={handleStartCharging}
              size="lg"
            />
            <Button
              title="Cancel Booking"
              onPress={handleCancel}
              variant="outline"
              size="lg"
              style={{ borderColor: colors.error }}
              textStyle={{ color: colors.error }}
              loading={cancelBooking.isPending}
            />
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
  address: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: { marginTop: spacing.md },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: { ...typography.caption, color: colors.textSecondary },
  value: { ...typography.bodyBold, color: colors.text, fontSize: 14 },
  actions: { gap: spacing.sm, marginTop: spacing.xl },
});
