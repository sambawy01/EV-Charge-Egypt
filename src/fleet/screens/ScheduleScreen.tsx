import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Header, Card, Button } from '@/core/components';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

const UPCOMING_CHARGES = [
  { vehicle: 'BYD Atto 3 (ABC-1234)', driver: 'Ahmed M.', time: 'Tonight 10:00 PM', station: 'IKARUS Maadi', status: 'scheduled' },
  { vehicle: 'MG ZS EV (XYZ-5678)', driver: 'Sara K.', time: 'Tonight 11:00 PM', station: 'Elsewedy New Cairo', status: 'scheduled' },
  { vehicle: 'BMW iX3 (DEF-9012)', driver: 'Mohamed A.', time: 'Tomorrow 6:00 AM', station: 'Sha7en Zayed', status: 'pending' },
];

export function ScheduleScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Header title="Charging Schedule" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.aiCard}>
          <Text style={styles.aiTitle}>Smart Scheduling</Text>
          <Text style={styles.aiText}>
            AI optimizes your fleet's charging based on routes, electricity rates, and station
            availability. Off-peak scheduling saves an estimated{' '}
            <Text style={styles.highlight}>1,200 EGP/month</Text>.
          </Text>
          <Button
            title="Generate New Schedule"
            onPress={() => navigation.navigate('AIScheduleReview')}
            style={{ marginTop: spacing.md }}
          />
        </Card>

        <Text style={styles.sectionTitle}>Scheduled Charges</Text>
        {UPCOMING_CHARGES.map((item, i) => (
          <Card key={i} style={styles.scheduleCard}>
            <View style={styles.scheduleHeader}>
              <Text style={styles.vehicleName}>{item.vehicle}</Text>
              <View style={[styles.statusBadge, item.status === 'scheduled' ? styles.statusScheduled : styles.statusPending]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.detail}>Driver: {item.driver}</Text>
            <Text style={styles.detail}>Station: {item.station}</Text>
            <Text style={[styles.detail, styles.time]}>{item.time}</Text>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  aiCard: { backgroundColor: colors.primaryLight, marginBottom: spacing.lg },
  aiTitle: { ...(typography.h3 as object), color: colors.primaryDark },
  aiText: { ...(typography.body as object), color: colors.primaryDark, fontSize: 14, marginTop: spacing.sm },
  highlight: { fontWeight: '700' },
  sectionTitle: { ...(typography.bodyBold as object), color: colors.text, marginBottom: spacing.sm },
  scheduleCard: { marginBottom: spacing.sm },
  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  vehicleName: { ...(typography.bodyBold as object), color: colors.text, flex: 1 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 12 },
  statusScheduled: { backgroundColor: colors.primaryLight },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusText: { ...(typography.small as object), fontWeight: '600' },
  detail: { ...(typography.caption as object), color: colors.textSecondary, marginTop: 2 },
  time: { color: colors.primary, fontWeight: '600', marginTop: spacing.xs },
});
