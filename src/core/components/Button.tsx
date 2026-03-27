import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
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
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const sizeStyle =
    size === 'sm'
      ? styles.size_sm
      : size === 'lg'
        ? styles.size_lg
        : styles.size_md;

  const labelColor =
    variant === 'primary'
      ? colors.black
      : variant === 'secondary'
        ? colors.primary
        : colors.primary;

  const content = (
    <View style={[styles.inner, sizeStyle]}>
      {loading ? <ActivityIndicator color={labelColor} /> : null}
      <Text style={[styles.text, { color: labelColor }, textStyle]}>{title}</Text>
    </View>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.7}
        style={[isDisabled && styles.disabled, style]}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[
            styles.base,
            {
              borderRadius: borderRadius.md,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 6,
            },
          ]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const containerDynamic: ViewStyle =
    variant === 'secondary'
      ? { backgroundColor: colors.surfaceSecondary, borderRadius: borderRadius.md }
      : variant === 'outline'
        ? {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: colors.primary,
            borderRadius: borderRadius.md,
          }
        : { backgroundColor: 'transparent' };

  return (
    <TouchableOpacity
      style={[styles.base, containerDynamic, isDisabled && styles.disabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  size_sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  size_md: { paddingVertical: spacing.md - 2, paddingHorizontal: spacing.lg },
  size_lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  disabled: { opacity: 0.5 },
  text: { ...typography.button },
});
