import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { useTheme } from '@/core/theme';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import { useTranslation } from '@/core/i18n';
import { useAuthStore } from '@/core/stores/authStore';
import { homeChargerService } from '@/core/services/homeChargerService';
import { googleMapsService } from '@/core/services/googleMapsService';

const CONNECTOR_TYPES = ['Type 2', 'CCS', 'Wall Outlet / Schuko'] as const;

export function ListHomeChargerScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [connectorType, setConnectorType] = useState<string>('Type 2');
  const [powerKw, setPowerKw] = useState('7');
  const [availabilitySchedule, setAvailabilitySchedule] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [pricePerKwh, setPricePerKwh] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Address autocomplete
  const [addressSuggestions, setAddressSuggestions] = useState<
    { description: string; placeId: string }[]
  >([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAddressChange = useCallback((text: string) => {
    setAddress(text);
    setLatitude(null);
    setLongitude(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (text.length < 2) {
        setAddressSuggestions([]);
        return;
      }
      const results = await googleMapsService.autocompletePlaces(text);
      setAddressSuggestions(results);
    }, 250);
  }, []);

  const handleSelectSuggestion = useCallback(
    async (suggestion: { description: string; placeId: string }) => {
      setAddress(suggestion.description);
      setAddressSuggestions([]);
      // Geocode to get lat/lng
      try {
        const coords = await googleMapsService.geocode(suggestion.description);
        if (coords) {
          setLatitude(coords.lat);
          setLongitude(coords.lng);
        }
      } catch (err) {
        console.warn('[ListHomeCharger] Geocode failed:', err);
      }
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!displayName.trim()) {
      Alert.alert(t('error'), t('home_charger_name_required'));
      return;
    }
    if (!address.trim() || latitude == null || longitude == null) {
      Alert.alert(t('error'), t('home_charger_address_required'));
      return;
    }
    if (!user?.id) {
      Alert.alert(t('error'), t('home_charger_login_required'));
      return;
    }

    setSubmitting(true);
    try {
      const result = await homeChargerService.addCharger({
        user_id: user.id,
        display_name: displayName.trim(),
        address: address.trim(),
        latitude,
        longitude,
        connector_type: connectorType,
        power_kw: parseFloat(powerKw) || 7,
        description: description.trim() || undefined,
        availability_schedule: availabilitySchedule.trim() || undefined,
        is_free: isFree,
        price_per_kwh: !isFree && pricePerKwh ? parseFloat(pricePerKwh) : undefined,
      });

      if (result) {
        Alert.alert(t('success'), t('home_charger_listed_success'), [
          { text: t('ok'), onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert(t('error'), t('home_charger_listed_error'));
      }
    } catch {
      Alert.alert(t('error'), t('home_charger_listed_error'));
    } finally {
      setSubmitting(false);
    }
  }, [
    displayName, address, latitude, longitude, connectorType,
    powerKw, description, availabilitySchedule, isFree, pricePerKwh,
    user, navigation, t,
  ]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ fontSize: 22, color: colors.text }}>{'\u2190'}</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{t('home_charger_list_title')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('home_charger_list_subtitle')}
          </Text>
        </View>
      </View>

      {/* Banner */}
      <View
        style={[
          styles.banner,
          {
            backgroundColor: colors.secondary + '10',
            borderColor: colors.secondary + '30',
          },
        ]}
      >
        <Text style={{ fontSize: 28, marginRight: 12 }}>{'\uD83C\uDFE0'}</Text>
        <Text style={[styles.bannerText, { color: colors.secondary }]}>
          {t('home_charger_banner')}
        </Text>
      </View>

      {/* Display Name */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('home_charger_display_name')}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder={t('home_charger_name_placeholder')}
        placeholderTextColor={colors.textTertiary}
        value={displayName}
        onChangeText={setDisplayName}
      />

      {/* Address with autocomplete */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('address')}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder={t('home_charger_address_placeholder')}
        placeholderTextColor={colors.textTertiary}
        value={address}
        onChangeText={handleAddressChange}
      />
      {latitude != null && (
        <Text style={[styles.coordsHint, { color: colors.primary }]}>
          {'\u2713'} {t('home_charger_location_set')}
        </Text>
      )}
      {addressSuggestions.length > 0 && (
        <View style={[styles.suggestionsBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {addressSuggestions.map((s) => (
            <TouchableOpacity
              key={s.placeId}
              onPress={() => handleSelectSuggestion(s)}
              style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
            >
              <Text style={{ color: colors.text, fontSize: 13 }} numberOfLines={2}>
                {s.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Connector Type Picker */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('home_charger_connector')}</Text>
      <View style={styles.chipRow}>
        {CONNECTOR_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => setConnectorType(type)}
            style={[
              styles.chip,
              {
                backgroundColor: connectorType === type ? colors.primaryLight : colors.surface,
                borderColor: connectorType === type ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: connectorType === type ? colors.primary : colors.textSecondary },
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Power Output */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('power_kw')}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, flex: 1 },
          ]}
          placeholder="7"
          placeholderTextColor={colors.textTertiary}
          value={powerKw}
          onChangeText={setPowerKw}
          keyboardType="numeric"
        />
        <Text style={[styles.unitText, { color: colors.textSecondary }]}>kW</Text>
      </View>

      {/* Availability Schedule */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('home_charger_schedule')}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder={t('home_charger_schedule_placeholder')}
        placeholderTextColor={colors.textTertiary}
        value={availabilitySchedule}
        onChangeText={setAvailabilitySchedule}
      />

      {/* Free or Paid Toggle */}
      <View style={styles.toggleRow}>
        <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 0 }]}>
          {t('home_charger_free_charging')}
        </Text>
        <Switch
          value={isFree}
          onValueChange={setIsFree}
          trackColor={{ false: colors.surfaceTertiary, true: colors.primaryGlow }}
          thumbColor={isFree ? colors.primary : colors.textTertiary}
        />
      </View>

      {!isFree && (
        <>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {t('home_charger_price_per_kwh')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, flex: 1 },
              ]}
              placeholder="2.50"
              placeholderTextColor={colors.textTertiary}
              value={pricePerKwh}
              onChangeText={setPricePerKwh}
              keyboardType="numeric"
            />
            <Text style={[styles.unitText, { color: colors.textSecondary }]}>{t('calc_egp_per_kwh')}</Text>
          </View>
        </>
      )}

      {/* Description */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('home_charger_description')}</Text>
      <TextInput
        style={[
          styles.input,
          styles.multilineInput,
          { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
        ]}
        placeholder={t('home_charger_description_placeholder')}
        placeholderTextColor={colors.textTertiary}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={submitting}
        style={[
          styles.submitBtn,
          {
            backgroundColor: submitting ? colors.surfaceTertiary : colors.primary,
            opacity: submitting ? 0.7 : 1,
          },
        ]}
        activeOpacity={0.8}
      >
        {submitting ? (
          <ActivityIndicator color="#000" size="small" />
        ) : (
          <Text style={styles.submitText}>{t('home_charger_submit')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 60 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 20 : 56,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: 8,
  },
  backBtn: { padding: 8 },
  title: {
    ...(typography.h2 as object),
  },
  subtitle: {
    ...(typography.caption as object),
    marginTop: 2,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  bannerText: {
    ...(typography.body as object),
    flex: 1,
    fontWeight: '500',
  },
  label: {
    ...(typography.small as object),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  input: {
    marginHorizontal: spacing.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    fontSize: 14,
  },
  multilineInput: {
    minHeight: 80,
    paddingTop: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: spacing.md,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  unitText: {
    ...(typography.body as object),
    fontWeight: '600',
    marginRight: spacing.md,
  },
  coordsHint: {
    fontSize: 11,
    fontWeight: '600',
    marginHorizontal: spacing.md,
    marginTop: 4,
  },
  suggestionsBox: {
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    marginTop: 4,
    maxHeight: 180,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  submitBtn: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    ...(typography.bodyBold as object),
    color: '#000',
    fontSize: 15,
  },
});
