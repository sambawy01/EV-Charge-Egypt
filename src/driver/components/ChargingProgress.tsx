import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '@/core/theme/colors';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import { formatEGP, formatKWh } from '@/core/utils/formatCurrency';

interface Props {
  kwhDelivered: number;
  costTotal: number;
  targetKwh: number;
  elapsedMinutes: number;
  estimatedMinutesRemaining: number;
}

export function ChargingProgress({
  kwhDelivered,
  costTotal,
  targetKwh,
  elapsedMinutes,
  estimatedMinutesRemaining,
}: Props) {
  const progress = Math.min(kwhDelivered / targetKwh, 1);
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={styles.container}>
      <View style={styles.circle}>
        <Text style={styles.percentage}>{Math.round(progress * 100)}%</Text>
        <Text style={styles.kwhText}>{formatKWh(kwhDelivered)}</Text>
      </View>

      <View style={styles.progressBarContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: animatedWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatEGP(costTotal)}</Text>
          <Text style={styles.statLabel}>Cost so far</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{elapsedMinutes} min</Text>
          <Text style={styles.statLabel}>Elapsed</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{estimatedMinutesRemaining} min</Text>
          <Text style={styles.statLabel}>Remaining</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: spacing.lg },
  circle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  percentage: { ...typography.h1, color: colors.primary, fontSize: 40 },
  kwhText: { ...typography.caption, color: colors.textSecondary },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  stat: { alignItems: 'center' },
  statValue: { ...typography.bodyBold, color: colors.text },
  statLabel: { ...typography.small, color: colors.textSecondary },
});
