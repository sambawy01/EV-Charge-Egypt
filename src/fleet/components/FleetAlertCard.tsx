import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/core/theme/colors';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

export function FleetAlertCard({ alerts }: { alerts: string[] }) {
  if (!alerts.length) return null;
  return (
    <View style={styles.container}>
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
    backgroundColor: '#FEF2F2',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  title: { ...(typography.bodyBold as object), color: colors.error, marginBottom: spacing.sm },
  alertRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  dot: { color: colors.error, fontWeight: '700', marginRight: spacing.sm },
  text: { ...(typography.caption as object), color: colors.text, flex: 1 },
});
