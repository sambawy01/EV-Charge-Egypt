import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/core/theme';
import { typography } from '@/core/theme/typography';
import { useVehicles } from '@/core/queries/useVehicles';
import { evDatabase, EVModel } from '@/core/data/evDatabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChargingStop {
  stationName: string;
  location: string;
  distanceFromStart: number;
  arrivalBattery: number;
  chargeToPercent: number;
  chargeDuration: number;
  chargeCost: number;
  chargerType: string;
  attractions: { name: string; type: string; distance: string; icon: string }[];
}

interface TripPlan {
  from: string;
  to: string;
  totalDistance: number;
  totalTime: string;
  totalChargeCost: number;
  arrivalBattery: number;
  stops: ChargingStop[];
}

type ChargingStrategy = 'quick' | 'fewer';
type Step = 1 | 2 | 3;

// ---------------------------------------------------------------------------
// Popular routes
// ---------------------------------------------------------------------------

const POPULAR_ROUTES = [
  { label: 'Cairo \u2192 Hurghada', from: 'Cairo', to: 'Hurghada' },
  { label: 'Cairo \u2192 Alexandria', from: 'Cairo', to: 'Alexandria' },
  { label: 'Cairo \u2192 Sharm', from: 'Cairo', to: 'Sharm El Sheikh' },
  { label: 'Cairo \u2192 Ain Sokhna', from: 'Cairo', to: 'Ain Sokhna' },
];

