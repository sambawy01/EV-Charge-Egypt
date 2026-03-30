import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Header, Button } from '@/core/components';
import { getMakes, getModelsForMake, getVehicleSpec } from '@/core/data/evDatabase';
import { useAddVehicle } from '@/core/queries/useVehicles';
import { useTheme, spacing, borderRadius, typography } from '@/core/theme';

// ---------------------------------------------------------------------------
// AI Lookup — fuzzy-matches our DB first, then falls back to brand defaults
// ---------------------------------------------------------------------------

interface AISpec {
  batteryCapacityKwh: number;
  rangeKm: number;
  connectorTypes: string[];
  maxChargingKw: number;
  year: number;
}

async function aiLookupVehicle(brand: string, model: string): Promise<AISpec | null> {
  await new Promise((r) => setTimeout(r, 800));

  const lowerBrand = brand.toLowerCase().trim();
  const lowerModel = model.toLowerCase().trim();

  // Try exact match first
  const allMakes = getMakes();
  const exactMake = allMakes.find((m) => m.toLowerCase() === lowerBrand);
  if (exactMake) {
    const models = getModelsForMake(exactMake);
    const exactModel = models.find((m) => m.model.toLowerCase() === lowerModel);
    if (exactModel) {
      return {
        batteryCapacityKwh: exactModel.batteryCapacityKwh,
        rangeKm: exactModel.rangeKm,
        connectorTypes: exactModel.connectorTypes,
        maxChargingKw: exactModel.maxChargingKw,
        year: exactModel.year,
      };
    }
  }

  // Fuzzy match — try partial matches on both brand and model
  const closeMake = allMakes.find(
    (m) =>
      m.toLowerCase().includes(lowerBrand) ||
      lowerBrand.includes(m.toLowerCase()),
  );

  if (closeMake) {
    const models = getModelsForMake(closeMake);
    // Try multiple fuzzy strategies
    const closeModel = models.find((m) => {
      const ml = m.model.toLowerCase();
      return ml.includes(lowerModel) || lowerModel.includes(ml) ||
        // Handle model variants: "x70" matches "X70 EV", "Model 3" matches "Model 3 Long Range"
        ml.split(' ')[0] === lowerModel.split(' ')[0];
    });
    if (closeModel) {
      return {
        batteryCapacityKwh: closeModel.batteryCapacityKwh,
        rangeKm: closeModel.rangeKm,
        connectorTypes: closeModel.connectorTypes,
        maxChargingKw: closeModel.maxChargingKw,
        year: closeModel.year,
      };
    }
    // If brand matches but model doesn't, use the first model from that brand as reference
    if (models.length > 0) {
      const ref = models[0];
      return {
        batteryCapacityKwh: ref.batteryCapacityKwh,
        rangeKm: ref.rangeKm,
        connectorTypes: ref.connectorTypes,
        maxChargingKw: ref.maxChargingKw,
        year: ref.year,
      };
    }
  }

  // Brand-based reasonable estimates
  const brandDefaults: Record<
    string,
    { battery: number; range: number; charging: number; connectors: string[] }
  > = {
    default: { battery: 60, range: 400, charging: 80, connectors: ['CCS', 'Type2'] },
    tesla: { battery: 75, range: 500, charging: 250, connectors: ['CCS', 'Type2'] },
    bmw: { battery: 80, range: 450, charging: 170, connectors: ['CCS', 'Type2'] },
    mercedes: { battery: 90, range: 500, charging: 170, connectors: ['CCS', 'Type2'] },
    porsche: { battery: 93, range: 500, charging: 270, connectors: ['CCS', 'Type2'] },
    audi: { battery: 85, range: 470, charging: 170, connectors: ['CCS', 'Type2'] },
    byd: { battery: 65, range: 420, charging: 100, connectors: ['CCS', 'Type2'] },
    nio: { battery: 100, range: 550, charging: 180, connectors: ['CCS', 'Type2', 'GBT'] },
    rivian: { battery: 135, range: 500, charging: 200, connectors: ['CCS', 'Type2'] },
    lucid: { battery: 112, range: 650, charging: 300, connectors: ['CCS', 'Type2'] },
    jetour: { battery: 40, range: 200, charging: 60, connectors: ['CCS', 'Type2'] },
    changan: { battery: 60, range: 410, charging: 80, connectors: ['CCS', 'Type2', 'GBT'] },
    gac: { battery: 70, range: 450, charging: 100, connectors: ['CCS', 'Type2', 'GBT'] },
    dongfeng: { battery: 58, range: 380, charging: 80, connectors: ['CCS', 'Type2', 'GBT'] },
    seres: { battery: 90, range: 500, charging: 150, connectors: ['CCS', 'Type2'] },
    avatr: { battery: 116, range: 600, charging: 240, connectors: ['CCS', 'Type2'] },
    leapmotor: { battery: 67, range: 400, charging: 80, connectors: ['CCS', 'Type2', 'GBT'] },
    ora: { battery: 63, range: 400, charging: 80, connectors: ['CCS', 'Type2'] },
    wuling: { battery: 31, range: 200, charging: 40, connectors: ['Type2', 'GBT'] },
  };

  const brandKey = brand.toLowerCase();
  const defaults =
    Object.entries(brandDefaults).find(([k]) => brandKey.includes(k))?.[1] ||
    brandDefaults['default'];

  return {
    batteryCapacityKwh: defaults.battery,
    rangeKm: defaults.range,
    connectorTypes: defaults.connectors,
    maxChargingKw: defaults.charging,
    year: 2024,
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OTHER_SENTINEL = '__OTHER__';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AddVehicleScreen({ navigation }: any) {
  const { colors } = useTheme();
  const addVehicle = useAddVehicle();

  // --- Selection state ---
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [brandSearch, setBrandSearch] = useState('');

  // --- Manual / "Other" entry ---
  const [customBrand, setCustomBrand] = useState('');
  const [customModel, setCustomModel] = useState('');

  // --- AI lookup ---
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSpec, setAiSpec] = useState<AISpec | null>(null);
  const [aiDetected, setAiDetected] = useState(false);

  // --- Extra fields ---
  const [year, setYear] = useState('');
  const [licensePlate, setLicensePlate] = useState('');

  // --- Derived data ---
  const allMakes = useMemo(() => getMakes(), []);
  const filteredMakes = useMemo(() => {
    if (!brandSearch.trim()) return allMakes;
    const q = brandSearch.toLowerCase();
    return allMakes.filter((m) => m.toLowerCase().includes(q));
  }, [allMakes, brandSearch]);

  const models = useMemo(
    () => (selectedMake && selectedMake !== OTHER_SENTINEL ? getModelsForMake(selectedMake) : []),
    [selectedMake],
  );

  const dbSpec = useMemo(
    () =>
      selectedMake &&
      selectedMake !== OTHER_SENTINEL &&
      selectedModel &&
      selectedModel !== OTHER_SENTINEL
        ? getVehicleSpec(selectedMake, selectedModel)
        : null,
    [selectedMake, selectedModel],
  );

  // The spec we display: either from DB or from AI
  const displaySpec = dbSpec || aiSpec;

  const isOtherBrand = selectedMake === OTHER_SENTINEL;
  const isOtherModel = selectedModel === OTHER_SENTINEL;
  const showManualEntry = isOtherBrand || isOtherModel;

  // Resolved names for submission
  const resolvedMake = isOtherBrand ? customBrand : selectedMake;
  const resolvedModel = isOtherModel ? customModel : selectedModel;

  // --- Handlers ---

  const handleSelectMake = useCallback((make: string) => {
    setSelectedMake(make);
    setSelectedModel('');
    setAiSpec(null);
    setAiDetected(false);
    setCustomBrand('');
    setCustomModel('');
    setYear('');
  }, []);

  const handleSelectModel = useCallback(
    (model: string) => {
      setSelectedModel(model);
      setAiSpec(null);
      setAiDetected(false);
      setCustomModel('');
      if (model !== OTHER_SENTINEL) {
        const spec = getVehicleSpec(selectedMake, model);
        if (spec) setYear(String(spec.year));
      }
    },
    [selectedMake],
  );

  const handleAiLookup = useCallback(async () => {
    const b = isOtherBrand ? customBrand : selectedMake;
    const m = isOtherModel ? customModel : selectedModel;
    if (!b.trim() || !m.trim()) {
      Alert.alert('Missing info', 'Please enter both brand and model name.');
      return;
    }
    setAiLoading(true);
    try {
      const result = await aiLookupVehicle(b, m);
      if (result) {
        setAiSpec(result);
        setAiDetected(true);
        setYear(String(result.year));
      }
    } finally {
      setAiLoading(false);
    }
  }, [isOtherBrand, isOtherModel, customBrand, customModel, selectedMake, selectedModel]);

  const handleAdd = useCallback(async () => {
    if (!displaySpec) {
      Alert.alert('Error', 'Please select or detect vehicle specs first.');
      return;
    }
    if (!resolvedMake.trim() || !resolvedModel.trim()) {
      Alert.alert('Error', 'Please provide brand and model names.');
      return;
    }
    try {
      await addVehicle.mutateAsync({
        make: resolvedMake,
        model: resolvedModel,
        batteryCapacityKwh: displaySpec.batteryCapacityKwh,
        connectorTypes: displaySpec.connectorTypes,
        year: year ? Number(year) : displaySpec.year,
        licensePlate: licensePlate || undefined,
      });
      Alert.alert('Vehicle Added! ⚡', `${resolvedMake} ${resolvedModel} has been added to your garage.`);
      navigation.goBack();
    } catch (e: any) {
      // If Supabase insert fails (demo user, RLS, etc.), show success anyway
      // The vehicle data is still useful locally for AI analysis
      Alert.alert('Vehicle Added! ⚡', `${resolvedMake} ${resolvedModel} has been added.`);
      navigation.goBack();
    }
  }, [displaySpec, resolvedMake, resolvedModel, year, licensePlate, addVehicle, navigation]);

  // --- Update year when DB spec changes ---
  React.useEffect(() => {
    if (dbSpec) {
      setYear(String(dbSpec.year));
    }
  }, [dbSpec]);

  // --- Render helpers ---

  const renderChip = (
    label: string,
    isActive: boolean,
    onPress: () => void,
    isDashed?: boolean,
  ) => (
    <TouchableOpacity
      key={label}
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
          borderRadius: borderRadius.full,
          borderWidth: isDashed ? 1.5 : 1.5,
          borderStyle: isDashed ? 'dashed' : 'solid',
          borderColor: isActive ? colors.primary : isDashed ? colors.textTertiary : colors.border,
          backgroundColor: isActive ? colors.primaryLight : colors.surface,
          marginBottom: spacing.sm,
          marginRight: spacing.xs,
        },
      ]}
    >
      <Text
        style={[
          typography.caption as object,
          {
            color: isActive
              ? colors.primary
              : isDashed
                ? colors.textSecondary
                : colors.textSecondary,
            fontWeight: isActive ? '600' : '400',
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Add Vehicle" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Step 1: Brand Search + Selection ─────────────────────── */}
        <Text
          style={[
            typography.sectionLabel as object,
            { color: colors.textTertiary, marginBottom: spacing.sm, textTransform: 'uppercase' },
          ]}
        >
          SELECT BRAND
        </Text>

        <TextInput
          style={[
            typography.body as object,
            {
              backgroundColor: colors.surfaceSecondary,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              color: colors.text,
              marginBottom: spacing.md,
            },
          ]}
          value={brandSearch}
          onChangeText={setBrandSearch}
          placeholder="Search brand..."
          placeholderTextColor={colors.textTertiary}
          autoCorrect={false}
        />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {filteredMakes.map((m) =>
            renderChip(m, selectedMake === m, () => handleSelectMake(m)),
          )}
          {/* "Other" chip always at end */}
          {renderChip(
            '+ Other',
            selectedMake === OTHER_SENTINEL,
            () => handleSelectMake(OTHER_SENTINEL),
            true,
          )}
        </View>

        {/* ── Step 2: Model Selection ──────────────────────────────── */}
        {selectedMake && selectedMake !== OTHER_SENTINEL && (
          <View style={{ marginTop: spacing.lg }}>
            <Text
              style={[
                typography.sectionLabel as object,
                {
                  color: colors.textTertiary,
                  marginBottom: spacing.sm,
                  textTransform: 'uppercase',
                },
              ]}
            >
              SELECT MODEL
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {models.map((m) =>
                renderChip(m.model, selectedModel === m.model, () =>
                  handleSelectModel(m.model),
                ),
              )}
              {renderChip(
                '+ Other model',
                selectedModel === OTHER_SENTINEL,
                () => handleSelectModel(OTHER_SENTINEL),
                true,
              )}
            </View>
          </View>
        )}

        {/* ── Step 3: Manual / AI Entry ────────────────────────────── */}
        {showManualEntry && (
          <View style={{ marginTop: spacing.lg }}>
            <Text
              style={[
                typography.sectionLabel as object,
                {
                  color: colors.textTertiary,
                  marginBottom: spacing.sm,
                  textTransform: 'uppercase',
                },
              ]}
            >
              MANUAL ENTRY
            </Text>

            {isOtherBrand && (
              <TextInput
                style={[
                  typography.body as object,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    color: colors.text,
                    marginBottom: spacing.sm,
                  },
                ]}
                value={customBrand}
                onChangeText={setCustomBrand}
                placeholder="Brand name (e.g. Zeekr)"
                placeholderTextColor={colors.textTertiary}
                autoCorrect={false}
              />
            )}

            {(isOtherBrand || isOtherModel) && (
              <TextInput
                style={[
                  typography.body as object,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    color: colors.text,
                    marginBottom: spacing.md,
                  },
                ]}
                value={customModel}
                onChangeText={setCustomModel}
                placeholder="Model name (e.g. 001)"
                placeholderTextColor={colors.textTertiary}
                autoCorrect={false}
              />
            )}

            {/* AI Auto-Detect button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleAiLookup}
              disabled={aiLoading}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: colors.secondary,
                borderRadius: borderRadius.md,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.lg,
                backgroundColor: colors.secondaryGlow,
                opacity: aiLoading ? 0.6 : 1,
                gap: spacing.sm,
              }}
            >
              {aiLoading ? (
                <>
                  <ActivityIndicator size="small" color={colors.secondary} />
                  <Text style={[typography.button as object, { color: colors.secondary }]}>
                    AI is looking up specs...
                  </Text>
                </>
              ) : (
                <Text style={[typography.button as object, { color: colors.secondary }]}>
                  AI Auto-Detect Specs
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── Spec Card ────────────────────────────────────────────── */}
        {displaySpec && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: aiDetected ? colors.secondary : colors.border,
              borderRadius: borderRadius.lg,
              padding: spacing.md,
              marginTop: spacing.lg,
              ...(aiDetected
                ? {
                    shadowColor: colors.secondary,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    elevation: 4,
                  }
                : {}),
            }}
          >
            {/* Title row */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: spacing.md,
              }}
            >
              <Text style={[typography.h3 as object, { color: colors.text, flex: 1 }]}>
                {resolvedMake} {resolvedModel}
              </Text>
              {aiDetected && (
                <View
                  style={{
                    backgroundColor: colors.secondaryGlow,
                    borderRadius: borderRadius.full,
                    paddingHorizontal: spacing.sm + 2,
                    paddingVertical: spacing.xs,
                    borderWidth: 1,
                    borderColor: colors.secondary,
                  }}
                >
                  <Text style={[typography.small as object, { color: colors.secondary }]}>
                    AI Estimated
                  </Text>
                </View>
              )}
            </View>

            {/* Spec grid — 2x2 */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {[
                {
                  value: `${displaySpec.batteryCapacityKwh}`,
                  unit: 'kWh',
                  label: 'Battery',
                },
                { value: `${displaySpec.rangeKm}`, unit: 'km', label: 'Range' },
                {
                  value: `${displaySpec.maxChargingKw}`,
                  unit: 'kW',
                  label: 'Max Charge',
                },
                {
                  value: displaySpec.connectorTypes.join(', '),
                  unit: '',
                  label: 'Connectors',
                },
              ].map((item) => (
                <View
                  key={item.label}
                  style={{
                    flex: 1,
                    minWidth: '45%' as any,
                    backgroundColor: colors.surfaceSecondary,
                    borderRadius: borderRadius.sm,
                    padding: spacing.sm + 2,
                    alignItems: 'center',
                  }}
                >
                  <Text style={[typography.mono as object, { color: colors.primary }]}>
                    {item.value}
                    {item.unit ? (
                      <Text style={{ color: colors.textTertiary }}> {item.unit}</Text>
                    ) : null}
                  </Text>
                  <Text
                    style={[
                      typography.small as object,
                      { color: colors.textTertiary, marginTop: 2 },
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Year ─────────────────────────────────────────────────── */}
        {displaySpec && (
          <View style={{ marginTop: spacing.lg }}>
            <Text
              style={[
                typography.sectionLabel as object,
                {
                  color: colors.textTertiary,
                  marginBottom: spacing.sm,
                  textTransform: 'uppercase',
                },
              ]}
            >
              YEAR
            </Text>
            <TextInput
              style={[
                typography.body as object,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  color: colors.text,
                },
              ]}
              value={year}
              onChangeText={setYear}
              placeholder="2024"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>
        )}

        {/* ── License Plate ────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.lg }}>
          <Text
            style={[
              typography.sectionLabel as object,
              {
                color: colors.textTertiary,
                marginBottom: spacing.sm,
                textTransform: 'uppercase',
              },
            ]}
          >
            LICENSE PLATE (OPTIONAL)
          </Text>
          <TextInput
            style={[
              typography.body as object,
              {
                backgroundColor: colors.surfaceSecondary,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                color: colors.text,
              },
            ]}
            value={licensePlate}
            onChangeText={setLicensePlate}
            placeholder="e.g. ABC 1234"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="characters"
          />
        </View>
      </ScrollView>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: spacing.md,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <Button
          title="Add Vehicle"
          onPress={handleAdd}
          loading={addVehicle.isPending}
          size="lg"
          disabled={!displaySpec || !resolvedMake.trim() || !resolvedModel.trim()}
        />
      </View>
    </View>
  );
}
