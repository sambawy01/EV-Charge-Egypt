import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import type { ReliabilityScore } from '../services/reliabilityScoreService';

interface Props {
  /** Pass null when the station has no reports. */
  score: ReliabilityScore | null;
  /** Compact mode for map markers (score number only). */
  compact?: boolean;
}

/**
 * A small pill badge that displays the WattsOn Reliability Score.
 *
 * 8.0-10.0  green
 * 5.0-7.9   amber/yellow
 * 1.0-4.9   red
 * null       gray "—"
 */
export function ReliabilityBadge({ score, compact = false }: Props) {
  const { colors } = useTheme();

  const badgeColor = score
    ? score.color === 'green'
      ? colors.statusAvailable
      : score.color === 'yellow'
        ? colors.statusPartial
        : colors.statusOccupied
    : colors.textTertiary;

  const bgColor = badgeColor + '20';
  const label = score ? score.score.toFixed(1) : '—';

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: bgColor, borderColor: badgeColor + '40' }]}>
        <Text style={[styles.compactText, { color: badgeColor }]}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderColor: badgeColor + '40' }]}>
      <Text style={[styles.scoreText, { color: badgeColor }]}>{label}</Text>
      {score && (
        <Text style={[styles.labelText, { color: colors.textSecondary }]}>
          / 10
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'flex-start',
    gap: 2,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  labelText: {
    fontSize: 10,
    fontWeight: '500',
  },
  compactContainer: {
    position: 'absolute',
    top: -6,
    right: -8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 22,
    alignItems: 'center',
  },
  compactText: {
    fontSize: 8,
    fontWeight: '800',
    fontFamily: 'SpaceGrotesk-Bold',
  },
});
