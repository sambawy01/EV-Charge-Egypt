import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/core/theme/colors';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import { paymentService } from '@/core/services/paymentService';
import type { PaymentMethod } from '@/core/types/wallet';

interface Props {
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({ selected, onSelect }: Props) {
  const methods = paymentService.getPaymentMethods();
  return (
    <View>
      <Text style={styles.label}>Payment Method</Text>
      {methods.map((m) => (
        <TouchableOpacity
          key={m.key}
          style={[
            styles.option,
            selected === m.key && styles.optionSelected,
          ]}
          onPress={() => onSelect(m.key)}
        >
          <Text style={styles.icon}>{m.icon}</Text>
          <Text
            style={[styles.text, selected === m.key && styles.textSelected]}
          >
            {m.label}
          </Text>
          <View
            style={[
              styles.radio,
              selected === m.key && styles.radioSelected,
            ]}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  icon: { fontSize: 24, marginRight: spacing.md },
  text: { flex: 1, ...typography.body, color: colors.text },
  textSelected: { color: colors.primaryDark, fontWeight: '600' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
  },
  radioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
});
