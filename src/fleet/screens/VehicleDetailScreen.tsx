import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Header, Card, Button, LoadingScreen } from '@/core/components';
import { useFleetVehicles } from '@/core/queries/useFleetVehicles';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import type { Vehicle } from '@/core/types/fleet';

const MOCK_VEHICLES: Vehicle[] = [
  { id: 'v1', user_id: 'u1', fleet_id: 'f1', make: 'BYD', model: 'Atto 3', year: 2024, battery_capacity_kwh: 60.5, connector_types: ['CCS', 'Type2'], license_plate: 'ABC-1234', created_at: '' },
  { id: 'v2', user_id: 'u1', fleet_id: 'f1', make: 'MG', model: 'ZS EV', year: 2023, battery_capacity_kwh: 51, connector_types: ['CCS', 'Type2'], license_plate: 'XYZ-5678', created_at: '' },
  { id: 'v3', user_id: 'u1', fleet_id: 'f1', make: 'BMW', model: 'iX3', year: 2024, battery_capacity_kwh: 74, connector_types: ['CCS', 'Type2'], license_plate: 'DEF-9012', created_at: '' },
];

const MOCK_SESSIONS = [
  { date: 'Mar 25, 2026', station: 'IKARUS Maadi', kwh: 35.2, cost: 140.80, duration: '58 min' },
  { date: 'Mar 22, 2026', station: 'Elsewedy New Cairo', kwh: 28.4, cost: 114.00, duration: '45 min' },
  { date: 'Mar 18, 2026', station: 'Sha7en 6th October', kwh: 42.1, cost: 168.40, duration: '72 min' },
];

export function VehicleDetailScreen({ route, navigation }: any) {
  const { vehicleId } = route.params || { vehicleId: 'v1' };
  const { data: vehicles } = useFleetVehicles();

  const allVehicles = (vehicles && vehicles.length > 0) ? vehicles : MOCK_VEHICLES;
  const vehicle = allVehicles.find((v) => v.id === vehicleId) || MOCK_VEHICLES[0];

  if (!vehicle) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Header
        title={`${vehicle.make} ${vehicle.model}`}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.summaryCard}>
          <Text style={styles.plate}>{vehicle.license_plate || 'No plate'}</Text>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Battery</Text>
              <Text style={styles.detailValue}>{vehicle.battery_capacity_kwh} kWh</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Year</Text>
              <Text style={styles.detailValue}>{vehicle.year || 'N/A'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Health</Text>
              <Text style={[styles.detailValue, { color: colors.success }]}>87/100</Text>
            </View>
          </View>
          <Text style={styles.connectors}>Connectors: {vehicle.connector_types.join(', ')}</Text>
        </Card>

        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        {MOCK_SESSIONS.map((session, i) => (
          <Card key={i} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionDate}>{session.date}</Text>
              <Text style={styles.sessionCost}>{session.cost.toFixed(2)} EGP</Text>
            </View>
            <Text style={styles.sessionStation}>{session.station}</Text>
            <View style={styles.sessionStats}>
              <Text style={styles.sessionStat}>{session.kwh} kWh</Text>
              <Text style={styles.sessionStat}>{session.duration}</Text>
            </View>
          </Card>
        ))}

        <Button
          title="Assign Driver"
          onPress={() => navigation.navigate('AssignDriver', { vehicleId })}
          variant="outline"
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  summaryCard: { marginBottom: spacing.lg },
  plate: { ...(typography.h3 as object), color: colors.text, textAlign: 'center', marginBottom: spacing.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.md },
  detailItem: { alignItems: 'center' },
  detailLabel: { ...(typography.small as object), color: colors.textSecondary },
  detailValue: { ...(typography.bodyBold as object), color: colors.text },
  connectors: { ...(typography.caption as object), color: colors.textSecondary, textAlign: 'center' },
  sectionTitle: { ...(typography.bodyBold as object), color: colors.text, marginBottom: spacing.sm },
  sessionCard: { marginBottom: spacing.sm },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  sessionDate: { ...(typography.small as object), color: colors.textSecondary },
  sessionCost: { ...(typography.bodyBold as object), color: colors.text, fontSize: 14 },
  sessionStation: { ...(typography.body as object), color: colors.text, fontSize: 14 },
  sessionStats: { flexDirection: 'row', gap: spacing.md, marginTop: 4 },
  sessionStat: { ...(typography.small as object), color: colors.textSecondary },
});
