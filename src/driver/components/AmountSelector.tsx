import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors } from '@/core/theme/colors';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import { paymentService } from '@/core/services/paymentService';

interface Props {
  amount: number;
  onAmountChange: (amount: number) => void;
}

export function AmountSelector({ amount, onAmountChange }: Props) {
  const presets = paymentService.getTopUpPresets();
  return (
    <View>
      <Text style={styles.label}>Amount (EGP)</Text>
      <TextInput
        style={styles.input}
        value={amount > 0 ? amount.toString() : ''}
        onChangeText={(text) => onAmountChange(Number(text) || 0)}
        keyboardType="numeric"
        placeholder="Enter amount"
        placeholderTextColor={colors.textTertiary}
      />
      <View style={styles.presets}>
        {presets.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.preset, amount === p && styles.presetActive]}
            onPress={() => onAmountChange(p)}
          >
            <Text
              style={[
                styles.presetText,
                amount === p && styles.presetTextActive,
              ]}
            >
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
  },
  presets: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  preset: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  presetActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  presetText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    fontSize: 14,
  },
  presetTextActive: { color: colors.primaryDark },
});