const SPEED_OPTIONS = [100, 120, 140, 160];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function TripPlannerScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const { data: vehicles } = useVehicles();

  // Trip setup state
  const [step, setStep] = useState<Step>(1);
  const [from, setFrom] = useState('Cairo');
  const [to, setTo] = useState('');
  const [batteryLevel, setBatteryLevel] = useState(80);
  const [avgSpeed, setAvgSpeed] = useState(120);
  const [chargingStrategy, setChargingStrategy] = useState<ChargingStrategy>('quick');
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);

  // Vehicle
  const selectedVehicle = vehicles?.[0] || null;
  const spec: EVModel | undefined = selectedVehicle
    ? evDatabase.find(
        (ev) =>
          ev.make.toLowerCase() === selectedVehicle.make?.toLowerCase() &&
          ev.model.toLowerCase() === selectedVehicle.model?.toLowerCase(),
      )
    : undefined;

  // Step 2 animation state
  const [planningSteps, setPlanningSteps] = useState<number[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ---------------------------------------------------------------------------
  // Trip plan generator
  // ---------------------------------------------------------------------------

  const generateTripPlan = useCallback((): TripPlan => {
    const routes: Record<string, { distance: number; stops: any[] }> = {
      hurghada: {
        distance: 460,
        stops:
          chargingStrategy === 'quick'
            ? [
                {
                  stationName: 'Elsewedy Plug - SUT Ismailia Desert Road',
                  location: 'Ismailia Desert Road, KM 95',
                  distanceFromStart: 95,
                  chargerType: 'CCS2 50kW',
                  attractions: [
                    { name: 'Oasis Rest House', type: 'Restaurant', distance: '50m', icon: '\uD83C\uDF7D\uFE0F' },
                    { name: 'Desert Star Cafe', type: 'Coffee', distance: '100m', icon: '\u2615' },
                  ],
                },
                {
                  stationName: 'IKARUS Zafarana',
                  location: 'Zafarana Rest Area, KM 220',
                  distanceFromStart: 220,
                  chargerType: 'CCS2 120kW',
                  attractions: [
                    { name: 'Red Sea Bakery', type: 'Bakery', distance: '200m', icon: '\uD83E\uDD50' },
                    { name: 'Zafarana Viewpoint', type: 'Scenic', distance: '500m', icon: '\uD83C\uDF05' },
                  ],
                },
                {
                  stationName: 'Revolta Egypt - Wataniya Ras Gharib',
                  location: 'Ras Gharib, KM 340',
                  distanceFromStart: 340,
                  chargerType: 'CCS2 50kW',
                  attractions: [
                    { name: 'Gulf Star Cafe', type: 'Coffee', distance: '150m', icon: '\u2615' },
                    { name: 'Ras Gharib Beach', type: 'Beach', distance: '1km', icon: '\uD83C\uDFD6\uFE0F' },
                  ],
                },
              ]
            : [
                {
                  stationName: 'IKARUS Zafarana',
                  location: 'Zafarana Rest Area, KM 220',
                  distanceFromStart: 220,
                  chargerType: 'CCS2 120kW',
                  attractions: [
                    { name: 'Red Sea Bakery', type: 'Bakery', distance: '200m', icon: '\uD83E\uDD50' },
                    { name: 'Zafarana Viewpoint', type: 'Scenic', distance: '500m', icon: '\uD83C\uDF05' },
                    { name: 'Desert Star Cafe', type: 'Coffee', distance: '300m', icon: '\u2615' },
                  ],
                },
                {
                  stationName: 'Revolta Egypt - Wataniya Ras Gharib',
                  location: 'Ras Gharib, KM 340',
                  distanceFromStart: 340,
                  chargerType: 'CCS2 50kW',
                  attractions: [
                    { name: 'Gulf Star Cafe', type: 'Coffee', distance: '150m', icon: '\u2615' },
                    { name: 'Ras Gharib Beach', type: 'Beach', distance: '1km', icon: '\uD83C\uDFD6\uFE0F' },
                  ],
                },
              ],
      },
      alexandria: {
        distance: 220,
        stops: [
          {
            stationName: 'Revolta Egypt - Watania Cairo-Alex Desert Road',
            location: 'Desert Road Rest Stop, KM 110',
            distanceFromStart: 110,
            chargerType: 'CCS2 50kW',
            attractions: [
              { name: 'Highway Cafe', type: 'Coffee', distance: '50m', icon: '\u2615' },
              { name: 'Wadi Natrun Monastery', type: 'Historic', distance: '15km', icon: '\uD83C\uDFDB\uFE0F' },
            ],
          },
        ],
      },
      sharm: {
        distance: 500,
        stops:
          chargingStrategy === 'quick'
            ? [
                {
                  stationName: 'Elsewedy Plug - SUT Ismailia Desert Road',
                  location: 'Suez Road, KM 120',
                  distanceFromStart: 120,
                  chargerType: 'CCS2 50kW',
                  attractions: [
                    { name: 'Suez Canal View', type: 'Scenic', distance: '5km', icon: '\uD83C\uDF05' },
                  ],
                },
                {
                  stationName: 'Revolta Egypt - Watania Sharm Road',
                  location: 'El Tor, KM 350',
                  distanceFromStart: 350,
                  chargerType: 'CCS2 50kW',
                  attractions: [
                    { name: 'El Tor Seafood', type: 'Restaurant', distance: '200m', icon: '\uD83C\uDF7D\uFE0F' },
                    { name: 'Moses Springs', type: 'Historic', distance: '10km', icon: '\uD83C\uDFDB\uFE0F' },
                  ],
                },
              ]
            : [
                {
                  stationName: 'Revolta Egypt - Watania Sharm Road',
                  location: 'El Tor, KM 350',
                  distanceFromStart: 350,
                  chargerType: 'CCS2 50kW',
                  attractions: [
                    { name: 'El Tor Seafood', type: 'Restaurant', distance: '200m', icon: '\uD83C\uDF7D\uFE0F' },
                    { name: 'Moses Springs', type: 'Historic', distance: '10km', icon: '\uD83C\uDFDB\uFE0F' },
                  ],
                },
              ],
      },
      'ain sokhna': {
        distance: 130,
        stops: [
          {
            stationName: 'Elsewedy Plug - Ain Sokhna Road',
            location: 'Ain Sokhna Road, KM 65',
            distanceFromStart: 65,
            chargerType: 'CCS2 50kW',
            attractions: [
              { name: 'Road Cafe', type: 'Coffee', distance: '100m', icon: '\u2615' },
            ],
          },
        ],
      },
    };

    const dest = to.toLowerCase();
    const routeKey = Object.keys(routes).find((k) => dest.includes(k)) || 'hurghada';
    const route = routes[routeKey];

    const speedFactor = avgSpeed > 120 ? 1 + (avgSpeed - 120) * 0.008 : 1;
    const vehicleBatteryKwh = selectedVehicle?.battery_capacity_kwh || 60;
    const baseConsumption = (vehicleBatteryKwh / (spec?.rangeKm || 400)) * 100;
    const actualConsumption = baseConsumption * speedFactor;

    let currentBattery = batteryLevel;
    const stops: ChargingStop[] = route.stops.map((stop: any, i: number) => {
      const prevDist = i === 0 ? 0 : route.stops[i - 1].distanceFromStart;
      const segmentDist = stop.distanceFromStart - prevDist;
      const energyUsed = (segmentDist / 100) * actualConsumption;
      const batteryUsed = (energyUsed / vehicleBatteryKwh) * 100;
      const arrivalBattery = Math.max(Math.round(currentBattery - batteryUsed), 5);

      const chargeToPercent = chargingStrategy === 'quick' ? 65 : 85;
      const chargeAmount = chargeToPercent - arrivalBattery;
      const chargeKwh = (chargeAmount / 100) * vehicleBatteryKwh;
      const chargeSpeed = parseInt(stop.chargerType.match(/\d+/)?.[0] || '50', 10);
      const chargeDuration = Math.round((chargeKwh / chargeSpeed) * 60);
      const chargeCost = Math.round(chargeKwh * 3.5);

      currentBattery = chargeToPercent;

      return {
        ...stop,
        arrivalBattery,
        chargeToPercent,
        chargeDuration: Math.max(chargeDuration, 5),
        chargeCost: Math.max(chargeCost, 10),
      };
    });

    const lastStop = stops[stops.length - 1];
    const finalDist = route.distance - (lastStop?.distanceFromStart || 0);
    const finalEnergy = (finalDist / 100) * actualConsumption;
    const finalBatteryUsed = (finalEnergy / vehicleBatteryKwh) * 100;
    const arrivalBattery = Math.max(Math.round(currentBattery - finalBatteryUsed), 5);

    const totalChargeTime = stops.reduce((sum, s) => sum + s.chargeDuration, 0);
    const driveTime = Math.round((route.distance / avgSpeed) * 60);
    const totalMinutes = driveTime + totalChargeTime;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    return {
      from,
      to,
      totalDistance: route.distance,
      totalTime: `${hours}h ${mins}m`,
      totalChargeCost: stops.reduce((sum, s) => sum + s.chargeCost, 0),
      arrivalBattery,
      stops,
    };
  }, [from, to, batteryLevel, avgSpeed, chargingStrategy, selectedVehicle, spec]);

  // ---------------------------------------------------------------------------
  // Step 2 animation logic
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (step !== 2) return;

    setPlanningSteps([]);

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setPlanningSteps((p) => [...p, 0]), 400));
    timers.push(setTimeout(() => setPlanningSteps((p) => [...p, 1]), 1000));
    timers.push(setTimeout(() => setPlanningSteps((p) => [...p, 2]), 1800));
    timers.push(setTimeout(() => setPlanningSteps((p) => [...p, 3]), 2400));
    timers.push(
      setTimeout(() => {
        const plan = generateTripPlan();
        setTripPlan(plan);
        setStep(3);
      }, 3200),
    );

    return () => {
      pulse.stop();
      timers.forEach(clearTimeout);
    };
  }, [step]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handlePlanTrip = () => {
    if (!to.trim()) {
      Alert.alert('Destination Required', 'Please enter a destination to plan your trip.');
      return;
    }
    setStep(2);
  };

  const handlePopularRoute = (route: (typeof POPULAR_ROUTES)[number]) => {
    setFrom(route.from);
    setTo(route.to);
  };

  const adjustBattery = (delta: number) => {
    setBatteryLevel((prev) => Math.min(100, Math.max(5, prev + delta)));
  };

  // ---------------------------------------------------------------------------
  // Render Step 1: Trip Setup
  // ---------------------------------------------------------------------------

  const renderStep1 = () => (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 }}>
        <TouchableOpacity
          onPress={() => navigation?.goBack?.()}
          style={{ marginBottom: 16 }}
        >
          <Text style={{ ...typography.body, color: colors.textSecondary }}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={{ ...typography.h2, color: colors.primary }}>
          {'\u26A1'} AI Trip Planner
        </Text>
        <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: 6 }}>
          Plan your perfect EV road trip
        </Text>
      </View>

      {/* From / To */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
            padding: 16,
            gap: 12,
          }}
        >
          {/* From */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 18 }}>{'\uD83D\uDCCD'}</Text>
            <TextInput
              value={from}
              onChangeText={setFrom}
              placeholder="From"
              placeholderTextColor={colors.textTertiary}
              style={{
                flex: 1,
                ...typography.body,
                color: colors.text,
                backgroundColor: colors.surfaceSecondary,
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
          </View>
          {/* Separator */}
          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginLeft: 38,
            }}
          />
          {/* To */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 18 }}>{'\uD83C\uDFC1'}</Text>
            <TextInput
              value={to}
              onChangeText={setTo}
              placeholder="Destination"
              placeholderTextColor={colors.textTertiary}
              style={{
                flex: 1,
                ...typography.body,
                color: colors.text,
                backgroundColor: colors.surfaceSecondary,
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
          </View>
        </View>

        {/* Popular Routes */}
        <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 14, marginBottom: 8 }}>
          Popular Routes
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {POPULAR_ROUTES.map((route) => (
            <TouchableOpacity
              key={route.label}
              onPress={() => handlePopularRoute(route)}
              style={{
                backgroundColor:
                  from === route.from && to === route.to ? colors.primaryLight : colors.surfaceSecondary,
                borderWidth: 1,
                borderColor:
                  from === route.from && to === route.to ? colors.primary : colors.border,
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  ...typography.caption,
                  color: from === route.from && to === route.to ? colors.primary : colors.textSecondary,
                }}
              >
                {route.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Vehicle Card */}
      {selectedVehicle && (
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: 8 }}>
            Vehicle
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: colors.primaryLight,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 22 }}>{'\uD83D\uDD0B'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.bodyBold, color: colors.text }}>
                {selectedVehicle.make} {selectedVehicle.model}
              </Text>
              <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                {selectedVehicle.battery_capacity_kwh || 60} kWh
                {spec ? ` \u00B7 ${spec.rangeKm} km range` : ''}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: colors.secondaryGlow,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Text style={{ ...typography.small, color: colors.secondary }}>Selected</Text>
            </View>
          </View>
        </View>
      )}

      {/* Battery Level */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: 8 }}>
          Current Battery Level
        </Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => adjustBattery(-5)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: colors.surfaceSecondary,
                borderWidth: 1,
                borderColor: colors.border,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ ...typography.h3, color: colors.text }}>-</Text>
            </TouchableOpacity>
            <Text style={{ ...typography.mono, fontSize: 48, color: colors.primary, lineHeight: 56 }}>
              {batteryLevel}%
            </Text>
            <TouchableOpacity
              onPress={() => adjustBattery(5)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: colors.surfaceSecondary,
                borderWidth: 1,
                borderColor: colors.border,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ ...typography.h3, color: colors.text }}>+</Text>
            </TouchableOpacity>
          </View>
          {/* Slider track */}
          <View
            style={{
              height: 8,
              backgroundColor: colors.surfaceSecondary,
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: '100%',
                width: `${batteryLevel}%`,
                borderRadius: 4,
              }}
            />
          </View>
          {/* Quick set buttons */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            {[20, 40, 60, 80, 100].map((val) => (
              <TouchableOpacity
                key={val}
                onPress={() => setBatteryLevel(val)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: batteryLevel === val ? colors.primaryLight : 'transparent',
                }}
              >
                <Text
                  style={{
                    ...typography.small,
                    color: batteryLevel === val ? colors.primary : colors.textTertiary,
                  }}
                >
                  {val}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Average Speed */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: 8 }}>
          Average Speed
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {SPEED_OPTIONS.map((speed) => (
            <TouchableOpacity
              key={speed}
              onPress={() => setAvgSpeed(speed)}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: avgSpeed === speed ? colors.primaryLight : colors.surface,
                borderWidth: 1.5,
                borderColor: avgSpeed === speed ? colors.primary : colors.border,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  ...typography.mono,
                  fontSize: 16,
                  color: avgSpeed === speed ? colors.primary : colors.text,
                }}
              >
                {speed}
              </Text>
              <Text style={{ ...typography.small, color: colors.textTertiary, marginTop: 2 }}>
                km/h
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ ...typography.small, color: colors.textTertiary, marginTop: 8 }}>
          Higher speeds = more energy consumption
        </Text>
      </View>

      {/* Charging Strategy */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: 8 }}>
          Charging Strategy
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {/* Quick Stops */}
          <TouchableOpacity
            onPress={() => setChargingStrategy('quick')}
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderWidth: 1.5,
              borderColor: chargingStrategy === 'quick' ? colors.secondary : colors.border,
              borderRadius: 14,
              padding: 16,
            }}
          >
            <Text style={{ fontSize: 24, marginBottom: 8 }}>{'\u26A1'}</Text>
            <Text style={{ ...typography.bodyBold, color: colors.text, marginBottom: 4 }}>
              Quick Stops
            </Text>
            <Text style={{ ...typography.small, color: colors.textSecondary, lineHeight: 16 }}>
              2-3 short stops, 15-20 min each
            </Text>
          </TouchableOpacity>
          {/* Fewer Stops */}
          <TouchableOpacity
            onPress={() => setChargingStrategy('fewer')}
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderWidth: 1.5,
              borderColor: chargingStrategy === 'fewer' ? colors.secondary : colors.border,
              borderRadius: 14,
              padding: 16,
            }}
          >
            <Text style={{ fontSize: 24, marginBottom: 8 }}>{'\uD83D\uDD0B'}</Text>
            <Text style={{ ...typography.bodyBold, color: colors.text, marginBottom: 4 }}>
              Fewer Stops
            </Text>
            <Text style={{ ...typography.small, color: colors.textSecondary, lineHeight: 16 }}>
              1-2 longer stops, 30-45 min each
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Plan Button */}
      <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
        <TouchableOpacity onPress={handlePlanTrip} activeOpacity={0.85}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 14,
              paddingVertical: 18,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <Text
              style={{
                ...typography.button,
                fontSize: 17,
                color: colors.black,
                letterSpacing: 0.5,
              }}
            >
              Plan My Trip
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // ---------------------------------------------------------------------------
  // Render Step 2: AI Planning Animation
  // ---------------------------------------------------------------------------

  const PLANNING_LABELS = [
    'Calculating energy consumption...',
    'Finding charging stations along route...',
    'Optimizing stop duration...',
    'Checking nearby attractions...',
  ];

  const renderStep2 = () => (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
      }}
    >
      <Animated.Text
        style={{
          fontSize: 64,
          transform: [{ scale: pulseAnim }],
          marginBottom: 32,
        }}
      >
        {'\u26A1'}
      </Animated.Text>
      <Text style={{ ...typography.h3, color: colors.primary, textAlign: 'center', marginBottom: 32 }}>
        AI is planning your optimal route...
      </Text>
      <View style={{ gap: 16, width: '100%' }}>
        {PLANNING_LABELS.map((label, index) => {
          const visible = planningSteps.includes(index);
          return (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                opacity: visible ? 1 : 0.15,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: visible ? colors.secondary : colors.surfaceSecondary,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {visible && (
                  <Text style={{ color: colors.black, fontSize: 12, fontWeight: '700' }}>
                    {'\u2713'}
                  </Text>
                )}
              </View>
              <Text style={{ ...typography.body, color: visible ? colors.text : colors.textTertiary }}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  // ---------------------------------------------------------------------------
  // Render Step 3: Trip Plan Result
  // ---------------------------------------------------------------------------

  const renderStep3 = () => {
    if (!tripPlan) return null;

    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 }}>
          <TouchableOpacity onPress={() => setStep(1)} style={{ marginBottom: 16 }}>
            <Text style={{ ...typography.body, color: colors.textSecondary }}>{'\u2190'} Modify Trip</Text>
          </TouchableOpacity>
        </View>

        {/* Trip Summary Card */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <LinearGradient
            colors={[colors.surfaceTertiary, colors.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.primaryGlow,
              padding: 24,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.25 : 0.1,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            <Text style={{ ...typography.h2, color: colors.text, marginBottom: 20 }}>
              {tripPlan.from} {'\u2192'} {tripPlan.to}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              <View style={{ minWidth: (SCREEN_WIDTH - 80) / 4 - 12 }}>
                <Text style={{ ...typography.mono, fontSize: 22, color: colors.primary }}>
                  {tripPlan.totalDistance}
                </Text>
                <Text style={{ ...typography.small, color: colors.textTertiary, marginTop: 2 }}>
                  km
                </Text>
              </View>
              <View style={{ minWidth: (SCREEN_WIDTH - 80) / 4 - 12 }}>
                <Text style={{ ...typography.mono, fontSize: 22, color: colors.primary }}>
                  {tripPlan.totalTime}
                </Text>
                <Text style={{ ...typography.small, color: colors.textTertiary, marginTop: 2 }}>
                  total time
                </Text>
              </View>
              <View style={{ minWidth: (SCREEN_WIDTH - 80) / 4 - 12 }}>
                <Text style={{ ...typography.mono, fontSize: 22, color: colors.secondary }}>
                  {tripPlan.totalChargeCost}
                </Text>
                <Text style={{ ...typography.small, color: colors.textTertiary, marginTop: 2 }}>
                  EGP charge
                </Text>
              </View>
              <View style={{ minWidth: (SCREEN_WIDTH - 80) / 4 - 12 }}>
                <Text style={{ ...typography.mono, fontSize: 22, color: colors.secondary }}>
                  {tripPlan.arrivalBattery}%
                </Text>
                <Text style={{ ...typography.small, color: colors.textTertiary, marginTop: 2 }}>
                  arrival
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Route Timeline */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ ...typography.h3, color: colors.text, marginBottom: 16 }}>
            Charging Stops
          </Text>

          {/* Start marker */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginLeft: 5 }}>
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: colors.primary,
                marginRight: 14,
              }}
            />
            <Text style={{ ...typography.bodyBold, color: colors.text }}>
              {'\uD83D\uDCCD'} {tripPlan.from}
            </Text>
            <Text style={{ ...typography.caption, color: colors.textSecondary, marginLeft: 8 }}>
              {batteryLevel}% battery
            </Text>
          </View>

          {tripPlan.stops.map((stop, index) => (
            <View key={index} style={{ flexDirection: 'row' }}>
              {/* Timeline line + dot */}
              <View style={{ alignItems: 'center', width: 24, marginRight: 12 }}>
                <View
                  style={{
                    width: 2,
                    height: 20,
                    backgroundColor: colors.primary,
                  }}
                />
                <View
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: colors.primary,
                    borderWidth: 2,
                    borderColor: colors.background,
                  }}
                />
                <View
                  style={{
                    width: 2,
                    flex: 1,
                    backgroundColor:
                      index < tripPlan.stops.length - 1 ? colors.primary : 'transparent',
                  }}
                />
              </View>

              {/* Stop Card */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                {/* Header row */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 6,
                  }}
                >
                  <Text
                    style={{ ...typography.bodyBold, color: colors.text, flex: 1, marginRight: 8 }}
                    numberOfLines={2}
                  >
                    {stop.stationName}
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.primaryLight,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ ...typography.small, color: colors.primary }}>
                      {stop.chargerType}
                    </Text>
                  </View>
                </View>

                {/* Location */}
                <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: 12 }}>
                  {stop.location}
                </Text>

                {/* Battery bar */}
                <View style={{ marginBottom: 12 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <Text style={{ ...typography.mono, fontSize: 13, color: colors.text }}>
                      {stop.arrivalBattery}%
                    </Text>
                    <Text style={{ ...typography.small, color: colors.textTertiary }}>
                      {'\u2192'}
                    </Text>
                    <Text style={{ ...typography.mono, fontSize: 13, color: colors.secondary }}>
                      {stop.chargeToPercent}%
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 6,
                      backgroundColor: colors.surfaceSecondary,
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Arrival portion (dim) */}
                    <View
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${stop.arrivalBattery}%`,
                        backgroundColor: colors.textTertiary,
                        borderRadius: 3,
                        opacity: 0.4,
                      }}
                    />
                    {/* Charge portion (bright) */}
                    <View
                      style={{
                        position: 'absolute',
                        left: `${stop.arrivalBattery}%`,
                        top: 0,
                        bottom: 0,
                        width: `${stop.chargeToPercent - stop.arrivalBattery}%`,
                        backgroundColor: colors.primary,
                        borderRadius: 3,
                      }}
                    />
                  </View>
                </View>

                {/* Duration + Cost */}
                <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 13 }}>{'\u23F1'}</Text>
                    <Text style={{ ...typography.mono, fontSize: 13, color: colors.text }}>
                      {stop.chargeDuration} min
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 13 }}>{'\uD83D\uDCB0'}</Text>
                    <Text style={{ ...typography.mono, fontSize: 13, color: colors.secondary }}>
                      {stop.chargeCost} EGP
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 13 }}>{'\uD83D\uDCCF'}</Text>
                    <Text style={{ ...typography.mono, fontSize: 13, color: colors.textSecondary }}>
                      KM {stop.distanceFromStart}
                    </Text>
                  </View>
                </View>

                {/* Nearby Attractions */}
                {stop.attractions.length > 0 && (
                  <View>
                    <Text
                      style={{
                        ...typography.small,
                        color: colors.textTertiary,
                        marginBottom: 8,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                      }}
                    >
                      Nearby
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 8 }}
                    >
                      {stop.attractions.map((attr, ai) => (
                        <View
                          key={ai}
                          style={{
                            backgroundColor: colors.surfaceSecondary,
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: 10,
                            paddingHorizontal: 10,
                            paddingVertical: 7,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <Text style={{ fontSize: 14 }}>{attr.icon}</Text>
                          <Text style={{ ...typography.small, color: colors.text }}>
                            {attr.name}
                          </Text>
                          <Text style={{ ...typography.small, color: colors.textTertiary }}>
                            {'\u00B7'} {attr.distance}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          ))}

          {/* Destination marker */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 5, marginTop: 4 }}>
            {tripPlan.stops.length > 0 && (
              <View
                style={{
                  width: 2,
                  height: 20,
                  backgroundColor: colors.primary,
                  position: 'absolute',
                  left: 6,
                  top: -20,
                }}
              />
            )}
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: colors.secondary,
                marginRight: 14,
              }}
            />
            <Text style={{ ...typography.bodyBold, color: colors.text }}>
              {'\uD83C\uDFC1'} {tripPlan.to}
            </Text>
            <Text
              style={{
                ...typography.mono,
                fontSize: 13,
                color: tripPlan.arrivalBattery > 20 ? colors.secondary : colors.warning,
                marginLeft: 8,
              }}
            >
              {tripPlan.arrivalBattery}% battery
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ paddingHorizontal: 20, marginTop: 32, gap: 12 }}>
          {/* Book All */}
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Slots Booked!',
                "You're all set for your trip. All charging slots have been reserved.",
              )
            }
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 14,
                paddingVertical: 18,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Text style={{ ...typography.button, fontSize: 17, color: colors.black }}>
                Book All Charging Slots
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Modify Trip */}
          <TouchableOpacity
            onPress={() => setStep(1)}
            style={{
              borderWidth: 1.5,
              borderColor: colors.primary,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ ...typography.button, color: colors.primary }}>Modify Trip</Text>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity
            onPress={() => Alert.alert('Share', 'Trip plan sharing will be available soon.')}
            style={{
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ ...typography.body, color: colors.textSecondary }}>Share Trip Plan</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  if (step === 1) return renderStep1();
  if (step === 2) return renderStep2();
  return renderStep3();
}
