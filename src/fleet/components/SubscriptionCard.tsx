import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Button } from '@/core/components';
import { FLEET_PLANS } from '@/core/config/constants';
import { formatEGP } from '@/core/utils/formatCurrency';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

interface Props {
  planKey: string;
  isCurrentPlan: boolean;
  onSelect: () => void;
}

export function SubscriptionCard({ planKey, isCurrentPlan, onSelect }: Props) {
  const plan = FLEET_PLANS[planKey as keyof typeof FLEET_PLANS];
  if (!plan) return null;
  return (
    <Card style={isCurrentPlan ? { ...styles.card, ...styles.currentCard } : styles.card}>
      <Text style={styles.planName}>{planKey.charAt(0).toUpperCase() + planKey.slice(1)}</Text>
      <Text style={styles.price}>
        {plan.price === 0 ? 'Free' : `${formatEGP(plan.price)}/mo`}
      </Text>
      <Text style={styles.vehicles}>
        Up to {plan.maxVehicles === Infinity ? 'Unlimited' : plan.maxVehicles} vehicles
      </Text>
      {plan.features.map((f) => (
        <Text key={f} style={styles.feature}>
          • {f.replace(/_/g, ' ')}
        </Text>
      ))}
      {!isCurrentPlan && (
        <Button
          title="Upgrade"
          onPress={onSelect}
          variant="outline"
          size="sm"
          style={{ marginTop: spacing.md }}
        />
      )}
      {isCurrentPlan && <Text style={styles.currentLabel}>Current Plan</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  currentCard: { borderWidth: 2, borderColor: colors.primary },
  planName: { ...(typography.h3 as object), color: colors.text },
  price: { ...(typography.h2 as object), color: colors.primary, marginVertical: spacing.xs },
  vehicles: { ...(typography.caption as object), color: colors.textSecondary, marginBottom: spacing.sm },
  feature: { ...(typography.small as object), color: colors.textSecondary, marginBottom: 2 },
  currentLabel: {
    ...(typography.bodyBold as object),
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
