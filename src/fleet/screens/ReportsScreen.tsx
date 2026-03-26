import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Header, Card } from '@/core/components';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

const REPORTS = [
  {
    title: 'Cost Breakdown',
    description: 'Monthly spending by vehicle, driver, and provider',
    icon: '💰',
    screen: 'CostBreakdown',
    value: '3,840 EGP this month',
  },
  {
    title: 'Battery Health',
    description: 'Fleet battery health scores and trends',
    icon: '🔋',
    screen: 'BatteryHealth',
    value: 'Avg score 87/100',
  },
  {
    title: 'Export Data',
    description: 'Download PDF/CSV reports for accounting',
    icon: '📊',
    screen: 'Export',
    value: 'Last export 3 days ago',
  },
];

export function ReportsScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Header title="Reports & Analytics" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.highlightCard}>
          <Text style={styles.highlightLabel}>March 2026 — Fleet Spend</Text>
          <Text style={styles.highlightValue}>3,840 EGP</Text>
          <Text style={styles.highlightChange}>↓ 8.2% vs February</Text>
        </Card>

        {REPORTS.map((r) => (
          <TouchableOpacity key={r.screen} onPress={() => navigation.navigate(r.screen)}>
            <Card style={styles.card}>
              <Text style={styles.icon}>{r.icon}</Text>
              <View style={styles.info}>
                <Text style={styles.title}>{r.title}</Text>
                <Text style={styles.desc}>{r.description}</Text>
                <Text style={styles.value}>{r.value}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  highlightCard: { backgroundColor: colors.primaryLight, alignItems: 'center', marginBottom: spacing.lg },
  highlightLabel: { ...(typography.caption as object), color: colors.primaryDark },
  highlightValue: { ...(typography.h1 as object), color: colors.primaryDark, marginTop: spacing.xs },
  highlightChange: { ...(typography.caption as object), color: colors.success, marginTop: 4 },
  card: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  icon: { fontSize: 32, marginRight: spacing.md },
  info: { flex: 1 },
  title: { ...(typography.bodyBold as object), color: colors.text },
  desc: { ...(typography.caption as object), color: colors.textSecondary, marginTop: 2 },
  value: { ...(typography.small as object), color: colors.primary, marginTop: 4, fontWeight: '600' },
  arrow: { fontSize: 22, color: colors.textTertiary },
});
