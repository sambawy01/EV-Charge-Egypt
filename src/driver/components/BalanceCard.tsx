import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/core/theme';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import { formatEGP } from '@/core/utils/formatCurrency';

interface Props {
  balance: number;
  currency: string;
  onTopUp: () => void;
}

export function BalanceCard({ balance, currency, onTopUp }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.outerWrap,
        {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 20,
          elevation: 12,
        },
      ]}
    >
      <LinearGradient
        colors={['#141B2D', '#1C2438']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.container,
          { borderColor: colors.primaryGlow },
        ]}
      >
        <Text style={[styles.availableLabel, { color: colors.textSecondary }]}>
          Available Balance
        </Text>
        <Text style={[styles.balance, { color: colors.primary }]}>
          {formatEGP(balance)}
        </Text>
        <Text style={[styles.currency, { color: colors.textTertiary }]}>
          {currency}
        </Text>
        <TouchableOpacity
          onPress={onTopUp}
          style={[styles.topUpBtn, { borderColor: colors.primary }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.topUpText, { color: colors.primary }]}>
            Top Up
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    borderRadius: borderRadius.xl,
  },
  container: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
  },
  availableLabel: {
    ...(typography.small as object),
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  balance: {
    ...(typography.mono as object),
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '700',
  },
  currency: {
    ...(typography.caption as object),
    marginTop: spacing.xs,
  },
  topUpBtn: {
    marginTop: spacing.lg,
    minWidth: 140,
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  topUpText: {
    ...(typography.button as object),
  },
});
