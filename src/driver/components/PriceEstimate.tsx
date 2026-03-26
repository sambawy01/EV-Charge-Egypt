import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/core/components';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import { formatEGP } from '@/core/utils/formatCurrency';

interface Props {
  providerCost: number;
  serviceFee: number;
  total: number;
  estimatedKwh: number;
}

export function PriceEstimate({
  providerCost,
  serviceFee,
  total,
  estimatedKwh,
}: Props) {
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Price Estimate</Text>
      <View style={styles.row}>
        <Text style={styles.label}>
          Charging ({estimatedKwh.toFixed(1)} kWh)
        </Text>
        <Text style={styles.value}>{formatEGP(providerCost)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Service fee</Text>
        <Text style={styles.value}>{formatEGP(serviceFee)}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatEGP(total)}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.primaryLight },
  title: {
    ...typography.bodyBold,
    color: colors.primaryDark,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: { ...typography.caption, color: colors.textSecondary },
  value: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.primary,
    opacity: 0.2,
    marginVertical: spacing.sm,
  },
  totalLabel: { ...typography.bodyBold, color: colors.primaryDark },
  totalValue: {
    ...typography.bodyBold,
    color: colors.primaryDark,
    fontSize: 18,
  },
});
