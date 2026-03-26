import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Badge } from '@/core/components';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import { formatPricePerKWh } from '@/core/utils/formatCurrency';
import type { Connector, ConnectorStatus } from '@/core/types/station';

const STATUS_CONFIG: Record<ConnectorStatus, { label: string; color: string }> = {
  available: { label: 'Available', color: colors.statusAvailable },
  occupied: { label: 'In Use', color: colors.statusOccupied },
  booked: { label: 'Booked', color: colors.statusPartial },
  offline: { label: 'Offline', color: colors.statusOffline },
};

export function ConnectorRow({ connector }: { connector: Connector }) {
  const config = STATUS_CONFIG[connector.status] || STATUS_CONFIG.offline;
  return (
    <View style={styles.row}>
      <View style={styles.typeBox}>
        <Text style={styles.type}>{connector.type}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.power}>{connector.power_kw} kW</Text>
        <Text style={styles.price}>{formatPricePerKWh(connector.price_per_kwh)}</Text>
      </View>
      <Badge label={config.label} backgroundColor={config.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  typeBox: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  type: { ...typography.bodyBold, color: colors.primaryDark, fontSize: 14 },
  info: { flex: 1 },
  power: { ...typography.bodyBold, color: colors.text, fontSize: 14 },
  price: { ...typography.small, color: colors.textSecondary },
});
