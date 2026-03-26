import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/core/theme/colors';
import { spacing, borderRadius } from '@/core/theme/spacing';

const AMENITY_LABELS: Record<string, string> = {
  wifi: 'WiFi',
  restaurant: 'Restaurant',
  bathroom: 'Restroom',
  mall: 'Mall',
  shade: 'Shade',
};

export function AmenityBadge({ amenity }: { amenity: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{AMENITY_LABELS[amenity] || amenity}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  text: { fontSize: 12, color: colors.textSecondary },
});
