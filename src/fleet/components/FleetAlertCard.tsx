import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, colors } from '@/core/theme';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

export function FleetAlertCard({ alerts }: { alerts: string[] }) {
  const { colors } = useTheme();
  if (!alerts.length) return null;
  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceSecondary }]}>
      <Text style={styles.title}>Alerts</Text>
      {alerts.map((alert, i) => (
        <View key={i} style={styles.alertRow}>
          <Text style={styles.dot}>!</Text>
          <Text style={styles.text}>{alert}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  title: { ...(typography.bodyBold as object), color: colors.error, marginBottom: spacing.sm },
  alertRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  dot: { color: colors.error, fontWeight: '700', marginRight: spacing.sm },
  text: { ...(typography.caption as object), color: colors.text, flex: 1 },
});
