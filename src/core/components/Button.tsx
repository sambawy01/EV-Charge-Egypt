import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import { typography } from '../theme/typography';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const containerStyle = [
    styles.base,
    variant === 'primary' && styles.container_primary,
    variant === 'secondary' && styles.container_secondary,
    variant === 'outline' && styles.container_outline,
    variant === 'ghost' && styles.container_ghost,
    size === 'sm' && styles.size_sm,
    size === 'md' && styles.size_md,
    size === 'lg' && styles.size_lg,
    isDisabled && styles.disabled,
    style,
  ] as StyleProp<ViewStyle>;

  const labelStyle = [
    styles.text,
    variant === 'primary' && styles.text_primary,
    variant === 'secondary' && styles.text_secondary,
    variant === 'outline' && styles.text_outline,
    variant === 'ghost' && styles.text_ghost,
    size === 'sm' && styles.textSize_sm,
    size === 'lg' && styles.textSize_lg,
    textStyle,
  ] as StyleProp<TextStyle>;

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.white : colors.primary} />
      ) : null}
      <Text style={labelStyle}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  container_primary: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  container_secondary: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
  },
  container_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  container_ghost: {
    backgroundColor: 'transparent',
  },
  size_sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  size_md: { paddingVertical: spacing.md - 2, paddingHorizontal: spacing.lg },
  size_lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  disabled: { opacity: 0.5 },
  text: { ...typography.button },
  text_primary: { color: colors.white },
  text_secondary: { color: colors.primaryDark },
  text_outline: { color: colors.primary },
  text_ghost: { color: colors.primary },
  textSize_sm: { fontSize: 14 },
  textSize_md: { fontSize: 16 },
  textSize_lg: { fontSize: 18 },
});
