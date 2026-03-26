import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Badge } from '@/core/components';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import type { Vehicle } from '@/core/types/fleet';

interface Props {
  vehicle: Vehicle;
  onPress: () => void;
}

export function FleetVehicleRow({ vehicle, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.info}>
        <Text style={styles.name}>
          {vehicle.make} {vehicle.model}
        </Text>
        <Text style={styles.details}>
          {vehicle.license_plate || 'No plate'} · {vehicle.battery_capacity_kwh} kWh
        </Text>
      </View>
      <Badge label="Idle" backgroundColor={colors.surfaceSecondary} color={colors.textSecondary} />
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
  info: { flex: 1 },
  name: { ...(typography.bodyBold as object), color: colors.text },
  details: { ...(typography.caption as object), color: colors.textSecondary, marginTop: 2 },
});
