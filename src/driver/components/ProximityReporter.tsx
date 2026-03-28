import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, TextInput } from 'react-native';
import { useTheme } from '@/core/theme';
import { typography } from '@/core/theme/typography';
import { stationReportService, StationStatus } from '@/core/services/stationReportService';
import { visitTracker } from '@/core/services/visitTracker';
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

type PopupMode = 'status' | 'rating' | 'thanks';

export function ProximityReporter({ stations, userLocation }: Props) {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const [popupStation, setPopupStation] = useState<typeof stations[0] | null>(null);
  const [popupMode, setPopupMode] = useState<PopupMode>('status');
  const [showPopup, setShowPopup] = useState(false);
  const [dismissedStations, setDismissedStations] = useState<Set<string>>(new Set());
  const [dismissedRatings, setDismissedRatings] = useState<Set<string>>(new Set());
  const [spots, setSpots] = useState('');
  const [userRating, setUserRating] = useState(0);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Track which stations user is currently near
  const nearbyRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userLocation || stations.length === 0) return;

    const currentlyNear = new Set<string>();

    for (const station of stations) {
      const dist = haversineM(userLocation.latitude, userLocation.longitude, station.latitude, station.longitude);

      if (dist < 100) {
        currentlyNear.add(station.id);

        // Just arrived — record visit + show status popup
        if (!nearbyRef.current.has(station.id) && !dismissedStations.has(station.id)) {
          visitTracker.recordArrival(station.id, station.name);
          setPopupStation(station);
          setPopupMode('status');
          setShowPopup(true);
          setSpots('');
          setUserRating(0);
          Animated.spring(slideAnim, { toValue: 0, useNativeDriver: false, tension: 50, friction: 8 }).start();
          Animated.loop(
            Animated.sequence([
              Animated.timing(pulseAnim, { toValue: 1.05, duration: 600, useNativeDriver: false }),
              Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: false }),
            ])
          ).start();
        }
      }
    }

    // Check if user LEFT any station they were near
    for (const prevId of nearbyRef.current) {
      if (!currentlyNear.has(prevId) && !dismissedRatings.has(prevId)) {
        // User left this station — record departure and ask for rating
        visitTracker.recordDeparture(prevId);
        const station = stations.find(s => s.id === prevId);
        if (station) {
          // Small delay so the status popup clears first
          setTimeout(() => {
            setPopupStation(station);
            setPopupMode('rating');
            setShowPopup(true);
            setUserRating(0);
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: false, tension: 50, friction: 8 }).start();
          }, 1500);
        }
      }
    }

    nearbyRef.current = currentlyNear;
  }, [userLocation, stations, dismissedStations, dismissedRatings]);

  const handleReport = async (status: StationStatus) => {
    if (!popupStation) return;
    await stationReportService.submitReport({
      stationId: popupStation.id,
      userId: user?.id,
      status,
      availableSpots: spots ? parseInt(spots, 10) : undefined,
    });
    setPopupMode('thanks');
    setTimeout(() => {
      setShowPopup(false);
      setDismissedStations((prev) => new Set([...prev, popupStation.id]));
    }, 2000);
  };

  const handleRatingSubmit = async () => {
    if (!popupStation || userRating === 0) return;
    await visitTracker.markRated(popupStation.id);
    setPopupMode('thanks');
    setTimeout(() => {
      setShowPopup(false);
      setDismissedRatings((prev) => new Set([...prev, popupStation.id]));
    }, 2000);
  };

  const handleDismiss = () => {
    if (popupStation) {
      if (popupMode === 'status') {
        setDismissedStations((prev) => new Set([...prev, popupStation.id]));
      } else {
        setDismissedRatings((prev) => new Set([...prev, popupStation.id]));
      }
    }
    Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: false }).start(() => {
      setShowPopup(false);
    });
  };

  if (!showPopup || !popupStation) return null;

  return (
    <Animated.View style={{
      position: 'absolute',
      bottom: 20,
      left: 16,
      right: 16,
      transform: [{ translateY: slideAnim }, { scale: popupMode === 'status' ? pulseAnim : 1 }],
      zIndex: 1000,
    }}>
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 20,
        borderWidth: 2,
        borderColor: popupMode === 'rating' ? '#FFB020' : colors.primary,
        shadowColor: popupMode === 'rating' ? '#FFB020' : colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 15,
      }}>
        {popupMode === 'thanks' ? (
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>{'\u26A1'}</Text>
            <Text style={{ ...typography.h3, color: colors.secondary }}>Thanks!</Text>
            <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 4 }}>
              You're helping other EV drivers
            </Text>
          </View>

        ) : popupMode === 'rating' ? (
          <>
            {/* Rating popup — shown after leaving station */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: '#FFB020' + '20',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 20 }}>{'\u2B50'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...typography.bodyBold, color: colors.text }}>How was your visit?</Text>
                  <Text style={{ ...typography.caption, color: '#FFB020' }} numberOfLines={1}>
                    {popupStation.name}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleDismiss} style={{ padding: 4 }}>
                <Text style={{ color: colors.textTertiary, fontSize: 18 }}>{'\u2715'}</Text>
              </TouchableOpacity>
            </View>

            {/* Star rating */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
              {[1, 2, 3, 4, 5].map(s => (
                <TouchableOpacity key={s} onPress={() => setUserRating(s)}>
                  <Text style={{ fontSize: 36, color: s <= userRating ? '#FFB020' : colors.textTertiary }}>
                    {'\u2605'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Submit */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={handleDismiss}
                style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: colors.border }}
              >
                <Text style={{ ...typography.caption, color: colors.textTertiary }}>Maybe Later</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRatingSubmit}
                style={{
                  flex: 2, paddingVertical: 12, alignItems: 'center',
                  borderRadius: 10, backgroundColor: userRating > 0 ? '#FFB020' : colors.surfaceSecondary,
                }}
              >
                <Text style={{ ...typography.button, color: userRating > 0 ? colors.black : colors.textTertiary }}>
                  Submit Rating
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={{ ...typography.small, color: colors.textTertiary, textAlign: 'center', marginTop: 8 }}>
              You can rate within 48h of your visit
            </Text>
          </>

        ) : (
          <>
            {/* Status report popup — shown on arrival */}
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
                    {popupStation.name}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleDismiss} style={{ padding: 4 }}>
                <Text style={{ color: colors.textTertiary, fontSize: 18 }}>{'\u2715'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ ...typography.body, color: colors.text, marginBottom: 14, textAlign: 'center' }}>
              How's the station right now?
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <TouchableOpacity onPress={() => handleReport('available')} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.statusAvailable + '15', borderWidth: 1.5, borderColor: colors.statusAvailable }}>
                <Text style={{ fontSize: 24, marginBottom: 4 }}>{'\u2705'}</Text>
                <Text style={{ ...typography.caption, color: colors.statusAvailable, fontWeight: '700' }}>Available</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleReport('partially_available')} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.statusPartial + '15', borderWidth: 1.5, borderColor: colors.statusPartial }}>
                <Text style={{ fontSize: 24, marginBottom: 4 }}>{'\uD83D\uDFE1'}</Text>
                <Text style={{ ...typography.caption, color: colors.statusPartial, fontWeight: '700' }}>Some Free</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              <TouchableOpacity onPress={() => handleReport('busy')} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.statusOccupied + '15', borderWidth: 1.5, borderColor: colors.statusOccupied }}>
                <Text style={{ fontSize: 24, marginBottom: 4 }}>{'\uD83D\uDD34'}</Text>
                <Text style={{ ...typography.caption, color: colors.statusOccupied, fontWeight: '700' }}>All Busy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleReport('out_of_service')} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.error + '15', borderWidth: 1.5, borderColor: colors.error }}>
                <Text style={{ fontSize: 24, marginBottom: 4 }}>{'\u26A0\uFE0F'}</Text>
                <Text style={{ ...typography.caption, color: colors.error, fontWeight: '700' }}>Broken</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ ...typography.caption, color: colors.textSecondary }}>Free spots:</Text>
              <TextInput value={spots} onChangeText={setSpots} keyboardType="number-pad" placeholder="?" placeholderTextColor={colors.textTertiary} style={{ width: 50, textAlign: 'center', backgroundColor: colors.surfaceSecondary, borderRadius: 8, padding: 8, color: colors.text, ...typography.mono, borderWidth: 1, borderColor: colors.border }} />
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
