import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import { formatEGP } from '@/core/utils/formatCurrency';
import type { Transaction } from '@/core/types/wallet';

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: string; isCredit: boolean }
> = {
  topup: { label: 'Top Up', icon: '💰', isCredit: true },
  charge: { label: 'Charging', icon: '⚡', isCredit: false },
  subscription: { label: 'Subscription', icon: '📋', isCredit: false },
  refund: { label: 'Refund', icon: '↩', isCredit: true },
  credit_bonus: { label: 'Credit Bonus', icon: '🎁', isCredit: true },
};

export function TransactionItem({
  transaction,
}: {
  transaction: Transaction;
}) {
  const config = TYPE_CONFIG[transaction.type] || {
    label: transaction.type,
    icon: '💳',
    isCredit: false,
  };
  const date = new Date(transaction.created_at);
  const amountStr = `${config.isCredit ? '+' : '-'}${formatEGP(Math.abs(transaction.amount))}`;

  return (
    <View style={styles.row}>
      <Text style={styles.icon}>{config.icon}</Text>
      <View style={styles.info}>
        <Text style={styles.label}>{config.label}</Text>
        <Text style={styles.date}>
          {date.toLocaleDateString()}{' '}
          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <Text
        style={[
          styles.amount,
          config.isCredit ? styles.credit : styles.debit,
        ]}
      >
        {amountStr}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  icon: { fontSize: 24, marginRight: spacing.md },
  info: { flex: 1 },
  label: { ...typography.bodyBold, color: colors.text, fontSize: 15 },
  date: { ...typography.small, color: colors.textTertiary, marginTop: 2 },
  amount: { ...typography.bodyBold },
  credit: { color: colors.success },
  debit: { color: colors.text },
});
