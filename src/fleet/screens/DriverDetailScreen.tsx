import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Header, Card, Avatar, LoadingScreen } from '@/core/components';
import { useFleetMembers } from '@/core/queries/useFleetDrivers';
import { formatEGP } from '@/core/utils/formatCurrency';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

const MOCK_MEMBER = {
  id: 'm1',
  fleet_id: 'f1',
  user_id: 'u2',
  vehicle_id: 'v1',
  daily_limit: 200,
  weekly_limit: 1000,
  is_active: true,
  user: { full_name: 'Ahmed Mohamed', phone: '+20 100 123 4567', avatar_url: null },
  vehicle: { make: 'BYD', model: 'Atto 3', license_plate: 'ABC-1234' },
};

const MOCK_SESSIONS = [
  { date: 'Mar 25', station: 'IKARUS Maadi', cost: 140.80, kwh: 35.2 },
  { date: 'Mar 20', station: 'Elsewedy New Cairo', cost: 114.00, kwh: 28.4 },
  { date: 'Mar 15', station: 'Sha7en Zayed', cost: 89.50, kwh: 22.4 },
];

export function DriverDetailScreen({ route, navigation }: any) {
  const { memberId } = route.params || { memberId: 'm1' };
  const { data: members } = useFleetMembers();
  const member = members?.find((m) => m.id === memberId) || (MOCK_MEMBER as any);

  if (!member) return <LoadingScreen />;

  const totalSpend = MOCK_SESSIONS.reduce((sum, s) => sum + s.cost, 0);

  return (
    <View style={styles.container}>
      <Header title="Driver Details" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <Avatar name={member.user?.full_name || 'Driver'} size={64} />
          <Text style={styles.name}>{member.user?.full_name}</Text>
          <Text style={styles.phone}>{member.user?.phone || 'No phone'}</Text>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>Efficiency Score: 92/100</Text>
          </View>
        </View>

        <Card style={styles.limitsCard}>
          <Text style={styles.cardTitle}>Spending Limits</Text>
          <View style={styles.limitsRow}>
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>Daily Limit</Text>
              <Text style={styles.limitValue}>
                {member.daily_limit ? formatEGP(member.daily_limit) : 'No limit'}
              </Text>
            </View>
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>Weekly Limit</Text>
              <Text style={styles.limitValue}>
                {member.weekly_limit ? formatEGP(member.weekly_limit) : 'No limit'}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.statsCard}>
          <Text style={styles.cardTitle}>This Month</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{MOCK_SESSIONS.length}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatEGP(totalSpend)}</Text>
              <Text style={styles.statLabel}>Total Spend</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>86.0 kWh</Text>
              <Text style={styles.statLabel}>Total kWh</Text>
            </View>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        {MOCK_SESSIONS.map((s, i) => (
          <Card key={i} style={styles.sessionCard}>
            <View style={styles.sessionRow}>
              <Text style={styles.sessionDate}>{s.date}</Text>
              <Text style={styles.sessionStation}>{s.station}</Text>
              <Text style={styles.sessionCost}>{formatEGP(s.cost)}</Text>
            </View>
            <Text style={styles.sessionKwh}>{s.kwh} kWh charged</Text>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  profileHeader: { alignItems: 'center', paddingVertical: spacing.xl },
  name: { ...(typography.h3 as object), color: colors.text, marginTop: spacing.sm },
  phone: { ...(typography.caption as object), color: colors.textSecondary },
  scoreBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    marginTop: spacing.sm,
  },
  scoreText: { ...(typography.small as object), color: colors.primaryDark, fontWeight: '600' },
  limitsCard: { marginBottom: spacing.md },
  cardTitle: { ...(typography.bodyBold as object), color: colors.text, marginBottom: spacing.md },
  limitsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  limitItem: { alignItems: 'center' },
  limitLabel: { ...(typography.small as object), color: colors.textSecondary },
  limitValue: { ...(typography.bodyBold as object), color: colors.text },
  statsCard: { marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { ...(typography.h3 as object), color: colors.primary },
  statLabel: { ...(typography.small as object), color: colors.textSecondary },
  sectionTitle: { ...(typography.bodyBold as object), color: colors.text, marginBottom: spacing.sm },
  sessionCard: { marginBottom: spacing.sm },
  sessionRow: { flexDirection: 'row', alignItems: 'center' },
  sessionDate: { ...(typography.small as object), color: colors.textSecondary, width: 48 },
  sessionStation: { ...(typography.body as object), color: colors.text, fontSize: 14, flex: 1 },
  sessionCost: { ...(typography.bodyBold as object), color: colors.text, fontSize: 14 },
  sessionKwh: { ...(typography.caption as object), color: colors.textSecondary, marginTop: 2 },
});
