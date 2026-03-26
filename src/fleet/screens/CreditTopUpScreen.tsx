import React, { useState, useMemo } from 'react';
import { View, ScrollView, Text, StyleSheet, Alert } from 'react-native';
import { Header, Button } from '@/core/components';
import { AmountSelector } from '@/driver/components/AmountSelector';
import { PaymentMethodSelector } from '@/driver/components/PaymentMethodSelector';
import { CreditBonusTable } from '../components/CreditBonusTable';
import { creditService } from '@/core/services/creditService';
import { useFleetStore } from '@/core/stores/fleetStore';
import { formatEGP } from '@/core/utils/formatCurrency';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import type { PaymentMethod } from '@/core/types/wallet';

export function CreditTopUpScreen({ navigation }: any) {
  const fleetId = useFleetStore((s) => s.fleet?.id);
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);

  const bonus = useMemo(() => creditService.calculateBonus(amount), [amount]);

  const handleTopUp = async () => {
    if (!fleetId || amount <= 0 || !method) {
      Alert.alert('Incomplete', 'Please enter an amount and select a payment method.');
      return;
    }
    setLoading(true);
    try {
      const result = await creditService.topUpCredits(fleetId, amount, method);
      Alert.alert(
        'Credits Added!',
        `${formatEGP(amount)} paid → ${formatEGP(amount + result.bonus)} credits added to your fleet wallet${result.bonus > 0 ? ` (includes ${formatEGP(result.bonus)} bonus!)` : ''}.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Top-up failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Header title="Top Up Credits" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <CreditBonusTable />
        <View style={{ height: spacing.lg }} />
        <AmountSelector amount={amount} onAmountChange={setAmount} />
        {bonus > 0 && (
          <View style={styles.bonusBanner}>
            <Text style={styles.bonusText}>
              You'll receive +{formatEGP(bonus)} bonus credit!
            </Text>
            <Text style={styles.bonusSub}>
              Total credited: {formatEGP(amount + bonus)}
            </Text>
          </View>
        )}
        <View style={{ height: spacing.lg }} />
        <PaymentMethodSelector selected={method} onSelect={setMethod} />
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title={
            amount > 0
              ? `Pay ${formatEGP(amount)} → Get ${formatEGP(amount + bonus)}`
              : 'Enter Amount to Continue'
          }
          onPress={handleTopUp}
          loading={loading}
          size="lg"
          disabled={amount <= 0 || !method}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 100 },
  bonusBanner: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  bonusText: { ...(typography.bodyBold as object), color: colors.primaryDark },
  bonusSub: { ...(typography.caption as object), color: colors.primaryDark, opacity: 0.8, marginTop: 4 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
