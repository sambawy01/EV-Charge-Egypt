import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/core/components';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

interface Props {
  icon: string;
  value: string;
  label: string;
  trend?: string;
  trendUp?: boolean;
}

export function FleetStatCard({ icon, value, label, trend, trendUp }: Props) {
  return (
    <Card style={styles.card}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {trend && (
        <Text style={[styles.trend, trendUp ? styles.trendUp : styles.trendDown]}>{trend}</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, alignItems: 'center', padding: spacing.md },
  icon: { fontSize: 24, marginBottom: spacing.xs },
  value: { ...(typography.h3 as object), color: colors.text },
  label: { ...(typography.small as object), color: colors.textSecondary, textAlign: 'center' },
  trend: { ...(typography.small as object), fontWeight: '600', marginTop: 4 },
  trendUp: { color: colors.error },
  trendDown: { color: colors.success },
});
