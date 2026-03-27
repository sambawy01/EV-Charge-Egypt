import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/core/theme';
import { typography } from '@/core/theme/typography';
import { useVehicles } from '@/core/queries/useVehicles';
import {
  vehicleAnalysisService,
  VehicleAnalysis,
} from '@/core/services/vehicleAnalysisService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AIEstimateBadge({ colors }: { colors: any }) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: colors.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginBottom: 12,
      }}
    >
      <Text style={{ ...typography.small, color: colors.textTertiary }}>
        AI Estimate
      </Text>
    </View>
  );
}

function SectionTitle({ emoji, title, colors }: { emoji: string; title: string; colors: any }) {
  return (
    <Text style={{ ...typography.h3, color: colors.text, marginBottom: 16 }}>
      {emoji} {title}
    </Text>
  );
}

function MetricCard({
  value,
  label,
  valueColor,
  colors,
}: {
  value: string;
  label: string;
  valueColor: string;
  colors: any;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 14,
        minWidth: (SCREEN_WIDTH - 60) / 2,
      }}
    >
      <Text style={{ ...typography.mono, fontSize: 22, color: valueColor, marginBottom: 4 }}>
        {value}
      </Text>
      <Text style={{ ...typography.caption, color: colors.textSecondary }}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export function VehicleDashboardScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles();
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [analysis, setAnalysis] = useState<VehicleAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Auto-select first vehicle
  useEffect(() => {
    if (vehicles?.length && !selectedVehicle) {
      setSelectedVehicle(vehicles[0]);
    }
  }, [vehicles]);

  // Run analysis when vehicle changes
  useEffect(() => {
    if (selectedVehicle) {
      setAnalysisLoading(true);
      vehicleAnalysisService
        .analyzeVehicle(selectedVehicle)
        .then(setAnalysis)
        .finally(() => setAnalysisLoading(false));
    }
  }, [selectedVehicle]);

  const handleAddVehicle = useCallback(() => {
    navigation?.navigate?.('AddVehicle');
  }, [navigation]);

  // ---- No vehicle state ----
  if (!vehiclesLoading && (!vehicles || vehicles.length === 0)) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 40,
        }}
      >
        <Text style={{ ...typography.h2, color: colors.text, textAlign: 'center', marginBottom: 12 }}>
          No Vehicles Yet
        </Text>
        <Text
          style={{
            ...typography.body,
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: 28,
          }}
        >
          Add your first EV to see AI-powered analytics
        </Text>
        <TouchableOpacity
          onPress={handleAddVehicle}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 28,
            paddingVertical: 14,
            borderRadius: 12,
          }}
        >
          <Text style={{ ...typography.button, color: colors.black }}>Add Vehicle</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ---- Loading state ----
  if (vehiclesLoading || analysisLoading || !analysis) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: 16 }}>
          Analyzing your vehicle...
        </Text>
      </View>
    );
  }

  const { battery, consumption, charging, insights } = analysis;
  const vehicleName = `${selectedVehicle.make} ${selectedVehicle.model}`;
  const batteryKwh = selectedVehicle.battery_capacity_kwh || 60;
  const estimatedRangeKm = Math.round(batteryKwh * 6.5 * (battery.healthScore / 100));

  // Health score color
  const healthColor =
    battery.healthScore > 80
      ? colors.primary
      : battery.healthScore > 50
        ? colors.warning
        : colors.error;

  // Monthly spending bar chart helpers
  const maxSpending = Math.max(...consumption.monthlySpending.map((m) => m.amount));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ============================================================ */}
      {/* HEADER                                                       */}
      {/* ============================================================ */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 60,
          paddingBottom: 8,
        }}
      >
        <Text style={{ ...typography.h2, color: colors.text }}>My Vehicle</Text>
        <TouchableOpacity
          onPress={handleAddVehicle}
          style={{
            backgroundColor: colors.primaryLight,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.primaryGlow,
          }}
        >
          <Text style={{ ...typography.button, color: colors.primary, fontSize: 13 }}>
            + Add Vehicle
          </Text>
        </TouchableOpacity>
      </View>

      {/* ============================================================ */}
      {/* VEHICLE SELECTOR                                             */}
      {/* ============================================================ */}
      {vehicles && vehicles.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 10 }}
        >
          {vehicles.map((v: any) => {
            const isSelected = v.id === selectedVehicle?.id;
            return (
              <TouchableOpacity
                key={v.id}
                onPress={() => setSelectedVehicle(v)}
                style={{
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    ...typography.bodyBold,
                    color: isSelected ? colors.black : colors.text,
                    fontSize: 13,
                  }}
                >
                  {v.make} {v.model}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ============================================================ */}
      {/* HERO CARD                                                    */}
      {/* ============================================================ */}
      <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
        <LinearGradient
          colors={[colors.surfaceTertiary, colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.primaryGlow,
            padding: 24,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.25 : 0.1,
            shadowRadius: 20,
            elevation: 8,
          }}
        >
          {/* Battery ring */}
          <View style={{ alignItems: 'center', marginRight: 24 }}>
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                borderWidth: 6,
                borderColor: colors.border,
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              {/* Colored progress overlay — we simulate with a top-layer ring */}
              <View
                style={{
                  position: 'absolute',
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  borderWidth: 6,
                  borderColor: healthColor,
                  // Clip to show percentage — approximate with opacity-based approach
                  opacity: battery.healthScore / 100,
                }}
              />
              <Text
                style={{
                  ...typography.mono,
                  fontSize: 48,
                  color: healthColor,
                  lineHeight: 52,
                }}
              >
                {battery.healthScore}
              </Text>
            </View>
            <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 8 }}>
              Battery Health
            </Text>
          </View>

          {/* Vehicle info */}
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.h3, color: colors.text, marginBottom: 8 }}>
              {vehicleName}
            </Text>
            {selectedVehicle.year && (
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: 6 }}>
                {selectedVehicle.year}
              </Text>
            )}
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 10 }}>
              <View>
                <Text style={{ ...typography.mono, color: colors.primary }}>{batteryKwh} kWh</Text>
                <Text style={{ ...typography.small, color: colors.textTertiary }}>Battery</Text>
              </View>
              <View>
                <Text style={{ ...typography.mono, color: colors.secondary }}>
                  {estimatedRangeKm} km
                </Text>
                <Text style={{ ...typography.small, color: colors.textTertiary }}>Est. Range</Text>
              </View>
            </View>
            {selectedVehicle.connector_types?.length > 0 && (
              <Text style={{ ...typography.small, color: colors.textTertiary }}>
                {selectedVehicle.connector_types.join(' / ')}
              </Text>
            )}
          </View>
        </LinearGradient>
      </View>

      {/* ============================================================ */}
      {/* PLAN A TRIP BUTTON                                           */}
      {/* ============================================================ */}
      <TouchableOpacity
        onPress={() => navigation?.navigate?.('TripPlanner')}
        activeOpacity={0.8}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surfaceSecondary,
          borderWidth: 1.5,
          borderColor: colors.secondary,
          borderRadius: 12,
          paddingVertical: 14,
          paddingHorizontal: 20,
          gap: 8,
          marginHorizontal: 20,
          marginTop: 16,
          shadowColor: colors.secondary,
          shadowOpacity: 0.3,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 10,
          elevation: 5,
        }}
      >
        <Text style={{ fontSize: 20 }}>{'\uD83D\uDDFA\uFE0F'}</Text>
        <Text style={{ fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 16, color: colors.secondary }}>
          Plan a Trip
        </Text>
      </TouchableOpacity>

      {/* ============================================================ */}
      {/* BATTERY HEALTH SECTION                                       */}
      {/* ============================================================ */}
      <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
        <AIEstimateBadge colors={colors} />
        <SectionTitle emoji={'\uD83D\uDD0B'} title="Battery Health" colors={colors} />

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <MetricCard
            value={`${battery.estimatedDegradation}%`}
            label="Degradation"
            valueColor={battery.estimatedDegradation > 10 ? colors.error : colors.warning}
            colors={colors}
          />
          <MetricCard
            value={`${battery.estimatedCycles}`}
            label="Charge Cycles"
            valueColor={colors.text}
            colors={colors}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <MetricCard
            value={`${battery.optimalChargeMin}-${battery.optimalChargeMax}%`}
            label="Optimal Range"
            valueColor={colors.secondary}
            colors={colors}
          />
          <MetricCard
            value={`${battery.estimatedLifeYears} yrs`}
            label="Life Remaining"
            valueColor={colors.primary}
            colors={colors}
          />
        </View>

        {/* Temperature note */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <Text style={{ fontSize: 20 }}>{'\uD83C\uDF21\uFE0F'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.bodyBold, color: colors.text, marginBottom: 4 }}>
              Temperature Impact:{' '}
              <Text
                style={{
                  color:
                    battery.temperatureImpact === 'high'
                      ? colors.error
                      : battery.temperatureImpact === 'moderate'
                        ? colors.warning
                        : colors.secondary,
                }}
              >
                {battery.temperatureImpact.charAt(0).toUpperCase() +
                  battery.temperatureImpact.slice(1)}
              </Text>
            </Text>
            <Text style={{ ...typography.caption, color: colors.textSecondary, lineHeight: 20 }}>
              {battery.temperatureNote}
            </Text>
          </View>
        </View>
      </View>

      {/* ============================================================ */}
      {/* CONSUMPTION ANALYTICS SECTION                                */}
      {/* ============================================================ */}
      <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
        <AIEstimateBadge colors={colors} />
        <SectionTitle emoji={'\uD83D\uDCCA'} title="Consumption" colors={colors} />

        {/* Stats row */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
          }}
        >
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ ...typography.mono, fontSize: 18, color: colors.primary }}>
              {consumption.avgKwhPer100km}
            </Text>
            <Text style={{ ...typography.small, color: colors.textTertiary, marginTop: 2 }}>
              kWh/100km
            </Text>
          </View>
          <View
            style={{
              width: 1,
              backgroundColor: colors.border,
              marginHorizontal: 8,
            }}
          />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ ...typography.mono, fontSize: 18, color: colors.primary }}>
              {consumption.costPerKmEGP}
            </Text>
            <Text style={{ ...typography.small, color: colors.textTertiary, marginTop: 2 }}>
              EGP/km
            </Text>
          </View>
          <View
            style={{
              width: 1,
              backgroundColor: colors.border,
              marginHorizontal: 8,
            }}
          />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ ...typography.mono, fontSize: 18, color: colors.secondary }}>
              {consumption.efficiencyVsSpec}%
            </Text>
            <Text style={{ ...typography.small, color: colors.textTertiary, marginTop: 2 }}>
              vs Spec
            </Text>
          </View>
        </View>

        {/* Monthly spending bar chart */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text style={{ ...typography.bodyBold, color: colors.text, marginBottom: 16 }}>
            Monthly Spending (EGP)
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 8 }}>
            {consumption.monthlySpending.map((m, i) => {
              const barHeight = maxSpending > 0 ? (m.amount / maxSpending) * 80 : 0;
              return (
                <View key={m.month} style={{ flex: 1, alignItems: 'center' }}>
                  <Text
                    style={{
                      ...typography.small,
                      color: colors.textSecondary,
                      fontSize: 10,
                      marginBottom: 4,
                    }}
                  >
                    {m.amount}
                  </Text>
                  <View
                    style={{
                      width: '70%',
                      height: barHeight,
                      backgroundColor: colors.primary,
                      borderRadius: 4,
                      opacity: 0.85 + (i / consumption.monthlySpending.length) * 0.15,
                    }}
                  />
                  <Text
                    style={{
                      ...typography.small,
                      color: colors.textTertiary,
                      marginTop: 6,
                      fontSize: 10,
                    }}
                  >
                    {m.month}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* CO2 saved card */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <Text style={{ fontSize: 32 }}>{'\uD83C\uDF33'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.mono, fontSize: 28, color: colors.secondary }}>
              {consumption.co2SavedKg.toLocaleString()} kg
            </Text>
            <Text style={{ ...typography.caption, color: colors.textSecondary }}>
              CO2 saved vs petrol vehicle
            </Text>
          </View>
        </View>
      </View>

      {/* ============================================================ */}
      {/* CHARGING PATTERNS SECTION                                    */}
      {/* ============================================================ */}
      <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
        <AIEstimateBadge colors={colors} />
        <SectionTitle emoji={'\u26A1'} title="Charging Patterns" colors={colors} />

        {/* Preferred time + weekly avg row */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 14,
            }}
          >
            <Text style={{ ...typography.small, color: colors.textTertiary, marginBottom: 4 }}>
              Preferred Time
            </Text>
            <Text style={{ ...typography.mono, fontSize: 13, color: colors.primary }}>
              {charging.preferredTime}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 14,
            }}
          >
            <Text style={{ ...typography.small, color: colors.textTertiary, marginBottom: 4 }}>
              Avg/Week
            </Text>
            <Text style={{ ...typography.mono, fontSize: 22, color: colors.text }}>
              {charging.avgChargesPerWeek}
            </Text>
            <Text style={{ ...typography.small, color: colors.textTertiary }}>charges</Text>
          </View>
        </View>

        {/* DC vs AC ratio */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text style={{ ...typography.bodyBold, color: colors.text, marginBottom: 12 }}>
            DC vs AC Charging
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, height: 28, borderRadius: 8, overflow: 'hidden' }}>
            <View
              style={{
                flex: charging.dcVsAcRatio.dc,
                backgroundColor: colors.primary,
                borderRadius: 6,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ ...typography.small, color: colors.black, fontWeight: '700' }}>
                DC {charging.dcVsAcRatio.dc}%
              </Text>
            </View>
            <View
              style={{
                flex: charging.dcVsAcRatio.ac,
                backgroundColor: colors.secondary,
                borderRadius: 6,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ ...typography.small, color: colors.black, fontWeight: '700' }}>
                AC {charging.dcVsAcRatio.ac}%
              </Text>
            </View>
          </View>
        </View>

        {/* Top stations */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <Text style={{ ...typography.bodyBold, color: colors.text, marginBottom: 12 }}>
            Top Stations
          </Text>
          {charging.topStations.map((station, i) => (
            <View
              key={station.name}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 10,
                borderTopWidth: i > 0 ? 1 : 0,
                borderTopColor: colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    backgroundColor: colors.primaryLight,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ ...typography.mono, color: colors.primary, fontSize: 12 }}>
                    {i + 1}
                  </Text>
                </View>
                <Text
                  style={{ ...typography.body, color: colors.text, flex: 1 }}
                  numberOfLines={1}
                >
                  {station.name}
                </Text>
              </View>
              <Text style={{ ...typography.mono, color: colors.textSecondary }}>
                {station.visits} visits
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* ============================================================ */}
      {/* AI INSIGHTS SECTION                                          */}
      {/* ============================================================ */}
      <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
        <SectionTitle emoji={'\uD83E\uDD16'} title="AI Insights" colors={colors} />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {insights.slice(0, 4).map((insight, i) => {
            const borderColors = ['#00D4FF', '#00FF88', '#D946EF', '#FFB020'];
            const glowColors = ['rgba(0,212,255,0.25)', 'rgba(0,255,136,0.25)', 'rgba(217,70,239,0.25)', 'rgba(255,176,32,0.25)'];
            const outlineColor = borderColors[i % borderColors.length];
            const glowColor = glowColors[i % glowColors.length];
            return (
              <View
                key={i}
                style={{
                  width: '48.5%',
                  minHeight: 150,
                  backgroundColor: colors.surface,
                  borderWidth: 1.5,
                  borderColor: outlineColor,
                  borderRadius: 16,
                  padding: 16,
                  justifyContent: 'space-between',
                  shadowColor: outlineColor,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                <View>
                  <Text style={{ fontSize: 28, marginBottom: 10 }}>{insight.icon}</Text>
                  <Text style={{
                    ...typography.h3,
                    color: outlineColor,
                    marginBottom: 6,
                    fontSize: 16,
                  }}>
                    {insight.title}
                  </Text>
                </View>
                <Text
                  style={{
                    ...typography.body,
                    color: 'rgba(255,255,255,0.85)',
                    lineHeight: 22,
                    fontSize: 14,
                  }}
                  numberOfLines={5}
                >
                  {insight.description}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Last updated note */}
      <View style={{ paddingHorizontal: 20, marginTop: 24, alignItems: 'center' }}>
        <Text style={{ ...typography.small, color: colors.textTertiary }}>
          Last analyzed: {new Date(analysis.lastUpdated).toLocaleString()}
        </Text>
      </View>
    </ScrollView>
  );
}
