import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Share,
  Platform,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/core/theme';
import { typography } from '@/core/theme/typography';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { useTranslation } from '@/core/i18n';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULTS = {
  distance: 15000,
  petrolConsumption: 8,
  petrolPrice: 21,
  evConsumption: 18,
  homeCost: 1.25,
  publicCost: 5,
  homeRatio: 70,
  evPremium: 0,
};

const RANGES = {
  distance: { min: 5000, max: 50000, step: 1000 },
  petrolConsumption: { min: 5, max: 15, step: 0.5 },
  evConsumption: { min: 12, max: 25, step: 0.5 },
  homeRatio: { min: 0, max: 100, step: 5 },
};

const CO2_PER_LITER = 2.31; // kg CO2 per liter of petrol

// ---------------------------------------------------------------------------
// Custom Slider Component
// ---------------------------------------------------------------------------

function FuturisticSlider({
  value,
  min,
  max,
  step,
  onValueChange,
  colors,
  formatLabel,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onValueChange: (v: number) => void;
  colors: any;
  formatLabel?: (v: number) => string;
}) {
  const trackRef = useRef<View>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const fraction = (value - min) / (max - min);

  const handlePress = useCallback(
    (evt: any) => {
      const x = evt.nativeEvent.locationX;
      if (trackWidth <= 0) return;
      const raw = min + (x / trackWidth) * (max - min);
      const stepped = Math.round(raw / step) * step;
      const clamped = Math.max(min, Math.min(max, stepped));
      onValueChange(clamped);
    },
    [trackWidth, min, max, step, onValueChange]
  );

  return (
    <View style={{ marginVertical: 8 }}>
      <View
        ref={trackRef}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handlePress}
        onResponderMove={handlePress}
        style={{
          height: 36,
          justifyContent: 'center',
        }}
      >
        {/* Track background */}
        <View
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.surfaceTertiary,
            overflow: 'hidden',
          }}
        >
          {/* Active track */}
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: 6,
              width: `${fraction * 100}%`,
              borderRadius: 3,
            }}
          />
        </View>

        {/* Thumb */}
        <View
          style={{
            position: 'absolute',
            left: `${fraction * 100}%`,
            marginLeft: -10,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: colors.primary,
            borderWidth: 3,
            borderColor: colors.background,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 8,
            elevation: 6,
          }}
        />
      </View>

      {/* Min/Max labels */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
        <Text style={{ ...typography.small, color: colors.textTertiary }}>
          {formatLabel ? formatLabel(min) : min}
        </Text>
        <Text style={{ ...typography.small, color: colors.textTertiary }}>
          {formatLabel ? formatLabel(max) : max}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Animated Count-Up Number
// ---------------------------------------------------------------------------

function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  style,
  duration = 600,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  style?: any;
  duration?: number;
}) {
  const animValue = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    animValue.setValue(0);
    const animation = Animated.timing(animValue, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    const listener = animValue.addListener(({ value: v }) => {
      const current = Math.round(v * value);
      setDisplay(current.toLocaleString());
    });

    animation.start();

    return () => {
      animValue.removeListener(listener);
    };
  }, [value, duration]);

  return (
    <Text style={style}>
      {prefix}{display}{suffix}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Bar Chart Component
// ---------------------------------------------------------------------------

function CostBarChart({
  petrolCost,
  evCost,
  colors,
  t,
}: {
  petrolCost: number;
  evCost: number;
  colors: any;
  t: (key: any) => string;
}) {
  const maxCost = Math.max(petrolCost, evCost, 1);
  const petrolFraction = petrolCost / maxCost;
  const evFraction = evCost / maxCost;

  const petrolAnim = useRef(new Animated.Value(0)).current;
  const evAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    petrolAnim.setValue(0);
    evAnim.setValue(0);
    Animated.parallel([
      Animated.timing(petrolAnim, {
        toValue: petrolFraction,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(evAnim, {
        toValue: evFraction,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [petrolFraction, evFraction]);

  return (
    <View style={{ marginVertical: spacing.md }}>
      {/* Petrol Bar */}
      <View style={{ marginBottom: spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ ...typography.caption, color: colors.textSecondary }}>
            {t('calc_petrol')}
          </Text>
          <Text style={{ ...typography.mono, color: colors.error }}>
            {t('egp')} {Math.round(petrolCost).toLocaleString()}
          </Text>
        </View>
        <View style={{ height: 28, borderRadius: 14, backgroundColor: colors.surfaceTertiary, overflow: 'hidden' }}>
          <Animated.View
            style={{
              height: 28,
              borderRadius: 14,
              backgroundColor: colors.error,
              opacity: 0.85,
              width: petrolAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            }}
          />
        </View>
      </View>

      {/* EV Bar */}
      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ ...typography.caption, color: colors.textSecondary }}>
            {t('calc_ev')}
          </Text>
          <Text style={{ ...typography.mono, color: colors.secondary }}>
            {t('egp')} {Math.round(evCost).toLocaleString()}
          </Text>
        </View>
        <View style={{ height: 28, borderRadius: 14, backgroundColor: colors.surfaceTertiary, overflow: 'hidden' }}>
          <Animated.View
            style={{
              height: 28,
              borderRadius: 14,
              width: evAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            }}
          >
            <LinearGradient
              colors={[colors.secondary, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1, borderRadius: 14 }}
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Editable Price Input
// ---------------------------------------------------------------------------

function PriceInput({
  label,
  value,
  onChangeValue,
  unit,
  colors,
}: {
  label: string;
  value: number;
  onChangeValue: (v: number) => void;
  unit: string;
  colors: any;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value.toString());

  useEffect(() => {
    if (!editing) setText(value.toString());
  }, [value, editing]);

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: 6 }}>
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surfaceSecondary,
          borderRadius: borderRadius.md,
          borderWidth: 1,
          borderColor: editing ? colors.primary : colors.border,
          paddingHorizontal: spacing.md,
          paddingVertical: Platform.OS === 'web' ? 10 : 8,
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          onFocus={() => setEditing(true)}
          onBlur={() => {
            setEditing(false);
            const parsed = parseFloat(text);
            if (!isNaN(parsed) && parsed > 0) {
              onChangeValue(parsed);
            } else {
              setText(value.toString());
            }
          }}
          keyboardType="decimal-pad"
          style={{
            flex: 1,
            ...typography.mono,
            color: colors.text,
            fontSize: 18,
            padding: 0,
          }}
        />
        <Text style={{ ...typography.caption, color: colors.textTertiary, marginLeft: 8 }}>
          {unit}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section Card
// ---------------------------------------------------------------------------

function SectionCard({
  children,
  colors,
  style,
}: {
  children: React.ReactNode;
  colors: any;
  style?: any;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.lg,
          marginBottom: spacing.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export function CostCalculatorScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Input state
  const [distance, setDistance] = useState(DEFAULTS.distance);
  const [petrolConsumption, setPetrolConsumption] = useState(DEFAULTS.petrolConsumption);
  const [petrolPrice, setPetrolPrice] = useState(DEFAULTS.petrolPrice);
  const [evConsumption, setEvConsumption] = useState(DEFAULTS.evConsumption);
  const [homeCost, setHomeCost] = useState(DEFAULTS.homeCost);
  const [publicCost, setPublicCost] = useState(DEFAULTS.publicCost);
  const [homeRatio, setHomeRatio] = useState(DEFAULTS.homeRatio);
  const [evPremium, setEvPremium] = useState(DEFAULTS.evPremium);
  const [showBreakeven, setShowBreakeven] = useState(false);

  // Calculations
  const annualPetrolCost = distance * (petrolConsumption / 100) * petrolPrice;
  const blendedElectricityCost =
    (homeRatio / 100) * homeCost + ((100 - homeRatio) / 100) * publicCost;
  const annualEvCost = distance * (evConsumption / 100) * blendedElectricityCost;
  const annualSavings = annualPetrolCost - annualEvCost;
  const monthlySavings = annualSavings / 12;
  const fiveYearSavings = annualSavings * 5;
  const co2Saved = distance * (petrolConsumption / 100) * CO2_PER_LITER;
  const breakevenMonths =
    evPremium > 0 && annualSavings > 0
      ? Math.ceil(evPremium / (annualSavings / 12))
      : 0;

  // Share handler
  const handleShare = async () => {
    const message = `${t('calc_share_text')
      .replace('{savings}', Math.round(annualSavings).toLocaleString())
      .replace('{co2}', Math.round(co2Saved).toLocaleString())}`;
    try {
      await Share.share({
        message,
        title: t('calc_share_title'),
      });
    } catch (_err) {
      // User cancelled
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        isDesktop && { maxWidth: 720, alignSelf: 'center', width: '100%' },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.surfaceSecondary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 20, color: colors.text }}>{'<'}</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={{ ...typography.h2, color: colors.text }}>
            {t('calc_title')}
          </Text>
          <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 2 }}>
            {t('calc_subtitle')}
          </Text>
        </View>
      </View>

      {/* ----------------------------------------------------------------- */}
      {/* Savings Hero Card */}
      {/* ----------------------------------------------------------------- */}
      <View style={{ marginBottom: spacing.lg }}>
        <LinearGradient
          colors={[
            'rgba(0, 255, 136, 0.12)',
            'rgba(0, 212, 255, 0.08)',
            'rgba(0, 255, 136, 0.05)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: borderRadius.xl,
            padding: 2,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: borderRadius.xl - 1,
              padding: spacing.xl,
              alignItems: 'center',
            }}
          >
            <Text style={{ ...typography.sectionLabel, color: colors.secondary, marginBottom: 8 }}>
              {t('calc_annual_savings')}
            </Text>
            <AnimatedNumber
              value={Math.round(annualSavings)}
              prefix={`${t('egp')} `}
              style={{
                ...typography.h1,
                fontSize: 42,
                lineHeight: 48,
                color: annualSavings >= 0 ? colors.secondary : colors.error,
              }}
            />
            <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 8 }}>
              {t('calc_per_year')}
            </Text>

            {/* Monthly + 5-year row */}
            <View style={{ flexDirection: 'row', gap: spacing.xl, marginTop: spacing.lg }}>
              <View style={{ alignItems: 'center' }}>
                <AnimatedNumber
                  value={Math.round(monthlySavings)}
                  prefix={`${t('egp')} `}
                  style={{ ...typography.h3, color: colors.primary }}
                />
                <Text style={{ ...typography.small, color: colors.textTertiary, marginTop: 2 }}>
                  {t('calc_per_month')}
                </Text>
              </View>
              <View style={{ width: 1, backgroundColor: colors.border, height: 36 }} />
              <View style={{ alignItems: 'center' }}>
                <AnimatedNumber
                  value={Math.round(fiveYearSavings)}
                  prefix={`${t('egp')} `}
                  style={{ ...typography.h3, color: colors.primary }}
                />
                <Text style={{ ...typography.small, color: colors.textTertiary, marginTop: 2 }}>
                  {t('calc_five_year')}
                </Text>
              </View>
            </View>

            {/* CO2 Badge */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: spacing.lg,
                backgroundColor: colors.secondaryGlow,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: borderRadius.full,
              }}
            >
              <Text style={{ fontSize: 16, marginRight: 6 }}>{'🌿'}</Text>
              <Text style={{ ...typography.caption, color: colors.secondary }}>
                {Math.round(co2Saved).toLocaleString()} {t('calc_kg_co2_saved')}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* ----------------------------------------------------------------- */}
      {/* Visual Comparison Chart */}
      {/* ----------------------------------------------------------------- */}
      <SectionCard colors={colors}>
        <Text style={{ ...typography.h3, color: colors.text, marginBottom: spacing.sm }}>
          {t('calc_comparison')}
        </Text>
        <CostBarChart
          petrolCost={annualPetrolCost}
          evCost={annualEvCost}
          colors={colors}
          t={t}
        />
      </SectionCard>

      {/* ----------------------------------------------------------------- */}
      {/* Distance Input */}
      {/* ----------------------------------------------------------------- */}
      <SectionCard colors={colors}>
        <Text style={{ ...typography.h3, color: colors.text, marginBottom: 4 }}>
          {t('calc_distance')}
        </Text>
        <Text style={{ ...typography.mono, fontSize: 28, color: colors.primary, marginBottom: 4 }}>
          {distance.toLocaleString()} <Text style={{ ...typography.caption, color: colors.textTertiary }}>{t('calc_km_year')}</Text>
        </Text>
        <FuturisticSlider
          value={distance}
          min={RANGES.distance.min}
          max={RANGES.distance.max}
          step={RANGES.distance.step}
          onValueChange={setDistance}
          colors={colors}
          formatLabel={(v) => `${(v / 1000).toFixed(0)}k`}
        />
      </SectionCard>

      {/* ----------------------------------------------------------------- */}
      {/* Petrol Vehicle Section */}
      {/* ----------------------------------------------------------------- */}
      <SectionCard colors={colors}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
          <Text style={{ fontSize: 20, marginRight: 8 }}>{'⛽'}</Text>
          <Text style={{ ...typography.h3, color: colors.text }}>
            {t('calc_petrol_vehicle')}
          </Text>
        </View>

        <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: 4 }}>
          {t('calc_fuel_consumption')}
        </Text>
        <Text style={{ ...typography.mono, fontSize: 20, color: colors.text, marginBottom: 2 }}>
          {petrolConsumption} <Text style={{ ...typography.small, color: colors.textTertiary }}>L/100km</Text>
        </Text>
        <FuturisticSlider
          value={petrolConsumption}
          min={RANGES.petrolConsumption.min}
          max={RANGES.petrolConsumption.max}
          step={RANGES.petrolConsumption.step}
          onValueChange={setPetrolConsumption}
          colors={colors}
          formatLabel={(v) => `${v}L`}
        />

        <PriceInput
          label={t('calc_petrol_price')}
          value={petrolPrice}
          onChangeValue={setPetrolPrice}
          unit={t('calc_egp_per_liter')}
          colors={colors}
        />
      </SectionCard>

      {/* ----------------------------------------------------------------- */}
      {/* EV Section */}
      {/* ----------------------------------------------------------------- */}
      <SectionCard colors={colors}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
          <Text style={{ fontSize: 20, marginRight: 8 }}>{'⚡'}</Text>
          <Text style={{ ...typography.h3, color: colors.text }}>
            {t('calc_ev_vehicle')}
          </Text>
        </View>

        <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: 4 }}>
          {t('calc_ev_consumption')}
        </Text>
        <Text style={{ ...typography.mono, fontSize: 20, color: colors.text, marginBottom: 2 }}>
          {evConsumption} <Text style={{ ...typography.small, color: colors.textTertiary }}>kWh/100km</Text>
        </Text>
        <FuturisticSlider
          value={evConsumption}
          min={RANGES.evConsumption.min}
          max={RANGES.evConsumption.max}
          step={RANGES.evConsumption.step}
          onValueChange={setEvConsumption}
          colors={colors}
          formatLabel={(v) => `${v}`}
        />

        <PriceInput
          label={t('calc_home_charging_cost')}
          value={homeCost}
          onChangeValue={setHomeCost}
          unit={t('calc_egp_per_kwh')}
          colors={colors}
        />

        <PriceInput
          label={t('calc_public_charging_cost')}
          value={publicCost}
          onChangeValue={setPublicCost}
          unit={t('calc_egp_per_kwh')}
          colors={colors}
        />

        {/* Charging Split */}
        <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: 4 }}>
          {t('calc_charging_split')}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
          <Text style={{ ...typography.mono, color: colors.primary }}>
            {homeRatio}% {t('calc_home')}
          </Text>
          <Text style={{ ...typography.mono, color: colors.warning }}>
            {100 - homeRatio}% {t('calc_public')}
          </Text>
        </View>
        <FuturisticSlider
          value={homeRatio}
          min={RANGES.homeRatio.min}
          max={RANGES.homeRatio.max}
          step={RANGES.homeRatio.step}
          onValueChange={setHomeRatio}
          colors={colors}
          formatLabel={(v) => `${v}%`}
        />
        <Text style={{ ...typography.small, color: colors.textTertiary, marginTop: 4 }}>
          {t('calc_blended_rate')}: {t('egp')} {blendedElectricityCost.toFixed(2)}/{t('calc_kwh_unit')}
        </Text>
      </SectionCard>

      {/* ----------------------------------------------------------------- */}
      {/* Break-even Calculator (Optional) */}
      {/* ----------------------------------------------------------------- */}
      <SectionCard colors={colors}>
        <TouchableOpacity
          onPress={() => setShowBreakeven(!showBreakeven)}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, marginRight: 8 }}>{'📊'}</Text>
            <Text style={{ ...typography.h3, color: colors.text }}>
              {t('calc_breakeven')}
            </Text>
          </View>
          <Text style={{ fontSize: 18, color: colors.textTertiary }}>
            {showBreakeven ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {showBreakeven && (
          <View style={{ marginTop: spacing.md }}>
            <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm }}>
              {t('calc_ev_premium_desc')}
            </Text>
            <PriceInput
              label={t('calc_ev_premium')}
              value={evPremium}
              onChangeValue={setEvPremium}
              unit={t('egp')}
              colors={colors}
            />
            {evPremium > 0 && annualSavings > 0 && (
              <View
                style={{
                  backgroundColor: colors.primaryLight,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  alignItems: 'center',
                }}
              >
                <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                  {t('calc_breakeven_in')}
                </Text>
                <Text style={{ ...typography.h2, color: colors.primary, marginTop: 4 }}>
                  {breakevenMonths} {t('calc_months')}
                </Text>
                <Text style={{ ...typography.small, color: colors.textTertiary, marginTop: 2 }}>
                  ({(breakevenMonths / 12).toFixed(1)} {t('calc_years')})
                </Text>
              </View>
            )}
            {evPremium > 0 && annualSavings <= 0 && (
              <View
                style={{
                  backgroundColor: 'rgba(255, 77, 106, 0.1)',
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  alignItems: 'center',
                }}
              >
                <Text style={{ ...typography.caption, color: colors.error }}>
                  {t('calc_no_savings')}
                </Text>
              </View>
            )}
          </View>
        )}
      </SectionCard>

      {/* ----------------------------------------------------------------- */}
      {/* Share Button */}
      {/* ----------------------------------------------------------------- */}
      <TouchableOpacity onPress={handleShare} activeOpacity={0.85}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: borderRadius.lg,
            paddingVertical: spacing.md + 2,
            alignItems: 'center',
            marginBottom: spacing.lg,
          }}
        >
          <Text style={{ ...typography.button, color: colors.black }}>
            {t('calc_share_savings')}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Egypt Market Context */}
      <View
        style={{
          backgroundColor: colors.surfaceSecondary,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          marginBottom: spacing.xxl,
          borderLeftWidth: 3,
          borderLeftColor: colors.warning,
        }}
      >
        <Text style={{ ...typography.caption, color: colors.warning, marginBottom: 4 }}>
          {t('calc_egypt_note_title')}
        </Text>
        <Text style={{ ...typography.small, color: colors.textSecondary, lineHeight: 18 }}>
          {t('calc_egypt_note_body')}
        </Text>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: spacing.md,
    paddingTop: spacing.xxl + spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
});
