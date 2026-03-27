import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: number;
}

export function Avatar({ uri, name, size = 40 }: AvatarProps) {
  const { colors } = useTheme();

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const borderStyle = {
    borderWidth: 2,
    borderColor: colors.primary,
  };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          borderStyle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.surfaceSecondary,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        borderStyle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.surfaceSecondary,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.4, color: colors.primary }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {},
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
  },
});
