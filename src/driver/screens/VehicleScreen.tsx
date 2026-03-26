import React from 'react';
import { View, FlatList, Text, StyleSheet, Alert } from 'react-native';
import { Header, Button, LoadingScreen } from '@/core/components';
import { VehicleCard } from '../components/VehicleCard';
import { useVehicles, useDeleteVehicle } from '@/core/queries/useVehicles';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

export function VehicleScreen({ navigation }: any) {
  const { data: vehicles, isLoading } = useVehicles();
  const deleteVehicle = useDeleteVehicle();

  const handleDelete = (vehicleId: string) => {
    Alert.alert('Remove Vehicle', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => deleteVehicle.mutate(vehicleId),
      },
    ]);
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Header title="My Vehicles" onBack={() => navigation.goBack()} />
      <FlatList
        data={vehicles || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VehicleCard vehicle={item} onDelete={() => handleDelete(item.id)} />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No vehicles yet. Add your first EV!</Text>
        }
        contentContainerStyle={styles.content}
      />
      <View style={styles.footer}>
        <Button
          title="Add Vehicle"
          onPress={() => navigation.navigate('AddVehicle')}
          size="lg"
        />
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
