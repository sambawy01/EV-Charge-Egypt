import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/core/theme/colors';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

interface Props {
  icon: string;
  value: string;
  label: string;
  color?: string;
}

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
  container: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  icon: { fontSize: 24, marginBottom: spacing.xs },
  value: { ...(typography.h3 as object), marginBottom: 2 },
  label: { ...(typography.small as object), color: colors.textSecondary, textAlign: 'center' },
});
