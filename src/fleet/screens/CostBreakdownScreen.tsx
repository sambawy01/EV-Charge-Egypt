import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Header, Card, LoadingScreen } from '@/core/components';
import { useFleetCostReport } from '@/core/queries/useFleetReports';
import { formatEGP } from '@/core/utils/formatCurrency';
import { useTheme, colors } from '@/core/theme';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

const MOCK_BY_VEHICLE = [
  { name: 'BYD Atto 3 (ABC-1234)', amount: 1240, sessions: 8, driver: 'Ahmed M.' },
  { name: 'MG ZS EV (XYZ-5678)', amount: 980, sessions: 6, driver: 'Sara K.' },
  { name: 'BMW iX3 (DEF-9012)', amount: 860, sessions: 5, driver: 'Mohamed A.' },
  { name: 'Hyundai Ioniq 5', amount: 760, sessions: 5, driver: 'Unassigned' },
];

export function CostBreakdownScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { data: report, isLoading } = useFleetCostReport('March 2026');
  if (isLoading) return <LoadingScreen message="Generating report..." />;

  const totalSpent = report?.totalSpent || 3840;
  const byProvider = report?.byProvider || [
    { provider: 'Elsewedy Plug', amount: 1536, percentage: 40 },
    { provider: 'IKARUS', amount: 1152, percentage: 30 },
    { provider: 'Sha7en', amount: 768, percentage: 20 },
    { provider: 'Kilowatt EV', amount: 384, percentage: 10 },
  ];

  return (
    <View style={styles.container}>
      <Header title="Cost Breakdown" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Fleet Spending — March 2026</Text>
          <Text style={styles.totalValue}>{formatEGP(totalSpent)}</Text>
          <Text style={styles.totalSub}>8 vehicles · 34 sessions · 845 kWh</Text>
        </Card>

        <Text style={styles.sectionTitle}>By Provider</Text>
        {byProvider.map((p) => (
          <View key={p.provider} style={styles.providerRow}>
            <Text style={styles.providerName}>{p.provider}</Text>
            <View style={styles.barContainer}>
              <View style={[styles.bar, { width: `${p.percentage}%` }]} />
            </View>
            <Text style={styles.providerAmount}>{formatEGP(p.amount)}</Text>
            <Text style={styles.providerPct}>{p.percentage}%</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>By Vehicle</Text>
        {MOCK_BY_VEHICLE.map((v, i) => (
          <Card key={i} style={styles.vehicleCard}>
            <View style={styles.vehicleHeader}>
              <Text style={styles.vehicleName}>{v.name}</Text>
              <Text style={styles.vehicleAmount}>{formatEGP(v.amount)}</Text>
            </View>
            <Text style={styles.vehicleDetail}>
              {v.driver} · {v.sessions} sessions
            </Text>
          </Card>
        ))}

        {report?.savings && report.savings.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Savings Opportunities</Text>
            {report.savings.map((s, i) => (
              <Card key={i} style={[styles.savingCard, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={styles.savingDesc}>{s.description}</Text>
                <Text style={styles.savingAmount}>Save {formatEGP(s.amountSavable)}/mo</Text>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  totalCard: { alignItems: 'center', marginBottom: spacing.lg, backgroundColor: colors.primaryLight },
  totalLabel: { ...(typography.caption as object), color: colors.primaryDark },
  totalValue: { ...(typography.h1 as object), color: colors.primaryDark },
  totalSub: { ...(typography.small as object), color: colors.primaryDark, opacity: 0.7, marginTop: 4 },
  sectionTitle: { ...(typography.bodyBold as object), color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  providerName: { ...(typography.body as object), color: colors.text, width: 110, fontSize: 13 },
  barContainer: { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4, marginHorizontal: spacing.sm, overflow: 'hidden' },
  bar: { height: 8, backgroundColor: colors.primary, borderRadius: 4 },
  providerAmount: { ...(typography.bodyBold as object), color: colors.text, fontSize: 13, width: 75, textAlign: 'right' },
  providerPct: { ...(typography.caption as object), color: colors.textSecondary, width: 36, textAlign: 'right' },
  vehicleCard: { marginBottom: spacing.sm },
  vehicleHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  vehicleName: { ...(typography.bodyBold as object), color: colors.text, fontSize: 14, flex: 1 },
  vehicleAmount: { ...(typography.bodyBold as object), color: colors.text },
  vehicleDetail: { ...(typography.caption as object), color: colors.textSecondary, marginTop: 2 },
  savingCard: { marginBottom: spacing.sm },
  savingDesc: { ...(typography.body as object), color: colors.text, fontSize: 14 },
  savingAmount: { ...(typography.bodyBold as object), color: colors.success, marginTop: 4 },
});
