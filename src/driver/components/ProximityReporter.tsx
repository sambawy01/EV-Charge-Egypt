import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, TextInput } from 'react-native';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';
import { stationReportService, StationStatus } from '@/core/services/stationReportService';
import { useAuthStore } from '@/core/stores/authStore';

interface Props {
  stations: { id: string; name: string; latitude: number; longitude: number }[];
  userLocation: { latitude: number; longitude: number } | null;
}

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function ProximityReporter({ stations, userLocation }: Props) {
  const user = useAuthStore((s) => s.user);
  const [nearbyStation, setNearbyStation] = useState<typeof stations[0] | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [dismissedStations, setDismissedStations] = useState<Set<string>>(new Set());
  const [spots, setSpots] = useState('');
  const slideAnim = useRef(new Animated.Value(300)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Check proximity every time location updates
  useEffect(() => {
    if (!userLocation || stations.length === 0) return;

    for (const station of stations) {
      if (dismissedStations.has(station.id)) continue;
      const dist = haversineM(userLocation.latitude, userLocation.longitude, station.latitude, station.longitude);
      if (dist < 200) {
        setNearbyStation(station);
        setShowPopup(true);
        setSubmitted(false);
        // Animate in
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: false, tension: 50, friction: 8 }).start();
        // Pulse animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.05, duration: 600, useNativeDriver: false }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: false }),
          ])
        ).start();
        break;
      }
    }
  }, [userLocation, stations, dismissedStations]);

  const handleReport = async (status: StationStatus) => {
    if (!nearbyStation) return;
    await stationReportService.submitReport({
      stationId: nearbyStation.id,
      userId: user?.id,
      status,
      availableSpots: spots ? parseInt(spots, 10) : undefined,
    });
    setSubmitted(true);
    setTimeout(() => {
      setShowPopup(false);
      setDismissedStations((prev) => new Set([...prev, nearbyStation.id]));
    }, 2000);
  };

  const handleDismiss = () => {
    if (nearbyStation) {
      setDismissedStations((prev) => new Set([...prev, nearbyStation.id]));
    }
    Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: false }).start(() => {
      setShowPopup(false);
    });
  };

  if (!showPopup || !nearbyStation) return null;

  return (
    <Animated.View style={{
      position: 'absolute',
      bottom: 20,
      left: 16,
      right: 16,
      transform: [{ translateY: slideAnim }, { scale: pulseAnim }],
      zIndex: 1000,
    }}>
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 20,
        borderWidth: 2,
        borderColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 15,
      }}>
        {submitted ? (
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>{'\u26A1'}</Text>
            <Text style={{ ...typography.h3, color: colors.secondary }}>Thanks for reporting!</Text>
            <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 4 }}>
              You're helping other EV drivers
            </Text>
          </View>
        ) : (
          <>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: colors.primaryLight,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 20 }}>{'\uD83D\uDCE1'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...typography.bodyBold, color: colors.text }}>You're at a station!</Text>
                  <Text style={{ ...typography.caption, color: colors.primary }} numberOfLines={1}>
                    {nearbyStation.name}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleDismiss} style={{ padding: 4 }}>
                <Text style={{ color: colors.textTertiary, fontSize: 18 }}>{'\u2715'}</Text>
              </TouchableOpacity>
            </View>

            {/* Question */}
            <Text style={{ ...typography.body, color: colors.text, marginBottom: 14, textAlign: 'center' }}>
              How's the station right now?
            </Text>

            {/* Quick status buttons - 2x2 grid */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <TouchableOpacity
                onPress={() => handleReport('available')}
                style={{
                  flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
                  backgroundColor: colors.statusAvailable + '15',
                  borderWidth: 1.5, borderColor: colors.statusAvailable,
                }}
              >
                <Text style={{ fontSize: 24, marginBottom: 4 }}>{'\u2705'}</Text>
                <Text style={{ ...typography.caption, color: colors.statusAvailable, fontWeight: '700' }}>Available</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleReport('partially_available')}
                style={{
                  flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
                  backgroundColor: colors.statusPartial + '15',
                  borderWidth: 1.5, borderColor: colors.statusPartial,
                }}
              >
                <Text style={{ fontSize: 24, marginBottom: 4 }}>{'\uD83D\uDFE1'}</Text>
                <Text style={{ ...typography.caption, color: colors.statusPartial, fontWeight: '700' }}>Some Free</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              <TouchableOpacity
                onPress={() => handleReport('busy')}
                style={{
                  flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
                  backgroundColor: colors.statusOccupied + '15',
                  borderWidth: 1.5, borderColor: colors.statusOccupied,
                }}
              >
                <Text style={{ fontSize: 24, marginBottom: 4 }}>{'\uD83D\uDD34'}</Text>
                <Text style={{ ...typography.caption, color: colors.statusOccupied, fontWeight: '700' }}>All Busy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleReport('out_of_service')}
                style={{
                  flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
                  backgroundColor: colors.error + '15',
                  borderWidth: 1.5, borderColor: colors.error,
                }}
              >
                <Text style={{ fontSize: 24, marginBottom: 4 }}>{'\u26A0\uFE0F'}</Text>
                <Text style={{ ...typography.caption, color: colors.error, fontWeight: '700' }}>Broken</Text>
              </TouchableOpacity>
            </View>

            {/* Spots input */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ ...typography.caption, color: colors.textSecondary }}>Free spots:</Text>
              <TextInput
                value={spots}
                onChangeText={setSpots}
                keyboardType="number-pad"
                placeholder="?"
                placeholderTextColor={colors.textTertiary}
                style={{
                  width: 50, textAlign: 'center',
                  backgroundColor: colors.surfaceSecondary, borderRadius: 8,
                  padding: 8, color: colors.text, ...typography.mono,
                  borderWidth: 1, borderColor: colors.border,
                }}
              />
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={handleDismiss}>
                <Text style={{ ...typography.caption, color: colors.textTertiary }}>Skip</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Animated.View>
  );
}
