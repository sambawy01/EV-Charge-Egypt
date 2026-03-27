import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Header, Card } from '@/core/components';
import { useTheme, colors } from '@/core/theme';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

const MOCK_VEHICLES = [
  { name: 'BYD Atto 3', plate: 'ABC-1234', score: 92, trend: 'Stable', fastChargeRatio: '28%', warning: null },
  { name: 'MG ZS EV', plate: 'XYZ-5678', score: 87, trend: 'Stable', fastChargeRatio: '35%', warning: null },
  { name: 'BMW iX3', plate: 'DEF-9012', score: 79, trend: 'Declining', fastChargeRatio: '52%', warning: 'High fast-charge ratio' },
  { name: 'Hyundai Ioniq 5', plate: 'GHI-3456', score: 94, trend: 'Excellent', fastChargeRatio: '22%', warning: null },
  { name: 'Tesla Model 3', plate: 'JKL-7890', score: 88, trend: 'Stable', fastChargeRatio: '30%', warning: null },
];

function ScoreIndicator({ score }: { score: number }) {
  const { colors } = useTheme();
  const color = score >= 90 ? colors.success : score >= 75 ? colors.warning : colors.error;
  return (
    <View style={[styles.scoreCircle, { borderColor: color }]}>
      <Text style={[styles.scoreNumber, { color }]}>{score}</Text>
    </View>
  );
}

export function BatteryHealthScreen({ navigation }: any) {
  const { colors } = useTheme();
  const avgScore = Math.round(MOCK_VEHICLES.reduce((sum, v) => sum + v.score, 0) / MOCK_VEHICLES.length);

  return (
    <View style={styles.container}>
      <Header title="Battery Health" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.avgCard}>
          <Text style={styles.avgLabel}>Fleet Average Score</Text>
          <Text style={styles.avgValue}>{avgScore}/100</Text>
          <Text style={styles.avgNote}>Based on charging patterns and frequency analysis</Text>
        </Card>

        <Text style={styles.sectionTitle}>Vehicle Health Scores</Text>
        {MOCK_VEHICLES.map((v, i) => (
          <Card key={i} style={styles.vehicleCard}>
            <View style={styles.vehicleRow}>
              <ScoreIndicator score={v.score} />
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>{v.name}</Text>
                <Text style={styles.vehiclePlate}>{v.plate}</Text>
                <Text style={styles.vehicleTrend}>{v.trend} · Fast charge: {v.fastChargeRatio}</Text>
                {v.warning && <Text style={styles.warning}>{v.warning}</Text>}
              </View>
            </View>
          </Card>
        ))}

        <Card style={[styles.tipsCard, { backgroundColor: colors.surfaceSecondary }]}>
          <Text style={styles.tipsTitle}>Fleet Tips</Text>
          <Text style={styles.tip}>• Aim for fast charging under 30% of all sessions per vehicle</Text>
          <Text style={styles.tip}>• Avoid regular charging above 90% for optimal longevity</Text>
          <Text style={styles.tip}>• Schedule overnight Level 2 charges when possible</Text>
          <Text style={styles.tip}>• BMW iX3 driver should reduce DC fast charging frequency</Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  avgCard: { alignItems: 'center', backgroundColor: colors.primaryLight, marginBottom: spacing.lg },
  avgLabel: { ...(typography.caption as object), color: colors.primaryDark },
  avgValue: { ...(typography.h1 as object), color: colors.primary, fontSize: 48 },
  avgNote: { ...(typography.small as object), color: colors.primaryDark, opacity: 0.8, textAlign: 'center', marginTop: 4 },
  sectionTitle: { ...(typography.bodyBold as object), color: colors.text, marginBottom: spacing.sm },
  vehicleCard: { marginBottom: spacing.sm },
  vehicleRow: { flexDirection: 'row', alignItems: 'center' },
  scoreCircle: { width: 52, height: 52, borderRadius: 26, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  scoreNumber: { ...(typography.h3 as object), fontSize: 16, fontWeight: '700' },
  vehicleInfo: { flex: 1 },
  vehicleName: { ...(typography.bodyBold as object), color: colors.text },
  vehiclePlate: { ...(typography.small as object), color: colors.textSecondary },
  vehicleTrend: { ...(typography.caption as object), color: colors.textSecondary, marginTop: 2 },
  warning: { ...(typography.small as object), color: colors.warning, fontWeight: '600', marginTop: 2 },
  tipsCard: { marginTop: spacing.md },
  tipsTitle: { ...(typography.bodyBold as object), color: colors.text, marginBottom: spacing.sm },
  tip: { ...(typography.caption as object), color: colors.text, marginBottom: spacing.xs },
});
