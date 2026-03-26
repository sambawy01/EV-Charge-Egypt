import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card, Badge } from '@/core/components';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import type { Vehicle } from '@/core/types/fleet';

interface Props {
  vehicle: Vehicle;
  onPress?: () => void;
  onDelete?: () => void;
}

export function VehicleCard({ vehicle, onPress, onDelete }: Props) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.name}>
              {vehicle.make} {vehicle.model}
            </Text>
            <Text style={styles.details}>
              {vehicle.battery_capacity_kwh} kWh · {vehicle.connector_types.join(', ')}
            </Text>
            {vehicle.license_plate && (
              <Text style={styles.plate}>{vehicle.license_plate}</Text>
            )}
          </View>
          {vehicle.year && (
            <Badge
              label={String(vehicle.year)}
              backgroundColor={colors.surfaceSecondary}
              color={colors.textSecondary}
            />
          )}
        </View>
        {onDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
            <Text style={styles.deleteText}>Remove</Text>
          </TouchableOpacity>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  info: { flex: 1 },
  name: { ...(typography.bodyBold as object), color: colors.text },
  details: { ...(typography.caption as object), color: colors.textSecondary, marginTop: 2 },
  plate: { ...(typography.small as object), color: colors.accent, marginTop: 4, fontWeight: '600' },
  deleteBtn: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  deleteText: { ...(typography.caption as object), color: colors.error },
});
