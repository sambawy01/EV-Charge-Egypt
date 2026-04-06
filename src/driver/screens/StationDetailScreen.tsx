import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStationDetail } from '@/core/queries/useStationDetail';
import { Header, Card, LoadingScreen } from '@/core/components';
import { ConnectorRow } from '../components/ConnectorRow';
import { AmenityBadge } from '../components/AmenityBadge';
import { StationRating } from '../components/StationRating';
import { stationReportService, StationLiveStatus, StationStatus } from '@/core/services/stationReportService';
import { reliabilityScoreService, type ReliabilityScore } from '@/core/services/reliabilityScoreService';
import { ReliabilityBadge } from '@/core/components/ReliabilityBadge';
import { useTheme } from '@/core/theme';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import { useAuthStore } from '@/core/stores/authStore';

export function StationDetailScreen({ route, navigation }: any) {
  const { stationId } = route.params;
  const { data: station, isLoading } = useStationDetail(stationId);
  const { colors } = useTheme();
  const user = useAuthStore(s => s.user);
  const [liveStatus, setLiveStatus] = useState<StationLiveStatus | null>(null);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [spots, setSpots] = useState('');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isNearby, setIsNearby] = useState(false);
  const [communityPhotos, setCommunityPhotos] = useState<string[]>([]);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [reliabilityScore, setReliabilityScore] = useState<ReliabilityScore | null>(null);

  // Get user location
  useEffect(() => {
    if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Check if user is within 100m of station
  useEffect(() => {
    if (userLocation && station) {
      const R = 6371000;
      const dLat = (station.latitude - userLocation.latitude) * Math.PI / 180;
      const dLon = (station.longitude - userLocation.longitude) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(userLocation.latitude*Math.PI/180) * Math.cos(station.latitude*Math.PI/180) * Math.sin(dLon/2)**2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      setIsNearby(dist < 100);
    }
  }, [userLocation, station]);

  useEffect(() => {
    if (station?.id) {
      stationReportService.getLiveStatus(station.id).then(setLiveStatus);
      stationReportService.getPhotosForStation(station.id).then(setCommunityPhotos);
      reliabilityScoreService.getScore(station.id).then(setReliabilityScore);
    }
  }, [station?.id]);

  if (isLoading || !station) return <LoadingScreen message="Loading station..." />;

  const openNavigation = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}&travelmode=driving`;
    Linking.openURL(url);
  };

  const handleReport = async (status: StationStatus) => {
    setReportLoading(true);
    const success = await stationReportService.submitReport({
      stationId: station.id,
      userId: user?.id,
      status,
      availableSpots: spots ? parseInt(spots) : undefined,
    });
    setReportLoading(false);
    if (success) {
      setReportSubmitted(true);
      // Refresh live status + reliability score
      stationReportService.getLiveStatus(station.id).then(setLiveStatus);
      reliabilityScoreService.invalidateCache();
      reliabilityScoreService.getScore(station.id).then(setReliabilityScore);
      Alert.alert('Thanks! ⚡', 'Your report helps other EV drivers.');
    }
  };

  const statusColor = liveStatus
    ? liveStatus.status === 'available' ? colors.statusAvailable
    : liveStatus.status === 'partially_available' ? colors.statusPartial
    : liveStatus.status === 'busy' ? colors.statusOccupied
    : liveStatus.status === 'iced' ? colors.warning
    : colors.error
    : colors.textTertiary;

  const statusLabel = liveStatus
    ? liveStatus.status === 'available' ? 'Available'
    : liveStatus.status === 'partially_available' ? 'Partially Available'
    : liveStatus.status === 'busy' ? 'All Busy'
    : liveStatus.status === 'iced' ? 'ICE\'d / Blocked'
    : 'Out of Service'
    : 'No reports yet';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title={station.name} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 120 }}>

        {/* ===== COMMUNITY STATUS — TOP PRIORITY ===== */}
        <View style={{
          backgroundColor: colors.surface,
          borderWidth: 2,
          borderColor: statusColor,
          borderRadius: 16,
          padding: 16,
          marginBottom: spacing.md,
          shadowColor: statusColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 6,
        }}>
          {/* Current status header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: statusColor }} />
              <Text style={{ ...typography.h3, color: colors.text, fontSize: 18 }}>{statusLabel}</Text>
            </View>
            {liveStatus && (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ ...typography.mono, fontSize: 11, color: colors.textSecondary }}>{liveStatus.timeAgo}</Text>
                <Text style={{ ...typography.small, fontSize: 10, color: colors.textTertiary }}>{liveStatus.lastReportTime}</Text>
              </View>
            )}
          </View>

          {/* Spots + report count */}
          {liveStatus && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 14 }}>
              {liveStatus.availableSpots != null && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ ...typography.mono, fontSize: 20, color: colors.primary }}>
                    {liveStatus.availableSpots}
                  </Text>
                  <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                    /{liveStatus.totalSpots || '?'} spots free
                  </Text>
                </View>
              )}
              <Text style={{ ...typography.small, color: colors.textTertiary }}>
                📡 {liveStatus.reportCount} report{liveStatus.reportCount !== 1 ? 's' : ''} today
              </Text>
            </View>
          )}

          {/* ===== INLINE STATUS BUTTONS — ONLY WHEN NEARBY ===== */}
          {!isNearby ? (
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              backgroundColor: colors.surfaceSecondary, padding: 12, borderRadius: 10,
              borderWidth: 1, borderColor: colors.border,
            }}>
              <Text style={{ fontSize: 14 }}>📍</Text>
              <Text style={{ ...typography.caption, color: colors.textTertiary }}>
                Visit this station to update its status
              </Text>
            </View>
          ) : reportSubmitted ? (
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              backgroundColor: colors.secondary + '15', padding: 12, borderRadius: 10,
            }}>
              <Text style={{ fontSize: 16 }}>✅</Text>
              <Text style={{ ...typography.bodyBold, color: colors.secondary }}>Thanks for updating!</Text>
            </View>
          ) : (
            <>
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: 8 }}>
                Are you here? Update the status:
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {([
                  { status: 'available' as StationStatus, icon: '✅', label: 'Available', color: colors.statusAvailable },
                  { status: 'partially_available' as StationStatus, icon: '🟡', label: 'Some Free', color: colors.statusPartial },
                  { status: 'busy' as StationStatus, icon: '🔴', label: 'Busy', color: colors.statusOccupied },
                  { status: 'out_of_service' as StationStatus, icon: '⚠️', label: 'Broken', color: colors.error },
                  { status: 'iced' as StationStatus, icon: '🚗', label: 'ICE\'d', color: colors.warning },
                ]).map(opt => (
                  <TouchableOpacity
                    key={opt.status}
                    onPress={() => handleReport(opt.status)}
                    disabled={reportLoading}
                    style={{
                      flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                      backgroundColor: opt.color + '12',
                      borderWidth: 1, borderColor: opt.color + '40',
                    }}
                  >
                    {reportLoading ? (
                      <ActivityIndicator size="small" color={opt.color} />
                    ) : (
                      <>
                        <Text style={{ fontSize: 18, marginBottom: 2 }}>{opt.icon}</Text>
                        <Text style={{ fontSize: 10, color: opt.color, fontWeight: '700' }}>{opt.label}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Quick spots input */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <Text style={{ ...typography.caption, color: colors.textTertiary }}>Free spots:</Text>
                <TextInput
                  value={spots}
                  onChangeText={setSpots}
                  keyboardType="number-pad"
                  placeholder="?"
                  placeholderTextColor={colors.textTertiary}
                  style={{
                    width: 45, textAlign: 'center',
                    backgroundColor: colors.surfaceSecondary, borderRadius: 8,
                    padding: 6, color: colors.text, ...typography.mono, fontSize: 14,
                    borderWidth: 1, borderColor: colors.border,
                  }}
                />
              </View>
            </>
          )}
        </View>

        {/* Station info + Rating + Reliability */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={{ ...typography.caption, color: colors.primary, fontWeight: '600', marginBottom: 4 }}>
            {(station as any).provider?.name}
          </Text>
          <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: station.operating_hours ? 8 : 14 }}>{station.address}</Text>

          {/* Operating Hours */}
          {station.operating_hours && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <Text style={{ fontSize: 14 }}>{'\uD83D\uDD52'}</Text>
              <Text style={{ ...typography.caption, color: colors.textSecondary }}>{station.operating_hours}</Text>
            </View>
          )}

          {/* Rating + Reliability side by side */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
            {/* Rating card */}
            <View style={{
              flex: 1, backgroundColor: colors.surfaceSecondary, borderRadius: 12, padding: 14,
              borderWidth: 1, borderColor: '#FFB020' + '30', alignItems: 'center',
            }}>
              <Text style={{ ...typography.mono, fontSize: 28, color: '#FFB020' }}>
                {station.rating_avg > 0 ? station.rating_avg.toFixed(1) : '—'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 2, marginVertical: 4 }}>
                {[1,2,3,4,5].map(s => (
                  <Text key={s} style={{ fontSize: 14, color: s <= Math.round(station.rating_avg) ? '#FFB020' : colors.textTertiary }}>★</Text>
                ))}
              </View>
              <Text style={{ ...typography.small, color: colors.textSecondary }}>{station.review_count} reviews</Text>
            </View>

            {/* WattsOn Reliability Score card */}
            {(() => {
              const scoreColor = reliabilityScore
                ? reliabilityScore.color === 'green' ? colors.statusAvailable
                  : reliabilityScore.color === 'yellow' ? colors.statusPartial
                  : colors.statusOccupied
                : colors.textTertiary;
              const scoreLabel = reliabilityScore
                ? reliabilityScore.label === 'excellent' ? 'Excellent'
                  : reliabilityScore.label === 'good' ? 'Good'
                  : reliabilityScore.label === 'poor' ? 'Poor'
                  : 'Fair'
                : 'No data';
              return (
                <View style={{
                  flex: 1, backgroundColor: colors.surfaceSecondary, borderRadius: 12, padding: 14,
                  borderWidth: 1, borderColor: (scoreColor || colors.border) + '30', alignItems: 'center',
                }}>
                  <Text style={{ ...typography.mono, fontSize: 28, color: scoreColor }}>
                    {reliabilityScore ? reliabilityScore.score.toFixed(1) : '—'}
                  </Text>
                  <Text style={{ ...typography.small, color: colors.textSecondary, marginVertical: 4 }}>
                    / 10
                  </Text>
                  <Text style={{ ...typography.small, color: colors.textSecondary }}>
                    Reliability: {scoreLabel}
                  </Text>
                  {reliabilityScore && (
                    <Text style={{ ...typography.small, fontSize: 9, color: colors.textTertiary, marginTop: 2 }}>
                      {reliabilityScore.totalReports} verified report{reliabilityScore.totalReports !== 1 ? 's' : ''}
                    </Text>
                  )}
                </View>
              );
            })()}
          </View>

          {/* Rate & Review */}
          <StationRating
            stationId={station.id}
            stationName={station.name}
            currentRating={station.rating_avg}
            reviewCount={station.review_count}
            isNearby={isNearby}
          />
        </Card>

        {/* AI Prediction */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={{ ...typography.bodyBold, color: colors.text, marginBottom: spacing.sm }}>Community Status</Text>
          <Text style={{ ...typography.body, color: colors.textSecondary, fontStyle: 'italic' }}>
            {liveStatus
              ? `Last reported: ${liveStatus.status === 'available' ? 'Available' : liveStatus.status === 'busy' ? 'Busy' : liveStatus.status === 'partially_available' ? 'Partially available' : liveStatus.status === 'iced' ? 'ICE\'d / Blocked' : 'Out of service'} (${liveStatus.timeAgo})`
              : 'No community reports yet — be the first to report!'}
          </Text>
        </Card>

        {/* Community Photos */}
        {communityPhotos.length > 0 && (
          <Card style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <Text style={{ ...typography.bodyBold, color: colors.text }}>Community Photos</Text>
              <Text style={{ ...typography.small, color: colors.textTertiary }}>
                {communityPhotos.length} photo{communityPhotos.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -4 }}
            >
              <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 4 }}>
                {communityPhotos.map((url, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => { setSelectedPhotoIndex(index); setPhotoModalVisible(true); }}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={{ uri: url }}
                      style={{
                        width: 120, height: 90, borderRadius: 12,
                        borderWidth: 1.5, borderColor: colors.primary + '25',
                      }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </Card>
        )}

        {/* Photo fullscreen modal */}
        <Modal
          visible={photoModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPhotoModalVisible(false)}
        >
          <View style={{
            flex: 1, backgroundColor: 'rgba(0,0,0,0.92)',
            justifyContent: 'center', alignItems: 'center',
          }}>
            <TouchableOpacity
              onPress={() => setPhotoModalVisible(false)}
              style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8 }}
            >
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700' }}>{'\u2715'}</Text>
            </TouchableOpacity>

            {communityPhotos[selectedPhotoIndex] && (
              <Image
                source={{ uri: communityPhotos[selectedPhotoIndex] }}
                style={{
                  width: Dimensions.get('window').width - 32,
                  height: Dimensions.get('window').height * 0.6,
                  borderRadius: 16,
                }}
                resizeMode="contain"
              />
            )}

            {/* Photo counter */}
            <Text style={{ color: '#fff', ...typography.caption, marginTop: 16, opacity: 0.7 }}>
              {selectedPhotoIndex + 1} / {communityPhotos.length}
            </Text>

            {/* Nav arrows */}
            <View style={{ flexDirection: 'row', gap: 40, marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => setSelectedPhotoIndex(i => Math.max(0, i - 1))}
                style={{
                  width: 48, height: 48, borderRadius: 24,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: selectedPhotoIndex === 0 ? 0.3 : 1,
                }}
                disabled={selectedPhotoIndex === 0}
              >
                <Text style={{ color: '#fff', fontSize: 22 }}>{'\u2039'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedPhotoIndex(i => Math.min(communityPhotos.length - 1, i + 1))}
                style={{
                  width: 48, height: 48, borderRadius: 24,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: selectedPhotoIndex === communityPhotos.length - 1 ? 0.3 : 1,
                }}
                disabled={selectedPhotoIndex === communityPhotos.length - 1}
              >
                <Text style={{ color: '#fff', fontSize: 22 }}>{'\u203A'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Connectors */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={{ ...typography.bodyBold, color: colors.text, marginBottom: spacing.sm }}>Connectors</Text>
          {station.connectors?.map((c) => (
            <ConnectorRow key={c.id} connector={c} />
          ))}
        </Card>

        {/* Amenities */}
        {station.amenities.length > 0 && (
          <Card style={{ marginBottom: spacing.md }}>
            <Text style={{ ...typography.bodyBold, color: colors.text, marginBottom: spacing.sm }}>Amenities</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {station.amenities.map((a) => (
                <AmenityBadge key={a} amenity={a} />
              ))}
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Bottom action — Navigate only, no booking */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: spacing.md, backgroundColor: colors.surface,
        borderTopWidth: 1, borderTopColor: colors.border,
      }}>
        <TouchableOpacity onPress={openNavigation} activeOpacity={0.85}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 14, paddingVertical: 16,
              alignItems: 'center', justifyContent: 'center',
              flexDirection: 'row', gap: 8,
            }}
          >
            <Text style={{ fontSize: 18 }}>📍</Text>
            <Text style={{ ...typography.button, fontSize: 16, color: colors.black }}>Navigate</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}
