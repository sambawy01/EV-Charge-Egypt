import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Header, Card, Button } from '@/core/components';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

const SCHEDULE = [
  { vehicle: 'BYD Atto 3 (ABC-1234)', driver: 'Ahmed M.', station: 'IKARUS Maadi', time: '10:00 PM', savingEGP: 28, reason: 'Off-peak rate 0.04 EGP/kWh — saves 28 EGP vs peak' },
  { vehicle: 'MG ZS EV (XYZ-5678)', driver: 'Sara K.', station: 'Elsewedy Plug Nasr City', time: '11:00 PM', savingEGP: 21, reason: 'Closest to morning route, 0.05 EGP/kWh off-peak' },
  { vehicle: 'BMW iX3 (DEF-9012)', driver: 'Mohamed A.', station: 'Sha7en Zayed', time: 'Tomorrow 6:00 AM', savingEGP: 18, reason: 'Early morning slot available, station 2km from office' },
];

export function AIScheduleReviewScreen({ navigation }: any) {
  const totalSaving = SCHEDULE.reduce((sum, s) => sum + s.savingEGP, 0);

  return (
    <View style={styles.container}>
      <Header title="Review AI Schedule" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>AI Recommendation</Text>
          <Text style={styles.summaryText}>
            Off-peak charging for 3 vehicles saves{' '}
            <Text style={styles.highlight}>{totalSaving} EGP this week</Text> (~1,200 EGP/month).
          </Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Vehicles</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalSaving} EGP</Text>
              <Text style={styles.statLabel}>Weekly saving</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>94%</Text>
              <Text style={styles.statLabel}>Confidence</Text>
            </View>
          </View>
        </Card>

        {SCHEDULE.map((item, i) => (
          <Card key={i} style={styles.scheduleCard}>
            <Text style={styles.vehicleName}>{item.vehicle}</Text>
            <Text style={styles.detail}>Driver: {item.driver}</Text>
            <Text style={styles.detail}>Station: {item.station}</Text>
            <Text style={[styles.detail, styles.timeText]}>Time: {item.time}</Text>
            <View style={styles.savingRow}>
              <Text style={styles.reason}>{item.reason}</Text>
              <Text style={styles.saving}>-{item.savingEGP} EGP</Text>
            </View>
          </Card>
        ))}

        <View style={styles.actions}>
          <Button
            title="Approve & Book All"
            onPress={() => {
              navigation.navigate('ScheduleMain');
            }}
            size="lg"
          />
          <Button
            title="Adjust Schedule"
            onPress={() => navigation.goBack()}
            variant="outline"
            size="lg"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  summaryCard: { backgroundColor: colors.primaryLight, marginBottom: spacing.lg },
  summaryTitle: { ...(typography.bodyBold as object), color: colors.primaryDark },
  summaryText: { ...(typography.body as object), color: colors.primaryDark, fontSize: 14, marginTop: spacing.xs },
  highlight: { fontWeight: '700' },
  summaryStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.md },
  statItem: { alignItems: 'center' },
  statValue: { ...(typography.h3 as object), color: colors.primaryDark },
  statLabel: { ...(typography.small as object), color: colors.primaryDark, opacity: 0.7 },
  scheduleCard: { marginBottom: spacing.sm },
  vehicleName: { ...(typography.bodyBold as object), color: colors.text, marginBottom: spacing.xs },
  detail: { ...(typography.caption as object), color: colors.textSecondary, marginTop: 2 },
  timeText: { color: colors.primary, fontWeight: '600' },
  savingRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  reason: { ...(typography.small as object), color: colors.textSecondary, fontStyle: 'italic', flex: 1 },
  saving: { ...(typography.bodyBold as object), color: colors.success, fontSize: 14 },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
});
