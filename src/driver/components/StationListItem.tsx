import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Card } from '@/core/components';
import { Badge } from '@/core/components';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import { formatPricePerKWh } from '@/core/utils/formatCurrency';
import type { Station, StationStatus } from '@/core/types/station';

const STATUS_LABELS: Record<StationStatus, string> = {
  available: 'Available',
  partial: 'Partial',
  occupied: 'Busy',
  offline: 'Offline',
};

const STATUS_COLORS: Record<StationStatus, string> = {
  available: colors.statusAvailable,
  partial: colors.statusPartial,
  occupied: colors.statusOccupied,
  offline: colors.statusOffline,
};

interface Props {
  station: Station;
  onPress: () => void;
}

export function StationListItem({ station, onPress }: Props) {
  const status = station.status || 'offline';
  const cheapest = station.connectors?.length
    ? Math.min(...station.connectors.map((c) => c.price_per_kwh))
    : 0;
  const fastest = station.connectors?.length
    ? Math.max(...station.connectors.map((c) => c.power_kw))
    : 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {station.name}
            </Text>
            <Text style={styles.address} numberOfLines={1}>
              {station.address}
            </Text>
            <View style={styles.meta}>
              <Text style={styles.metaText}>{fastest} kW</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText}>{formatPricePerKWh(cheapest)}</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText}>{station.rating_avg?.toFixed(1)} ★</Text>
            </View>
          </View>
          <View style={styles.right}>
            <Badge
              label={STATUS_LABELS[status]}
              backgroundColor={STATUS_COLORS[status]}
            />
            {station.distance_km != null && (
              <Text style={styles.distance}>{station.distance_km.toFixed(1)} km</Text>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.md, marginVertical: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  info: { flex: 1, marginRight: spacing.md },
  name: { ...typography.bodyBold, color: colors.text },
  address: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  metaText: { ...typography.small, color: colors.textTertiary },
  metaDot: { ...typography.small, color: colors.textTertiary, marginHorizontal: 4 },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  distance: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
});
