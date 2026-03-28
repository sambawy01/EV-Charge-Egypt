import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { submittedStationService, SubmittedStation } from '@/core/services/submittedStationService';

const PROVIDER_CHIPS = ['Elsewedy', 'Sha7en', 'IKARUS', 'Infinity', 'Revolta', 'Other'];
const CITY_CHIPS = ['Cairo', 'Alexandria', 'Giza', 'Hurghada', 'Sharm El Sheikh', 'Ain Sokhna'];
const CONNECTOR_CHIPS = ['CCS2', 'Type 2', 'CHAdeMO', 'GB/T'];

export function SubmitStationScreen({ navigation }: any) {
  // Form state
  const [name, setName] = useState('');
  const [providerName, setProviderName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [connectorTypes, setConnectorTypes] = useState<string[]>([]);
  const [powerKw, setPowerKw] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // Pending stations
  const [pendingStations, setPendingStations] = useState<SubmittedStation[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    loadPendingStations();
  }, []);

  async function loadPendingStations() {
    setLoadingPending(true);
    const stations = await submittedStationService.getPendingStations();
    setPendingStations(stations);
    setLoadingPending(false);
  }

  function useCurrentLocation() {
    if (!navigator?.geolocation) {
      Alert.alert('Error', 'Geolocation is not available in this browser.');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setLocationLoading(false);
      },
      (err) => {
        Alert.alert('Location Error', 'Could not get your current location. Please enter coordinates manually.');
        setLocationLoading(false);
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    );
  }

  function toggleConnector(type: string) {
    setConnectorTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a station name.');
      return;
    }
    if (!latitude || !longitude) {
      Alert.alert('Required', 'Please provide the station location (use GPS or enter coordinates).');
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Invalid', 'Latitude and longitude must be valid numbers.');
      return;
    }

    setSubmitting(true);
    const success = await submittedStationService.submitStation({
      name: name.trim(),
      address: address.trim() || undefined,
      latitude: lat,
      longitude: lng,
      city: city.trim() || undefined,
      providerName: providerName.trim() || undefined,
      connectorTypes: connectorTypes.length > 0 ? connectorTypes : undefined,
      powerKw: powerKw ? parseFloat(powerKw) : undefined,
      notes: notes.trim() || undefined,
    });
    setSubmitting(false);

    if (success) {
      Alert.alert('Station Submitted!', 'Thank you for helping grow Egypt\'s EV network. Your station will appear after community verification.');
      // Reset form
      setName('');
      setProviderName('');
      setAddress('');
      setCity('');
      setLatitude('');
      setLongitude('');
      setConnectorTypes([]);
      setPowerKw('');
      setNotes('');
      loadPendingStations();
    } else {
      Alert.alert('Error', 'Failed to submit station. Please try again.');
    }
  }

  async function handleVerify(stationId: string) {
    setVerifyingId(stationId);
    // Use a simple anonymous ID for now
    const userId = 'anon-' + Math.random().toString(36).slice(2, 10);
    const success = await submittedStationService.verifyStation(stationId, userId);
    setVerifyingId(null);

    if (success) {
      Alert.alert('Verified!', 'Thank you for confirming this station exists.');
      loadPendingStations();
    } else {
      Alert.alert('Note', 'You may have already verified this station, or an error occurred.');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit a New Station</Text>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoBannerText}>
          Help grow Egypt's EV network! Submit stations you find and earn community karma.
        </Text>
      </View>

      {/* Station Name */}
      <Text style={styles.label}>Station Name *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Shell - Ring Road Maadi"
        placeholderTextColor={colors.textTertiary}
        value={name}
        onChangeText={setName}
      />

      {/* Provider Name */}
      <Text style={styles.label}>Provider Name</Text>
      <View style={styles.chipsRow}>
        {PROVIDER_CHIPS.map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setProviderName(providerName === p ? '' : p)}
            style={[
              styles.chip,
              providerName === p && styles.chipActive,
            ]}
          >
            <Text style={[styles.chipText, providerName === p && styles.chipTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Or type provider name..."
        placeholderTextColor={colors.textTertiary}
        value={providerName}
        onChangeText={setProviderName}
      />

      {/* Address */}
      <Text style={styles.label}>Address</Text>
      <TextInput
        style={styles.input}
        placeholder="Street address or landmark"
        placeholderTextColor={colors.textTertiary}
        value={address}
        onChangeText={setAddress}
      />

      {/* City */}
      <Text style={styles.label}>City</Text>
      <View style={styles.chipsRow}>
        {CITY_CHIPS.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setCity(city === c ? '' : c)}
            style={[
              styles.chip,
              city === c && styles.chipActive,
            ]}
          >
            <Text style={[styles.chipText, city === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Or type city name..."
        placeholderTextColor={colors.textTertiary}
        value={city}
        onChangeText={setCity}
      />

      {/* Location */}
      <Text style={styles.label}>Location *</Text>
      <TouchableOpacity onPress={useCurrentLocation} style={styles.gpsButton} disabled={locationLoading}>
        {locationLoading ? (
          <ActivityIndicator size="small" color={colors.secondary} />
        ) : (
          <Text style={styles.gpsButtonText}>{'\uD83D\uDCCD'} Use my current location</Text>
        )}
      </TouchableOpacity>
      <View style={styles.coordRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.coordLabel}>Latitude</Text>
          <TextInput
            style={styles.input}
            placeholder="30.0444"
            placeholderTextColor={colors.textTertiary}
            value={latitude}
            onChangeText={setLatitude}
            keyboardType="numeric"
          />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.coordLabel}>Longitude</Text>
          <TextInput
            style={styles.input}
            placeholder="31.2357"
            placeholderTextColor={colors.textTertiary}
            value={longitude}
            onChangeText={setLongitude}
            keyboardType="numeric"
          />
        </View>
      </View>
      {latitude && longitude && (
        <Text style={styles.coordDisplay}>
          {latitude}, {longitude}
        </Text>
      )}

      {/* Connector Types */}
      <Text style={styles.label}>Connector Types</Text>
      <View style={styles.chipsRow}>
        {CONNECTOR_CHIPS.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => toggleConnector(c)}
            style={[
              styles.chip,
              connectorTypes.includes(c) && styles.chipActive,
            ]}
          >
            <Text style={[styles.chipText, connectorTypes.includes(c) && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Power */}
      <Text style={styles.label}>Power (kW)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 60"
        placeholderTextColor={colors.textTertiary}
        value={powerKw}
        onChangeText={setPowerKw}
        keyboardType="numeric"
      />

      {/* Notes */}
      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Any details about this station (operating hours, parking info, etc.)"
        placeholderTextColor={colors.textTertiary}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        style={styles.submitButton}
        disabled={submitting}
        activeOpacity={0.8}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Station</Text>
        )}
      </TouchableOpacity>

      {/* Pending Verification Section */}
      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>Stations Pending Verification</Text>
      <Text style={styles.sectionSubtitle}>
        Help verify stations submitted by other users. 3 confirmations promotes a station to the official map.
      </Text>

      {loadingPending ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 16 }} />
      ) : pendingStations.length === 0 ? (
        <Text style={styles.emptyText}>No pending stations right now. Be the first to submit one!</Text>
      ) : (
        pendingStations.map((station) => (
          <View key={station.id} style={styles.pendingCard}>
            <View style={styles.pendingHeader}>
              <Text style={styles.pendingName}>{station.name}</Text>
              <Text style={styles.pendingCount}>
                {station.verification_count}/3 verified
              </Text>
            </View>
            {station.address && (
              <Text style={styles.pendingAddress}>{station.address}</Text>
            )}
            {station.city && (
              <Text style={styles.pendingCity}>{station.city}</Text>
            )}
            {station.provider_name && (
              <Text style={styles.pendingProvider}>{station.provider_name}</Text>
            )}

            {/* Verification progress bar */}
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min((station.verification_count / 3) * 100, 100)}%` },
                ]}
              />
            </View>

            <TouchableOpacity
              onPress={() => handleVerify(station.id)}
              style={styles.verifyButton}
              disabled={verifyingId === station.id}
            >
              {verifyingId === station.id ? (
                <ActivityIndicator size="small" color={colors.secondary} />
              ) : (
                <Text style={styles.verifyButtonText}>
                  {'\u2705'} I can confirm this station exists
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Bottom spacer */}
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    maxWidth: 600,
    alignSelf: 'center' as any,
    width: '100%' as any,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backArrow: {
    fontSize: 18,
    color: colors.text,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },

  // Info banner
  infoBanner: {
    backgroundColor: colors.surfaceSecondary,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
    borderRadius: 10,
    padding: 14,
    marginBottom: 24,
  },
  infoBannerText: {
    ...typography.caption,
    color: colors.secondary,
    lineHeight: 20,
  },

  // Form
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 14,
    textTransform: 'uppercase' as any,
    letterSpacing: 1,
    fontSize: 11,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
    // @ts-ignore
    outlineStyle: 'none',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Chips
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.primary,
  },

  // GPS button
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.secondaryGlow,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 10,
    paddingVertical: 10,
    marginBottom: 10,
  },
  gpsButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary,
  },

  // Coordinates
  coordRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  coordLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  coordDisplay: {
    ...typography.mono,
    color: colors.primary,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 4,
  },

  // Submit button
  submitButton: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    ...typography.button,
    color: '#FFFFFF',
    fontSize: 15,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 28,
  },

  // Section
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 6,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 16,
  },

  // Empty
  emptyText: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },

  // Pending card
  pendingCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pendingName: {
    ...typography.bodyBold,
    color: colors.text,
    fontSize: 14,
    flex: 1,
  },
  pendingCount: {
    ...typography.mono,
    color: colors.primary,
    fontSize: 12,
  },
  pendingAddress: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 2,
  },
  pendingCity: {
    ...typography.caption,
    color: colors.textTertiary,
    fontSize: 11,
    marginBottom: 2,
  },
  pendingProvider: {
    ...typography.caption,
    color: colors.textTertiary,
    fontSize: 11,
    marginBottom: 6,
  },

  // Progress bar
  progressBarBg: {
    height: 4,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 2,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: 2,
  },

  // Verify button
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.secondaryGlow,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 8,
    paddingVertical: 8,
  },
  verifyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondary,
  },
});
