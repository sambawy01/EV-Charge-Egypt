import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { spacing, borderRadius } from '../theme/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'flat';
}

export function Card({ children, style, variant = 'elevated' }: CardProps) {
  const { colors, isDark } = useTheme();

  const dynamicBase: ViewStyle = {
    backgroundColor: colors.surface,
  };

  const variantStyle: ViewStyle =
    variant === 'elevated'
      ? isDark
        ? { borderWidth: 1, borderColor: colors.border }
        : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
          }
      : variant === 'outlined'
        ? { borderWidth: 1, borderColor: colors.border }
        : {};

  return (
    <View style={[styles.base, dynamicBase, variantStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
});
