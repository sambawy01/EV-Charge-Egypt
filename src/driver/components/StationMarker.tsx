import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/core/theme/colors';
import type { StationStatus } from '@/core/types/station';

const STATUS_COLORS: Record<StationStatus, string> = {
  available: colors.statusAvailable,
  partial: colors.statusPartial,
  occupied: colors.statusOccupied,
  offline: colors.statusOffline,
};

const PROVIDER_INITIALS: Record<string, string> = {
  ikarus: 'IK',
  sha7en: 'SH',
  elsewedy: 'EP',
  kilowatt: 'KW',
  newenergy: 'NE',
};

interface Props {
  status: StationStatus;
  providerSlug: string;
  testID?: string;
}

export function StationMarker({ status, providerSlug, testID }: Props) {
  const bg = STATUS_COLORS[status] || colors.statusOffline;
  const initials = PROVIDER_INITIALS[providerSlug] || '??';

  return (
    <View testID={testID} style={[styles.container, { backgroundColor: bg }]}>
      <Text style={styles.text}>{initials}</Text>
      <View style={[styles.arrow, { borderTopColor: bg }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  text: { color: '#fff', fontSize: 12, fontWeight: '700' },
  arrow: {
    position: 'absolute',
    bottom: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
