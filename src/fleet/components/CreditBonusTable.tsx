import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/core/components';
import { creditService } from '@/core/services/creditService';
import { formatEGP } from '@/core/utils/formatCurrency';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

export function CreditBonusTable() {
  const tiers = creditService.getBonusTiers();
  return (
    <Card>
      <Text style={styles.title}>Credit Bonuses</Text>
      <View style={styles.headerRow}>
        <Text style={styles.headerCell}>Amount</Text>
        <Text style={styles.headerCell}>Bonus</Text>
        <Text style={styles.headerCell}>Discount</Text>
      </View>
      {tiers.map((t) => (
        <View key={t.amount} style={styles.row}>
          <Text style={styles.cell}>{formatEGP(t.amount)}</Text>
          <Text style={[styles.cell, styles.bonus]}>+{formatEGP(t.bonus)}</Text>
          <Text style={[styles.cell, styles.discount]}>{t.discount}</Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { ...(typography.bodyBold as object), color: colors.text, marginBottom: spacing.md },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  headerCell: { flex: 1, ...(typography.small as object), color: colors.textSecondary, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cell: { flex: 1, ...(typography.caption as object), color: colors.text },
  bonus: { color: colors.success, fontWeight: '600' },
  discount: { color: colors.primary, fontWeight: '600' },
});
