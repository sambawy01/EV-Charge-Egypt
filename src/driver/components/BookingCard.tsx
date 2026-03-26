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

interface Props {
  booking: Booking;
  onPress: () => void;
}

export function BookingCard({ booking, onPress }: Props) {
  const config = STATUS_CONFIG[booking.status];
  const date = new Date(booking.scheduled_start);
  const timeStr = date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateStr = date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.name}>{booking.station?.name}</Text>
            <Text style={styles.provider}>
              {booking.station?.provider?.name} · {booking.connector?.type}{' '}
              {booking.connector?.power_kw}kW
            </Text>
            <Text style={styles.time}>
              {dateStr} at {timeStr}
            </Text>
          </View>
          <Badge label={config.label} backgroundColor={config.color} />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.md, marginVertical: spacing.xs },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  info: { flex: 1, marginRight: spacing.md },
  name: { ...typography.bodyBold, color: colors.text },
  provider: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  time: { ...typography.caption, color: colors.accent, marginTop: 4 },
});
