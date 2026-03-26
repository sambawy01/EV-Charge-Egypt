import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/core/theme/colors';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

export type TimeSlotOption = 'now' | '30min' | '1hr' | '2hr';

const OPTIONS: { key: TimeSlotOption; label: string; description: string }[] = [
  { key: 'now', label: 'Now', description: 'Start charging immediately' },
  { key: '30min', label: '30 min', description: 'Reserve for 30 minutes' },
  { key: '1hr', label: '1 hour', description: 'Reserve for 1 hour' },
  { key: '2hr', label: '2 hours', description: 'Reserve for 2 hours' },
];

interface Props {
  selected: TimeSlotOption;
  onSelect: (slot: TimeSlotOption) => void;
}

export function TimeSlotPicker({ selected, onSelect }: Props) {
  return (
    <View>
      <Text style={styles.label}>When</Text>
      <View style={styles.grid}>
        {OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.option, selected === opt.key && styles.optionSelected]}
            onPress={() => onSelect(opt.key)}
          >
            <Text
              style={[
                styles.optionLabel,
                selected === opt.key && styles.labelSelected,
              ]}
            >
              {opt.label}
            </Text>
            <Text
              style={[
                styles.optionDesc,
                selected === opt.key && styles.descSelected,
              ]}
            >
              {opt.description}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionLabel: { ...typography.bodyBold, color: colors.text, fontSize: 15 },
  labelSelected: { color: colors.primaryDark },
  optionDesc: {
    ...typography.small,
    color: colors.textTertiary,
    marginTop: 2,
  },
  descSelected: { color: colors.primaryDark },
});
