import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/core/theme/colors';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import { formatPricePerKWh } from '@/core/utils/formatCurrency';
import type { Connector } from '@/core/types/station';

interface Props {
  connectors: Connector[];
  selectedId: string | null;
  onSelect: (connector: Connector) => void;
}

export function ConnectorSelector({ connectors, selectedId, onSelect }: Props) {
  const available = connectors.filter((c) => c.status === 'available');
  return (
    <View>
      <Text style={styles.label}>Select Connector</Text>
      {available.length === 0 && (
        <Text style={styles.noAvailable}>No connectors available</Text>
      )}
      {available.map((c) => (
        <TouchableOpacity
          key={c.id}
          style={[styles.option, selectedId === c.id && styles.optionSelected]}
          onPress={() => onSelect(c)}
        >
          <View style={styles.typeTag}>
            <Text style={styles.typeText}>{c.type}</Text>
          </View>
          <View style={styles.details}>
            <Text style={styles.power}>{c.power_kw} kW</Text>
            <Text style={styles.price}>{formatPricePerKWh(c.price_per_kwh)}</Text>
          </View>
          <View
            style={[
              styles.radio,
              selectedId === c.id && styles.radioSelected,
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
  noAvailable: {
    ...typography.body,
    color: colors.error,
    fontStyle: 'italic',
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
  typeTag: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: spacing.md,
  },
  typeText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  details: { flex: 1 },
  power: { ...typography.bodyBold, color: colors.text, fontSize: 15 },
  price: { ...typography.caption, color: colors.textSecondary },
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
