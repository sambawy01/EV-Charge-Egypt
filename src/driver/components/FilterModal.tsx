import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Button } from '@/core/components';
import { colors } from '@/core/theme/colors';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import type { StationFilter } from '@/core/services/stationService';

const CONNECTOR_TYPES = ['CCS', 'CHAdeMO', 'Type2', 'GBT'];
const SPEED_OPTIONS = [
  { label: 'Any', value: 0 },
  { label: '22+ kW', value: 22 },
  { label: '50+ kW', value: 50 },
  { label: '100+ kW', value: 100 },
];
const AMENITY_OPTIONS = ['wifi', 'restaurant', 'bathroom', 'mall', 'shade'];
const PRICE_OPTIONS = [
  { label: 'Any', value: 999 },
  { label: '< 0.04 EGP/kWh', value: 0.04 },
  { label: '< 0.05 EGP/kWh', value: 0.05 },
  { label: '< 0.06 EGP/kWh', value: 0.06 },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onApply: (filter: StationFilter) => void;
  initialFilter?: StationFilter;
}

export function FilterModal({ visible, onClose, onApply, initialFilter }: Props) {
  const [selectedConnectors, setSelectedConnectors] = useState<string[]>(
    initialFilter?.connectorTypes || []
  );
  const [minPower, setMinPower] = useState(initialFilter?.minPowerKw || 0);
  const [maxPrice, setMaxPrice] = useState(initialFilter?.maxPricePerKwh || 999);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    initialFilter?.amenities || []
  );

  const toggleItem = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  const handleApply = () => {
    onApply({
      connectorTypes: selectedConnectors,
      minPowerKw: minPower || undefined,
      maxPricePerKwh: maxPrice < 999 ? maxPrice : undefined,
      amenities: selectedAmenities.length ? selectedAmenities : undefined,
    });
    onClose();
  };

  const handleClear = () => {
    setSelectedConnectors([]);
    setMinPower(0);
    setMaxPrice(999);
    setSelectedAmenities([]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity onPress={handleClear}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.body}>
            <Text style={styles.sectionTitle}>Connector Type</Text>
            <View style={styles.chipRow}>
              {CONNECTOR_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, selectedConnectors.includes(t) && styles.chipActive]}
                  onPress={() => setSelectedConnectors(toggleItem(selectedConnectors, t))}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedConnectors.includes(t) && styles.chipTextActive,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Minimum Speed</Text>
            <View style={styles.chipRow}>
              {SPEED_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  style={[styles.chip, minPower === s.value && styles.chipActive]}
                  onPress={() => setMinPower(s.value)}
                >
                  <Text
                    style={[styles.chipText, minPower === s.value && styles.chipTextActive]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Max Price</Text>
            <View style={styles.chipRow}>
              {PRICE_OPTIONS.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[styles.chip, maxPrice === p.value && styles.chipActive]}
                  onPress={() => setMaxPrice(p.value)}
                >
                  <Text
                    style={[styles.chipText, maxPrice === p.value && styles.chipTextActive]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.chipRow}>
              {AMENITY_OPTIONS.map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[styles.chip, selectedAmenities.includes(a) && styles.chipActive]}
                  onPress={() => setSelectedAmenities(toggleItem(selectedAmenities, a))}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedAmenities.includes(a) && styles.chipTextActive,
                    ]}
                  >
                    {a}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <Button title="Apply Filters" onPress={handleApply} size="lg" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { ...typography.h3, color: colors.text },
  close: { fontSize: 20, color: colors.textSecondary, padding: 4 },
  clearText: { ...typography.caption, color: colors.primary },
  body: { padding: spacing.md },
  sectionTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginTop: spacing.md,
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
  chipText: { ...typography.caption, color: colors.textSecondary },
  chipTextActive: { color: colors.primaryDark, fontWeight: '600' },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
