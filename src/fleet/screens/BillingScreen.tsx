import React from 'react';
import { View, ScrollView, Text, StyleSheet, Alert } from 'react-native';
import { Header, Card } from '@/core/components';
import { SubscriptionCard } from '../components/SubscriptionCard';
import { useFleetStore } from '@/core/stores/fleetStore';
import { formatEGP } from '@/core/utils/formatCurrency';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

export function BillingScreen({ navigation }: any) {
  const fleet = useFleetStore((s) => s.fleet);
  const currentPlan = fleet?.plan || 'business';
  const creditBalance = fleet?.credit_balance || 45000;

  return (
    <View style={styles.container}>
      <Header title="Billing & Plan" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Fleet Credit Balance</Text>
          <Text style={styles.balanceValue}>{formatEGP(creditBalance)}</Text>
          <Text style={styles.balanceSub}>
            Auto top-up {fleet?.auto_topup_threshold ? `at ${formatEGP(fleet.auto_topup_threshold)}` : 'disabled'}
          </Text>
        </Card>

        <Text style={styles.sectionTitle}>Choose Your Plan</Text>

        {['starter', 'business', 'enterprise'].map((plan) => (
          <SubscriptionCard
            key={plan}
            planKey={plan}
            isCurrentPlan={currentPlan === plan}
            onSelect={() =>
              Alert.alert(
                'Upgrade Plan',
                `Upgrading to ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan? Our team will contact you to complete the upgrade.`,
                [{ text: 'OK' }],
              )
            }
          />
        ))}

        <Card style={styles.noteCard}>
          <Text style={styles.noteTitle}>Enterprise ROI</Text>
          <Text style={styles.noteText}>
            A 100-vehicle fleet saves ~65,000 EGP/month through waived service fees + AI optimization
            — vs. the 10,000 EGP/month Enterprise subscription. That's 6.5x ROI.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  balanceCard: { alignItems: 'center', backgroundColor: colors.primaryLight, marginBottom: spacing.lg },
  balanceLabel: { ...(typography.caption as object), color: colors.primaryDark },
  balanceValue: { ...(typography.h1 as object), color: colors.primaryDark },
  balanceSub: { ...(typography.small as object), color: colors.primaryDark, opacity: 0.7, marginTop: 4 },
  sectionTitle: { ...(typography.bodyBold as object), color: colors.text, marginBottom: spacing.md },
  noteCard: { backgroundColor: '#FFFBEB', marginTop: spacing.sm },
  noteTitle: { ...(typography.bodyBold as object), color: colors.text, marginBottom: spacing.sm },
  noteText: { ...(typography.body as object), color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
});
