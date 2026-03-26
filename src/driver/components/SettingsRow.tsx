import React from 'react';
import { TouchableOpacity, View, Text, Switch, StyleSheet } from 'react-native';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

interface Props {
  label: string;
  icon?: string;
  value?: string;
  isSwitch?: boolean;
  switchValue?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

export function SettingsRow({
  label,
  icon,
  value,
  isSwitch,
  switchValue,
  onPress,
  onToggle,
}: Props) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={isSwitch && !onPress}
    >
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.label}>{label}</Text>
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onToggle}
          trackColor={{ true: colors.primary }}
        />
      ) : value ? (
        <Text style={styles.value}>{value}</Text>
      ) : (
        <Text style={styles.arrow}>›</Text>
      )}
    </TouchableOpacity>
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
  icon: { fontSize: 20, marginRight: spacing.md },
  label: { flex: 1, ...(typography.body as object), color: colors.text },
  value: { ...(typography.caption as object), color: colors.textSecondary },
  arrow: { fontSize: 22, color: colors.textTertiary },
});
