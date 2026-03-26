import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@/core/components';
import { colors } from '@/core/theme/colors';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import { formatEGP } from '@/core/utils/formatCurrency';

interface Props {
  balance: number;
  currency: string;
  onTopUp: () => void;
}

export function BalanceCard({ balance, currency, onTopUp }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Wallet Balance</Text>
      <Text style={styles.balance}>{formatEGP(balance)}</Text>
      <Button
        title="Top Up"
        onPress={onTopUp}
        variant="secondary"
        size="md"
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primaryDark,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  label: {
    ...typography.caption,
    color: colors.primaryLight,
    marginBottom: spacing.xs,
  },
  balance: { ...typography.h1, color: colors.white, fontSize: 36 },
  button: { marginTop: spacing.lg, minWidth: 140 },
});
