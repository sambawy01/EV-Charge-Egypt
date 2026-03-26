import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { Header, Button } from '@/core/components';
import { getMakes, getModelsForMake, getVehicleSpec } from '@/core/data/evDatabase';
import { useAddVehicle } from '@/core/queries/useVehicles';
import { colors } from '@/core/theme/colors';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

export function AddVehicleScreen({ navigation }: any) {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const addVehicle = useAddVehicle();

  const makes = getMakes();
  const models = useMemo(() => (make ? getModelsForMake(make) : []), [make]);
  const spec = useMemo(
    () => (make && model ? getVehicleSpec(make, model) : null),
    [make, model],
  );

  const handleAdd = async () => {
    if (!spec) {
      Alert.alert('Error', 'Please select make and model');
      return;
    }
    try {
      await addVehicle.mutateAsync({
        make: spec.make,
        model: spec.model,
        batteryCapacityKwh: spec.batteryCapacityKwh,
        connectorTypes: spec.connectorTypes,
        year: spec.year,
        licensePlate: licensePlate || undefined,
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Add Vehicle" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Make</Text>
        <View style={styles.chipRow}>
          {makes.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.chip, make === m && styles.chipActive]}
              onPress={() => {
                setMake(m);
                setModel('');
              }}
            >
              <Text style={[styles.chipText, make === m && styles.chipTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {make && (
          <>
            <Text style={styles.label}>Model</Text>
            <View style={styles.chipRow}>
              {models.map((m) => (
                <TouchableOpacity
                  key={m.model}
                  style={[styles.chip, model === m.model && styles.chipActive]}
                  onPress={() => setModel(m.model)}
                >
                  <Text
                    style={[styles.chipText, model === m.model && styles.chipTextActive]}
                  >
                    {m.model}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {spec && (
          <View style={styles.specCard}>
            <Text style={styles.specTitle}>
              {spec.make} {spec.model}
            </Text>
            <Text style={styles.specLine}>Battery: {spec.batteryCapacityKwh} kWh</Text>
            <Text style={styles.specLine}>Range: {spec.rangeKm} km</Text>
            <Text style={styles.specLine}>Connectors: {spec.connectorTypes.join(', ')}</Text>
            <Text style={styles.specLine}>Max Charge: {spec.maxChargingKw} kW</Text>
          </View>
        )}

        <Text style={styles.label}>License Plate (optional)</Text>
        <TextInput
          style={styles.input}
          value={licensePlate}
          onChangeText={setLicensePlate}
          placeholder="e.g. ABC 1234"
          placeholderTextColor={colors.textTertiary}
        />
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title="Add Vehicle"
          onPress={handleAdd}
          loading={addVehicle.isPending}
          size="lg"
          disabled={!spec}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 100 },
  label: {
    ...(typography.bodyBold as object),
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { ...(typography.caption as object), color: colors.textSecondary },
  chipTextActive: { color: colors.primaryDark, fontWeight: '600' },
  specCard: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  specTitle: { ...(typography.bodyBold as object), color: colors.primaryDark, marginBottom: spacing.sm },
  specLine: { ...(typography.caption as object), color: colors.primaryDark, marginBottom: 4 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...(typography.body as object),
    color: colors.text,
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
