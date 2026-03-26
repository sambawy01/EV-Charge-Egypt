import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Header, Card, LoadingScreen } from '@/core/components';
import { useCostReport } from '@/core/queries/useCostOptimizer';
import { formatEGP } from '@/core/utils/formatCurrency';
import { colors } from '@/core/theme/colors';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

export function CostReportScreen({ navigation }: any) {
  const { data: report, isLoading } = useCostReport('March 2026');

  if (isLoading) return <LoadingScreen message="Analyzing your costs..." />;
  if (!report) {
    return (
      <View style={styles.container}>
        <Header title="Cost Report" onBack={() => navigation.goBack()} />
        <Text style={styles.empty}>No data available yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Cost Report" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.totalCard}>
          <Text style={styles.periodLabel}>{report.period}</Text>
          <Text style={styles.totalAmount}>{formatEGP(report.totalSpent)}</Text>
          <Text
            style={[
              styles.change,
              report.monthOverMonthChange < 0 ? styles.changeDown : styles.changeUp,
            ]}
          >
            {report.monthOverMonthChange > 0 ? '+' : ''}
            {report.monthOverMonthChange.toFixed(1)}% vs last month
          </Text>
        </Card>

        <Text style={styles.sectionTitle}>By Provider</Text>
        {report.byProvider.map((p) => (
          <View key={p.provider} style={styles.providerRow}>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{p.provider}</Text>
              <Text style={styles.providerPct}>{p.percentage}%</Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.bar, { width: `${p.percentage}%` as any }]} />
            </View>
            <Text style={styles.providerAmount}>{formatEGP(p.amount)}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Savings Opportunities</Text>
        {report.savings.map((s, i) => (
          <Card key={i} style={styles.savingCard}>
            <Text style={styles.savingDesc}>{s.description}</Text>
            <Text style={styles.savingAmount}>Save {formatEGP(s.amountSavable)}/month</Text>
          </Card>
        ))}

        <Text style={styles.sectionTitle}>Tips</Text>
        {report.tips.map((tip, i) => (
          <Text key={i} style={styles.tip}>
            • {tip}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  empty: {
    ...(typography.body as object),
    color: colors.textTertiary,
    textAlign: 'center',
    padding: spacing.xl,
  },
  totalCard: { alignItems: 'center', backgroundColor: colors.primaryDark, marginBottom: spacing.lg },
  periodLabel: { ...(typography.caption as object), color: colors.primaryLight },
  totalAmount: {
    ...(typography.h1 as object),
    color: colors.white,
    fontSize: 36,
    marginVertical: spacing.sm,
  },
  change: { ...(typography.bodyBold as object), fontSize: 14 },
  changeDown: { color: colors.success },
  changeUp: { color: colors.error },
  sectionTitle: {
    ...(typography.h3 as object),
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  providerRow: { marginBottom: spacing.md },
  providerInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  providerName: { ...(typography.bodyBold as object), color: colors.text, fontSize: 14 },
  providerPct: { ...(typography.caption as object), color: colors.textSecondary },
  barBg: {
    height: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.full,
  },
  bar: { height: '100%', backgroundColor: colors.primary, borderRadius: borderRadius.full },
  providerAmount: { ...(typography.caption as object), color: colors.textSecondary, marginTop: 2 },
  savingCard: { marginBottom: spacing.sm, backgroundColor: colors.primaryLight },
  savingDesc: { ...(typography.body as object), color: colors.text, fontSize: 14 },
  savingAmount: { ...(typography.bodyBold as object), color: colors.primary, marginTop: 4 },
  tip: {
    ...(typography.body as object),
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontSize: 14,
    lineHeight: 20,
  },
});
