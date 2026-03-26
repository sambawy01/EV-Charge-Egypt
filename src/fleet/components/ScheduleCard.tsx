import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/core/components';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

interface ScheduleItem {
  vehicle: string;
  driver: string;
  station: string;
  time: string;
  reason: string;
}

export function ScheduleCard({ item }: { item: ScheduleItem }) {
  return (
    <Card style={styles.card}>
      <Text style={styles.vehicleName}>{item.vehicle}</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Driver:</Text>
        <Text style={styles.value}>{item.driver}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Station:</Text>
        <Text style={styles.value}>{item.station}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Time:</Text>
        <Text style={styles.value}>{item.time}</Text>
      </View>
      <Text style={styles.reason}>{item.reason}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  vehicleName: { ...(typography.bodyBold as object), color: colors.text, marginBottom: spacing.sm },
  row: { flexDirection: 'row', marginBottom: 2 },
  label: { ...(typography.caption as object), color: colors.textSecondary, width: 60 },
  value: { ...(typography.caption as object), color: colors.text, flex: 1 },
  reason: { ...(typography.small as object), color: colors.accent, fontStyle: 'italic', marginTop: spacing.xs },
});
