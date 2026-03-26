import React from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { Header, Button, LoadingScreen } from '@/core/components';
import { FleetVehicleRow } from '../components/FleetVehicleRow';
import { useFleetVehicles } from '@/core/queries/useFleetVehicles';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import type { Vehicle } from '@/core/types/fleet';

// Mock vehicles for demo
const MOCK_VEHICLES: Vehicle[] = [
  { id: 'v1', user_id: 'u1', fleet_id: 'f1', make: 'BYD', model: 'Atto 3', year: 2024, battery_capacity_kwh: 60.5, connector_types: ['CCS', 'Type2'], license_plate: 'ABC-1234', created_at: '' },
  { id: 'v2', user_id: 'u1', fleet_id: 'f1', make: 'MG', model: 'ZS EV', year: 2023, battery_capacity_kwh: 51, connector_types: ['CCS', 'Type2'], license_plate: 'XYZ-5678', created_at: '' },
  { id: 'v3', user_id: 'u1', fleet_id: 'f1', make: 'BMW', model: 'iX3', year: 2024, battery_capacity_kwh: 74, connector_types: ['CCS', 'Type2'], license_plate: 'DEF-9012', created_at: '' },
  { id: 'v4', user_id: 'u1', fleet_id: 'f1', make: 'Hyundai', model: 'Ioniq 5', year: 2023, battery_capacity_kwh: 72.6, connector_types: ['CCS', 'Type2'], license_plate: 'GHI-3456', created_at: '' },
  { id: 'v5', user_id: 'u1', fleet_id: 'f1', make: 'Tesla', model: 'Model 3', year: 2024, battery_capacity_kwh: 82, connector_types: ['CCS', 'Type2'], license_plate: 'JKL-7890', created_at: '' },
];

export function VehicleListScreen({ navigation }: any) {
  const { data: vehicles, isLoading } = useFleetVehicles();
  const displayVehicles = (vehicles && vehicles.length > 0) ? vehicles : MOCK_VEHICLES;

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Header title="Fleet Vehicles" />
      <FlatList
        data={displayVehicles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FleetVehicleRow
            vehicle={item}
            onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No vehicles in fleet</Text>}
        contentContainerStyle={styles.content}
      />
      <View style={styles.footer}>
        <Button title="Add Vehicle" onPress={() => navigation.navigate('AddVehicle')} size="lg" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 100 },
  empty: {
    ...(typography.body as object),
    color: colors.textTertiary,
    textAlign: 'center',
    padding: spacing.xl,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
