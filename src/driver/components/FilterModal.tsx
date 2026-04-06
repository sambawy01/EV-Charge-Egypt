import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '@/core/components';
import { useTheme, spacing, borderRadius, typography } from '@/core/theme';
import { useTranslation } from '@/core/i18n';
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

const PRESETS_STORAGE_KEY = '@wattson_filter_presets';
const MAX_PRESETS = 5;

export interface FilterPreset {
  id: string;
  name: string;
  filters: StationFilter;
  isDefault: boolean;
  createdAt: string;
}

// --- Preset persistence helpers ---

async function loadPresets(): Promise<FilterPreset[]> {
  try {
    const raw = await AsyncStorage.getItem(PRESETS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function savePresets(presets: FilterPreset[]): Promise<void> {
  await AsyncStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
}

/**
 * Load the default filter preset (if any).
 * Call this from the MapScreen on mount to auto-apply the default preset.
 */
export async function loadDefaultPreset(): Promise<StationFilter | null> {
  const presets = await loadPresets();
  const defaultPreset = presets.find((p) => p.isDefault);
  return defaultPreset?.filters ?? null;
}

// --- Component ---

interface Props {
  visible: boolean;
  onClose: () => void;
  onApply: (filter: StationFilter) => void;
  initialFilter?: StationFilter;
}

export function FilterModal({ visible, onClose, onApply, initialFilter }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  // Filter state
  const [selectedConnectors, setSelectedConnectors] = useState<string[]>(
    initialFilter?.connectorTypes || []
  );
  const [minPower, setMinPower] = useState(initialFilter?.minPowerKw || 0);
  const [maxPrice, setMaxPrice] = useState(initialFilter?.maxPricePerKwh || 999);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    initialFilter?.amenities || []
  );

  // Preset state
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Load presets when modal opens
  useEffect(() => {
    if (visible) {
      loadPresets().then(setPresets);
    }
  }, [visible]);

  // Sync filter state when initialFilter changes
  useEffect(() => {
    setSelectedConnectors(initialFilter?.connectorTypes || []);
    setMinPower(initialFilter?.minPowerKw || 0);
    setMaxPrice(initialFilter?.maxPricePerKwh || 999);
    setSelectedAmenities(initialFilter?.amenities || []);
  }, [initialFilter]);

  const toggleItem = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  const currentFilter = useMemo<StationFilter>(
    () => ({
      connectorTypes: selectedConnectors,
      minPowerKw: minPower || undefined,
      maxPricePerKwh: maxPrice < 999 ? maxPrice : undefined,
      amenities: selectedAmenities.length ? selectedAmenities : undefined,
    }),
    [selectedConnectors, minPower, maxPrice, selectedAmenities]
  );

  const handleApply = () => {
    onApply(currentFilter);
    onClose();
  };

  const handleClear = () => {
    setSelectedConnectors([]);
    setMinPower(0);
    setMaxPrice(999);
    setSelectedAmenities([]);
    setActivePresetId(null);
  };

  // --- Preset handlers ---

  const applyPreset = useCallback(
    (preset: FilterPreset) => {
      const f = preset.filters;
      setSelectedConnectors(f.connectorTypes || []);
      setMinPower(f.minPowerKw || 0);
      setMaxPrice(f.maxPricePerKwh || 999);
      setSelectedAmenities(f.amenities || []);
      setActivePresetId(preset.id);
    },
    []
  );

  const handleSavePreset = useCallback(async () => {
    const trimmed = presetName.trim();
    if (!trimmed) {
      Alert.alert(t('error'), t('preset_name_required'));
      return;
    }
    if (presets.length >= MAX_PRESETS) {
      Alert.alert(t('error'), t('preset_limit_reached'));
      return;
    }

    const newPreset: FilterPreset = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: trimmed,
      filters: currentFilter,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [...presets, newPreset];
    await savePresets(updated);
    setPresets(updated);
    setPresetName('');
    setShowSaveInput(false);
    setActivePresetId(newPreset.id);
  }, [presetName, presets, currentFilter, t]);

  const handleDeletePreset = useCallback(
    async (id: string) => {
      Alert.alert(t('delete_preset'), t('delete_preset_confirm'), [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          style: 'destructive',
          onPress: async () => {
            const updated = presets.filter((p) => p.id !== id);
            await savePresets(updated);
            setPresets(updated);
            if (activePresetId === id) setActivePresetId(null);
          },
        },
      ]);
    },
    [presets, activePresetId, t]
  );

  const handleToggleDefault = useCallback(
    async (id: string) => {
      const updated = presets.map((p) => ({
        ...p,
        isDefault: p.id === id ? !p.isDefault : false,
      }));
      await savePresets(updated);
      setPresets(updated);
    },
    [presets]
  );

  // Check if current filters differ from initial (have active selections)
  const hasActiveFilters =
    selectedConnectors.length > 0 ||
    minPower > 0 ||
    maxPrice < 999 ||
    selectedAmenities.length > 0;

  // --- Dynamic styles ---

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
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
        chipActive: {
          borderColor: colors.primary,
          backgroundColor: colors.primaryLight,
        },
        chipText: { ...typography.caption, color: colors.textSecondary },
        chipTextActive: { color: colors.primary, fontWeight: '600' },
        footer: {
          padding: spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          gap: spacing.sm,
        },
        // Preset styles
        presetSection: {
          paddingBottom: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        presetHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.sm,
        },
        presetLabel: {
          ...typography.small,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 2,
        },
        presetChipRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
        },
        presetChip: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs + 2,
          borderRadius: borderRadius.full,
          borderWidth: 1.5,
          borderColor: colors.border,
          backgroundColor: colors.surfaceSecondary,
          gap: 6,
        },
        presetChipActive: {
          borderColor: colors.primary,
          backgroundColor: colors.primaryLight,
        },
        presetChipDefault: {
          borderColor: colors.secondary,
        },
        presetChipText: {
          ...typography.caption,
          color: colors.textSecondary,
        },
        presetChipTextActive: {
          color: colors.primary,
          fontWeight: '600',
        },
        presetDefaultBadge: {
          ...typography.small,
          color: colors.secondary,
          fontWeight: '700',
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
        presetDeleteBtn: {
          marginLeft: 2,
          padding: 2,
        },
        presetDeleteText: {
          fontSize: 12,
          color: colors.textTertiary,
          fontWeight: '600',
        },
        // Save input row
        saveRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginTop: spacing.sm,
        },
        saveInput: {
          flex: 1,
          ...typography.caption,
          color: colors.text,
          backgroundColor: colors.surfaceSecondary,
          borderRadius: borderRadius.md,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
        saveBtn: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.md,
          backgroundColor: colors.primary,
        },
        saveBtnText: {
          ...typography.caption,
          color: colors.background,
          fontWeight: '700',
        },
        cancelBtn: {
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.sm,
        },
        cancelBtnText: {
          ...typography.caption,
          color: colors.textSecondary,
        },
        saveAsPresetBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.md,
          borderWidth: 1.5,
          borderColor: colors.primary,
          borderStyle: 'dashed',
          gap: spacing.xs,
        },
        saveAsPresetText: {
          ...typography.caption,
          color: colors.primary,
          fontWeight: '600',
        },
        // Context menu for long-press
        contextMenu: {
          position: 'absolute',
          top: -8,
          right: -8,
          backgroundColor: colors.surfaceTertiary,
          borderRadius: borderRadius.md,
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.sm,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
          zIndex: 10,
          minWidth: 140,
        },
        contextMenuItem: {
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.sm,
        },
        contextMenuText: {
          ...typography.caption,
          color: colors.text,
        },
        contextMenuTextDanger: {
          ...typography.caption,
          color: colors.error,
        },
        emptyPresetsText: {
          ...typography.small,
          color: colors.textTertiary,
          fontStyle: 'italic',
        },
      }),
    [colors]
  );

  const [longPressedPresetId, setLongPressedPresetId] = useState<string | null>(null);

  // Close context menu when tapping elsewhere
  const handleBodyPress = () => {
    if (longPressedPresetId) setLongPressedPresetId(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={dynamicStyles.overlay}>
        <View style={dynamicStyles.sheet}>
          {/* Header */}
          <View style={dynamicStyles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={dynamicStyles.close}>&#x2715;</Text>
            </TouchableOpacity>
            <Text style={dynamicStyles.title}>{t('filters')}</Text>
            <TouchableOpacity onPress={handleClear}>
              <Text style={dynamicStyles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={dynamicStyles.body}>
            {/* --- Saved Presets Section --- */}
            <View style={dynamicStyles.presetSection}>
              <View style={dynamicStyles.presetHeader}>
                <Text style={dynamicStyles.presetLabel}>{t('filter_presets')}</Text>
              </View>

              {presets.length === 0 ? null : (
                <View style={dynamicStyles.presetChipRow}>
                  {presets.map((preset) => {
                    const isActive = activePresetId === preset.id;
                    return (
                      <View key={preset.id} style={{ position: 'relative' }}>
                        <TouchableOpacity
                          style={[
                            dynamicStyles.presetChip,
                            isActive && dynamicStyles.presetChipActive,
                            preset.isDefault && dynamicStyles.presetChipDefault,
                          ]}
                          onPress={() => applyPreset(preset)}
                          onLongPress={() =>
                            setLongPressedPresetId(
                              longPressedPresetId === preset.id ? null : preset.id
                            )
                          }
                          activeOpacity={0.7}
                        >
                          {preset.isDefault && (
                            <Text style={dynamicStyles.presetDefaultBadge}>
                              {t('default_preset')}
                            </Text>
                          )}
                          <Text
                            style={[
                              dynamicStyles.presetChipText,
                              isActive && dynamicStyles.presetChipTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {preset.name}
                          </Text>
                        </TouchableOpacity>

                        {/* Long-press context menu */}
                        {longPressedPresetId === preset.id && (
                          <View style={dynamicStyles.contextMenu}>
                            <TouchableOpacity
                              style={dynamicStyles.contextMenuItem}
                              onPress={() => {
                                handleToggleDefault(preset.id);
                                setLongPressedPresetId(null);
                              }}
                            >
                              <Text style={dynamicStyles.contextMenuText}>
                                {preset.isDefault ? t('remove_default') : t('set_as_default')}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={dynamicStyles.contextMenuItem}
                              onPress={() => {
                                setLongPressedPresetId(null);
                                handleDeletePreset(preset.id);
                              }}
                            >
                              <Text style={dynamicStyles.contextMenuTextDanger}>
                                {t('delete_preset')}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Save as Preset input row */}
              {showSaveInput ? (
                <View style={dynamicStyles.saveRow}>
                  <TextInput
                    style={dynamicStyles.saveInput}
                    placeholder={t('preset_name_placeholder')}
                    placeholderTextColor={colors.textTertiary}
                    value={presetName}
                    onChangeText={setPresetName}
                    maxLength={30}
                    autoFocus
                    onSubmitEditing={handleSavePreset}
                  />
                  <TouchableOpacity style={dynamicStyles.saveBtn} onPress={handleSavePreset}>
                    <Text style={dynamicStyles.saveBtnText}>{t('save_preset')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={dynamicStyles.cancelBtn}
                    onPress={() => {
                      setShowSaveInput(false);
                      setPresetName('');
                    }}
                  >
                    <Text style={dynamicStyles.cancelBtnText}>{t('cancel')}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {/* --- Existing filter sections --- */}
            <TouchableOpacity activeOpacity={1} onPress={handleBodyPress}>
              <Text style={dynamicStyles.sectionTitle}>Connector Type</Text>
              <View style={dynamicStyles.chipRow}>
                {CONNECTOR_TYPES.map((ct) => (
                  <TouchableOpacity
                    key={ct}
                    style={[
                      dynamicStyles.chip,
                      selectedConnectors.includes(ct) && dynamicStyles.chipActive,
                    ]}
                    onPress={() => {
                      setSelectedConnectors(toggleItem(selectedConnectors, ct));
                      setActivePresetId(null);
                    }}
                  >
                    <Text
                      style={[
                        dynamicStyles.chipText,
                        selectedConnectors.includes(ct) && dynamicStyles.chipTextActive,
                      ]}
                    >
                      {ct}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={dynamicStyles.sectionTitle}>Minimum Speed</Text>
              <View style={dynamicStyles.chipRow}>
                {SPEED_OPTIONS.map((s) => (
                  <TouchableOpacity
                    key={s.value}
                    style={[
                      dynamicStyles.chip,
                      minPower === s.value && dynamicStyles.chipActive,
                    ]}
                    onPress={() => {
                      setMinPower(s.value);
                      setActivePresetId(null);
                    }}
                  >
                    <Text
                      style={[
                        dynamicStyles.chipText,
                        minPower === s.value && dynamicStyles.chipTextActive,
                      ]}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={dynamicStyles.sectionTitle}>Max Price</Text>
              <View style={dynamicStyles.chipRow}>
                {PRICE_OPTIONS.map((p) => (
                  <TouchableOpacity
                    key={p.value}
                    style={[
                      dynamicStyles.chip,
                      maxPrice === p.value && dynamicStyles.chipActive,
                    ]}
                    onPress={() => {
                      setMaxPrice(p.value);
                      setActivePresetId(null);
                    }}
                  >
                    <Text
                      style={[
                        dynamicStyles.chipText,
                        maxPrice === p.value && dynamicStyles.chipTextActive,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={dynamicStyles.sectionTitle}>Amenities</Text>
              <View style={dynamicStyles.chipRow}>
                {AMENITY_OPTIONS.map((a) => (
                  <TouchableOpacity
                    key={a}
                    style={[
                      dynamicStyles.chip,
                      selectedAmenities.includes(a) && dynamicStyles.chipActive,
                    ]}
                    onPress={() => {
                      setSelectedAmenities(toggleItem(selectedAmenities, a));
                      setActivePresetId(null);
                    }}
                  >
                    <Text
                      style={[
                        dynamicStyles.chipText,
                        selectedAmenities.includes(a) && dynamicStyles.chipTextActive,
                      ]}
                    >
                      {a}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </ScrollView>

          {/* Footer */}
          <View style={dynamicStyles.footer}>
            {/* Save as Preset button — only show when filters are active and save input is not open */}
            {hasActiveFilters && !showSaveInput && presets.length < MAX_PRESETS && (
              <TouchableOpacity
                style={dynamicStyles.saveAsPresetBtn}
                onPress={() => setShowSaveInput(true)}
              >
                <Text style={dynamicStyles.saveAsPresetText}>{t('save_as_preset')}</Text>
              </TouchableOpacity>
            )}
            {hasActiveFilters && presets.length >= MAX_PRESETS && !showSaveInput && (
              <Text
                style={[
                  dynamicStyles.emptyPresetsText,
                  { textAlign: 'center', marginBottom: spacing.xs },
                ]}
              >
                {t('preset_limit_reached')}
              </Text>
            )}
            <Button title="Apply Filters" onPress={handleApply} size="lg" />
          </View>
        </View>
      </View>
    </Modal>
  );
}
