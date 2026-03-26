import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Header, Card, LoadingScreen } from '@/core/components';
import { FleetStatCard } from '../components/FleetStatCard';
import { FleetAlertCard } from '../components/FleetAlertCard';
import { useFleet, useFleetDashboard } from '@/core/queries/useFleet';
import { useFleetStore } from '@/core/stores/fleetStore';
import { formatEGP } from '@/core/utils/formatCurrency';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

// Mock data for compelling demo
const MOCK_STATS = {
  totalVehicles: 8,
  activeCharging: 3,
  lowBattery: 1,
  todaySpending: 240,
  monthlyBudget: 8000,
  alerts: ['BYD Atto 3 (ABC-1234) below 15% battery', 'Missed scheduled charge for MG ZS — reschedule?'],
};

export function FleetHomeScreen({ navigation }: any) {
  const { isLoading: fleetLoading } = useFleet();
  const fleet = useFleetStore((s) => s.fleet);
  const { data: stats } = useFleetDashboard();

  // Use mock stats for demo until real data loads
  const displayStats = stats?.totalVehicles ? stats : MOCK_STATS;

  if (fleetLoading) return <LoadingScreen message="Loading fleet..." />;

  const mockFleet = fleet || {
    company_name: 'Al-Nour Transport Co.',
    credit_balance: 45000,
    plan: 'business',
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header title={mockFleet.company_name} />

      <View style={styles.balanceRow}>
        <Text style={styles.balanceLabel}>Credit Balance</Text>
        <Text style={styles.balance}>{formatEGP(mockFleet.credit_balance)}</Text>
        <Text style={styles.planBadge}>{(mockFleet.plan || 'starter').toUpperCase()}</Text>
      </View>

      <View style={styles.statsGrid}>
        <FleetStatCard icon="🚗" value={displayStats.totalVehicles.toString()} label="Vehicles" />
        <FleetStatCard
          icon="⚡"
          value={displayStats.activeCharging.toString()}
          label="Charging Now"
          trend="+2 vs yesterday"
          trendUp
        />
        <FleetStatCard
          icon="🔋"
          value={displayStats.lowBattery.toString()}
          label="Low Battery"
          trend="Needs attention"
          trendUp={displayStats.lowBattery > 0}
        />
        <FleetStatCard
          icon="💰"
          value={formatEGP(displayStats.todaySpending)}
          label="Today's Spend"
          trend="Budget: 8,000 EGP"
        />
      </View>

      <FleetAlertCard alerts={displayStats.alerts} />

      <Card style={styles.aiInsight}>
        <Text style={styles.aiTitle}>AI Insight</Text>
        <Text style={styles.aiText}>
          3 drivers charged at peak rates this week. Switching to off-peak (9 PM–7 AM) could save{' '}
          <Text style={styles.aiHighlight}>1,200 EGP/month</Text>. Tap to review schedule.
        </Text>
      </Card>

      <Card style={styles.sessionCard}>
        <Text style={styles.sectionTitle}>Active Sessions</Text>
        {[
          { driver: 'Ahmed M.', station: 'IKARUS Maadi', completion: '18 min' },
          { driver: 'Sara K.', station: 'Elsewedy New Cairo', completion: '45 min' },
          { driver: 'Mohamed A.', station: 'Sha7en Zayed', completion: '6 min' },
        ].map((session, i) => (
          <View key={i} style={styles.sessionRow}>
            <View style={styles.sessionDot} />
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionDriver}>{session.driver}</Text>
              <Text style={styles.sessionStation}>{session.station}</Text>
            </View>
            <Text style={styles.sessionTime}>{session.completion}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },
  balanceRow: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.primaryDark,
    marginBottom: spacing.md,
  },
  balanceLabel: { ...(typography.caption as object), color: colors.primaryLight },
  balance: { ...(typography.h1 as object), color: colors.white, fontSize: 32 },
  planBadge: {
    ...(typography.small as object),
    color: colors.primaryLight,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: spacing.xs,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.md },
  aiInsight: { margin: spacing.md, backgroundColor: colors.primaryLight },
  aiTitle: { ...(typography.bodyBold as object), color: colors.primaryDark, marginBottom: spacing.xs },
  aiText: { ...(typography.body as object), color: colors.primaryDark, fontSize: 14 },
  aiHighlight: { fontWeight: '700' },
  sessionCard: { margin: spacing.md },
  sectionTitle: { ...(typography.bodyBold as object), color: colors.text, marginBottom: spacing.md },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sessionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: spacing.md,
  },
  sessionInfo: { flex: 1 },
  sessionDriver: { ...(typography.bodyBold as object), color: colors.text, fontSize: 14 },
  sessionStation: { ...(typography.caption as object), color: colors.textSecondary },
  sessionTime: { ...(typography.small as object), color: colors.textSecondary },
});
