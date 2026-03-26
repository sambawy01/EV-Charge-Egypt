import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Header, Button } from '@/core/components';
import { AmountSelector } from '../components/AmountSelector';
import { PaymentMethodSelector } from '../components/PaymentMethodSelector';
import { useTopUp } from '@/core/queries/useTopUp';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import type { PaymentMethod } from '@/core/types/wallet';

export function TopUpScreen({ navigation }: any) {
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const topUp = useTopUp();

  const handleTopUp = async () => {
    if (amount <= 0) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }
    if (!method) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }
    try {
      await topUp.mutateAsync({ amount, method });
      Alert.alert(
        'Success',
        `${amount} EGP added to your wallet!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (e: any) {
      Alert.alert('Payment Failed', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Top Up Wallet" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <AmountSelector amount={amount} onAmountChange={setAmount} />
        <View style={styles.spacer} />
        <PaymentMethodSelector selected={method} onSelect={setMethod} />
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title={`Pay ${amount > 0 ? amount + ' EGP' : ''}`}
          onPress={handleTopUp}
          loading={topUp.isPending}
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
  spacer: { height: spacing.xl },
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
