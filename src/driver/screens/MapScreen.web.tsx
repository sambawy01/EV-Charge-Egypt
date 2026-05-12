import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useStations } from '@/core/queries/useStations';
import { useMapStore } from '@/core/stores/mapStore';
import { WebMap } from '../components/WebMap';
import { FilterModal, loadDefaultPreset } from '../components/FilterModal';
import { ProximityReporter } from '../components/ProximityReporter';
import { LoadingScreen } from '@/core/components';
import { colors } from '@/core/theme/colors';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import type { Station } from '@/core/types/station';
import { aiContextService } from '@/core/services/aiContextService';
import { stationReportService } from '@/core/services/stationReportService';
import { reliabilityScoreService, type ReliabilityScore } from '@/core/services/reliabilityScoreService';
import { ReliabilityBadge } from '@/core/components/ReliabilityBadge';
import { supabase } from '@/core/config/supabase';
import { useVehicles } from '@/core/queries/useVehicles';
import { homeChargerService, HomeCharger } from '@/core/services/homeChargerService';

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useWebLocation() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [resolved, setResolved] = useState(false);
  useEffect(() => {
    if (!navigator?.geolocation) {
      setResolved(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setResolved(true);
      },
      () => setResolved(true),
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    );
  }, []);
  return { location, resolved };
}

// ---------------------------------------------------------------------------
// Filter chip definitions
// ---------------------------------------------------------------------------

const FILTER_CHIPS = ['All', 'CCS', 'Type 2', 'CHAdeMO', 'DC Fast', 'Available'] as const;
type FilterChip = (typeof FILTER_CHIPS)[number];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMaxPowerKw(station: Station): number | null {
  if (!station.connectors || station.connectors.length === 0) return null;
  return Math.max(...station.connectors.map((c) => c.power_kw));
}

function getStatusColor(station: Station): string {
  switch (station.status) {
    case 'available':
      return colors.statusAvailable;
    case 'partial':
      return colors.statusPartial;
    case 'occupied':
      return colors.statusOccupied;
    case 'offline':
      return colors.statusOffline;
    default:
      return colors.statusAvailable;
  }
}

function matchesChipFilter(station: Station, chip: FilterChip): boolean {
  if (chip === 'All') return true;
  if (chip === 'Available') return station.status === 'available';
  if (chip === 'DC Fast') {
    return (station.connectors || []).some((c) => c.power_kw >= 50);
  }
  // Connector type filters
  const typeMap: Record<string, string> = { CCS: 'CCS', 'Type 2': 'Type2', CHAdeMO: 'CHAdeMO' };
  const connectorType = typeMap[chip];
  if (connectorType) {
    return (station.connectors || []).some((c) => c.type === connectorType);
  }
  return true;
}

function buildPanelTitle(
  stations: Station[],
  searchQuery: string,
  userLocation: { latitude: number; longitude: number } | null
): string {
  const count = stations.length;
  const noun = count === 1 ? 'station' : 'stations';
  if (searchQuery) return `${count} ${noun} for "${searchQuery}"`;
  if (count === 0) return 'No stations nearby';
  const nearest = stations[0];
  if (nearest?.distance_km != null && userLocation) {
    if (nearest.distance_km < 50) return `${count} ${noun} near you`;
    return `${count} ${noun} in Egypt (nearest ${Math.round(nearest.distance_km)} km away)`;
  }
  return `${count} ${noun} in Egypt`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MapScreen({ navigation }: any) {
  const { searchQuery, filters, setSearchQuery, setFilters } = useMapStore();
  const [showFilter, setShowFilter] = useState(false);
  const [activeChip, setActiveChip] = useState<FilterChip>('All');
  const { location: hookLocation, resolved: gpsResolved } = useWebLocation();
  const [manualLocation, setManualLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const userLocation = manualLocation || hookLocation;

  const { data: stations, isLoading } = useStations(filters, userLocation);
  const { data: vehicles } = useVehicles();

  // Home chargers state
  const [homeChargers, setHomeChargers] = useState<HomeCharger[]>([]);
  const [showHomeChargers, setShowHomeChargers] = useState(true);

  // Load default filter preset + home chargers on mount
  useEffect(() => {
    loadDefaultPreset().then((defaultFilter) => {
      if (defaultFilter) setFilters(defaultFilter);
    });
    homeChargerService.listHomeChargers().then(setHomeChargers);
  }, []);

  // Listen for messages from the map iframe (station clicks + status reports).
  // The iframe is same-origin (built via doc.write in WebMap), so legitimate
  // messages have event.origin === window.location.origin. Anything from a
  // cross-origin embedder or a popup with window.opener is rejected here.
  useEffect(() => {
    const expectedOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const allowedStationIdRe = /^[a-zA-Z0-9_-]{1,64}$/;
    const allowedStatuses = ['available', 'partially_available', 'busy', 'out_of_service'];

    const handleMessage = (event: MessageEvent) => {
      // Cross-origin attacker check: reject anything that didn't come from
      // our own origin. The same-origin iframe and our own popups pass this.
      if (event.origin && event.origin !== expectedOrigin) return;

      const data = event.data;
      if (!data || typeof data !== 'object') return;

      // Validate stationId shape at the boundary (whitelist).
      const stationId = typeof data.stationId === 'string' && allowedStationIdRe.test(data.stationId)
        ? data.stationId
        : null;
      if (!stationId) return;

      if (data.type === 'stationClick') {
        navigation.navigate('StationDetail', { stationId });
        return;
      }
      if (data.type === 'statusReport' && typeof data.status === 'string' && allowedStatuses.includes(data.status)) {
        // Reassign normalized values so downstream code uses validated inputs.
        data.stationId = stationId;
        // Proximity check — must be within 100m
        if (userLocation && data.lat && data.lng) {
          const R = 6371000;
          const dLat = (data.lat - userLocation.latitude) * Math.PI / 180;
          const dLon = (data.lng - userLocation.longitude) * Math.PI / 180;
          const a = Math.sin(dLat/2)**2 + Math.cos(userLocation.latitude*Math.PI/180) * Math.cos(data.lat*Math.PI/180) * Math.sin(dLon/2)**2;
          const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          if (dist > 100) {
            Alert.alert(
              '📍 Too Far Away',
              'You need to be within 100 meters of the station to update its status. This helps ensure accurate, spam-free reports for all EV drivers.',
              [{ text: 'Got it' }]
            );
            return;
          }
        } else if (!userLocation) {
          Alert.alert(
            '📍 Location Required',
            'Please enable location services to report station status. You must be within 100 meters of the station.',
            [{ text: 'OK' }]
          );
          return;
        }
        stationReportService.submitReport({
          stationId: data.stationId,
          status: data.status,
        }).then((ok) => {
          if (ok) {
            Alert.alert('Thanks! ⚡', 'Station status updated.');
            stationReportService.getAllLiveStatuses().then(setLiveStatuses);
          }
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigation]);

  const handleStationPress = useCallback(
    (station: Station) => {
      navigation.navigate('StationDetail', { stationId: station.id });
    },
    [navigation]
  );

  // Local search + chip filtering
  const filteredStations = (stations || []).filter((s) => {
    // Text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesText =
        s.name.toLowerCase().includes(q) ||
        (s.address ?? '').toLowerCase().includes(q) ||
        (s.area ?? '').toLowerCase().includes(q) ||
        (s.provider?.name ?? '').toLowerCase().includes(q);
      if (!matchesText) return false;
    }
    // Chip filter
    return matchesChipFilter(s, activeChip);
  });

  // Build AI context and recommendations
  const aiContext = useMemo(() => {
    if (!vehicles?.length) return null;
    return aiContextService.buildContext(vehicles[0], location);
  }, [vehicles, location]);

  const displayStations = filteredStations;

  const recommendations = useMemo(() => {
    if (!aiContext || !displayStations.length) return new Map();
    const recs = aiContextService.recommendStations(displayStations, aiContext);
    const map = new Map<string, any>();
    recs.forEach(r => map.set(r.stationId, r));
    return map;
  }, [aiContext, displayStations]);

  // Live community statuses
  const [liveStatuses, setLiveStatuses] = useState<Map<string, any>>(new Map());
  const [reliabilityScores, setReliabilityScores] = useState<Map<string, ReliabilityScore>>(new Map());
  const [stationPhotos, setStationPhotos] = useState<Map<string, { count: number; firstPhotoUrl: string | null }>>(new Map());

  useEffect(() => {
    stationReportService.getAllLiveStatuses().then(setLiveStatuses);
    reliabilityScoreService.getAllScores().then(setReliabilityScores);
  }, []);

  // Fetch photo counts after stations load (non-blocking)
  useEffect(() => {
    if (!stations || stations.length === 0) return;
    const ids = stations.map((s: Station) => s.id);
    stationReportService.getPhotoCountsForStations(ids).then(setStationPhotos).catch(() => {});
  }, [stations]);

  // Subscribe to real-time status updates
  useEffect(() => {
    const channel = supabase
      .channel('station-reports')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'station_reports' }, () => {
        // Refresh live statuses and reliability scores when a new report comes in
        stationReportService.getAllLiveStatuses().then(setLiveStatuses);
        reliabilityScoreService.invalidateCache();
        reliabilityScoreService.getAllScores().then(setReliabilityScores);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;

  if (!gpsResolved || isLoading) return <LoadingScreen message="Finding your location..." />;

  const panelTitle = buildPanelTitle(filteredStations, searchQuery, userLocation);

  // --- Mobile: full-screen map with overlays ---
  if (isMobile) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Full screen map */}
        <View style={{ flex: 1 }}>
          <WebMap stations={displayStations} homeChargers={showHomeChargers ? homeChargers : []} onStationPress={handleStationPress} userLocation={userLocation} />
        </View>

        {/* Search bar overlay at top */}
        <View style={{
          position: 'absolute', top: 12, left: 12, right: 12,
          backgroundColor: colors.surface,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          height: 44,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
        }}>
          <Text style={{ color: colors.textTertiary, marginRight: 8 }}>{'\uD83D\uDD0D'}</Text>
          <TextInput
            placeholder="Search stations..."
            placeholderTextColor={colors.textTertiary}
            style={{ flex: 1, color: colors.text, fontSize: 14 }}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter chips overlay - below search bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            position: 'absolute',
            top: 64,
            left: 0,
            right: 0,
            paddingHorizontal: 12,
          }}
          contentContainerStyle={{ gap: 6, paddingRight: 12 }}
        >
          {FILTER_CHIPS.map((chip) => (
            <TouchableOpacity
              key={chip}
              onPress={() => setActiveChip(chip)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                backgroundColor: activeChip === chip ? colors.primaryLight : colors.surface,
                borderWidth: 1,
                borderColor: activeChip === chip ? colors.primary : colors.border,
              }}
            >
              <Text style={{
                fontSize: 11,
                fontWeight: '600',
                color: activeChip === chip ? colors.primary : colors.textSecondary,
              }}>
                {chip}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Bottom station count + nearest station cards */}
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: colors.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 24,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          maxHeight: 200,
        }}>
          <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 12 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ ...typography.caption, color: colors.textTertiary }}>
              {displayStations.length} stations nearby
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SubmitStation')}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: colors.secondary + '15', borderWidth: 1, borderColor: colors.secondary,
                borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
              }}
            >
              <Text style={{ fontSize: 10 }}>{'\u2795'}</Text>
              <Text style={{ fontSize: 10, fontWeight: '600', color: colors.secondary }}>Add Station</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('ListHomeCharger')}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: '#00FF8815', borderWidth: 1, borderColor: '#00FF88',
                borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
              }}
            >
              <Text style={{ fontSize: 10 }}>{'\uD83C\uDFE0'}</Text>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#00FF88' }}>Share Charger</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {displayStations.slice(0, 5).map((station) => {
              const statusColor = getStatusColor(station);
              const statusLabel = station.status === 'available' ? 'Available'
                : station.status === 'partial' ? 'Partial'
                : station.status === 'occupied' ? 'Busy'
                : station.status === 'offline' ? 'Offline'
                : 'Available';
              return (
                <TouchableOpacity
                  key={station.id}
                  onPress={() => handleStationPress(station)}
                  style={{
                    backgroundColor: colors.surfaceSecondary,
                    borderRadius: 12,
                    padding: 12,
                    width: 200,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  {/* Status dot + label + photo thumbnail */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusColor }} />
                        <Text style={{ fontSize: 10, fontWeight: '600', color: statusColor }}>{statusLabel}</Text>
                      </View>
                    </View>
                    {(() => {
                      const photoData = stationPhotos.get(station.id);
                      if (!photoData?.firstPhotoUrl) return null;
                      return (
                        <View style={{ position: 'relative' }}>
                          <img
                            src={photoData.firstPhotoUrl}
                            style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }}
                          />
                          {photoData.count > 1 && (
                            <View style={{
                              position: 'absolute', bottom: -3, right: -3,
                              backgroundColor: colors.surface, borderRadius: 8,
                              paddingHorizontal: 4, paddingVertical: 1,
                              borderWidth: 1, borderColor: colors.border,
                            }}>
                              <Text style={{ fontSize: 7, color: colors.textSecondary, fontWeight: '600' }}>
                                {'\uD83D\uDCF7'} {photoData.count}
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })()}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ ...typography.bodyBold, color: colors.text, fontSize: 13, flex: 1 }} numberOfLines={1}>{station.name}</Text>
                    {(station as any).is_verified && (
                      <Text style={{ fontSize: 11, color: '#00D4FF', fontWeight: '700' }}>{'\u2713'}</Text>
                    )}
                  </View>
                  <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>{station.address || station.city}</Text>
                  {station.rating_avg > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                      <Text style={{ fontSize: 10, color: '#FFB020' }}>{'\u2605'}</Text>
                      <Text style={{ fontSize: 10, color: colors.textSecondary }}>
                        {station.rating_avg.toFixed(1)} ({station.review_count})
                      </Text>
                    </View>
                  )}
                  {(() => {
                    const live = liveStatuses.get(station.id);
                    if (!live) return null;
                    const liveColor = live.status === 'available' ? colors.statusAvailable :
                      live.status === 'partially_available' ? colors.statusPartial :
                      live.status === 'busy' ? colors.statusOccupied : live.status === 'iced' ? colors.warning : colors.error;
                    return (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                        <Text style={{ fontSize: 8 }}>{'\uD83D\uDCE1'}</Text>
                        <Text style={{ fontSize: 9, color: liveColor, fontWeight: '600' }}>
                          {live.status === 'available' ? 'Available' : live.status === 'partially_available' ? 'Some free' : live.status === 'busy' ? 'Busy' : live.status === 'iced' ? 'ICE\'d' : 'Out of service'}
                        </Text>
                        <Text style={{ fontSize: 8, color: colors.textTertiary }}>{'\u00B7'} {live.timeAgo} {'\u00B7'} {live.lastReportTime}</Text>
                      </View>
                    );
                  })()}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    {station.distance_km != null ? (
                      <Text style={{ ...typography.mono, color: colors.primary, fontSize: 12 }}>
                        {station.distance_km < 1 ? `${Math.round(station.distance_km * 1000)}m` : `${station.distance_km.toFixed(1)} km`}
                      </Text>
                    ) : <View />}
                    {station.distance_km != null && station.distance_km <= 0.1 ? (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          Alert.alert(
                            `Report: ${station.name}`,
                            'What\'s the current status?',
                            [
                              { text: '\u2705 Available', onPress: () => stationReportService.submitReport({ stationId: station.id, userId: undefined, status: 'available' }).then(() => Alert.alert('Thanks! \u26A1')) },
                              { text: '\uD83D\uDFE1 Some Free', onPress: () => stationReportService.submitReport({ stationId: station.id, userId: undefined, status: 'partially_available' }).then(() => Alert.alert('Thanks! \u26A1')) },
                              { text: '\uD83D\uDD34 All Busy', onPress: () => stationReportService.submitReport({ stationId: station.id, userId: undefined, status: 'busy' }).then(() => Alert.alert('Thanks! \u26A1')) },
                              { text: '\u26A0\uFE0F Broken', style: 'destructive', onPress: () => stationReportService.submitReport({ stationId: station.id, userId: undefined, status: 'out_of_service' }).then(() => Alert.alert('Thanks! \u26A1')) },
                              { text: '\uD83D\uDE97 ICE\'d', onPress: () => stationReportService.submitReport({ stationId: station.id, userId: undefined, status: 'iced' }).then(() => Alert.alert('Thanks! \u26A1')) },
                              { text: 'Cancel', style: 'cancel' },
                            ]
                          );
                        }}
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 6,
                          backgroundColor: colors.secondary + '15',
                          borderWidth: 1,
                          borderColor: colors.secondary,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '600', color: colors.secondary }}>{'\uD83D\uDCE1'} Report</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Locate Me button */}
        <TouchableOpacity
          onPress={() => {
            if (navigator?.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  setManualLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                },
                () => Alert.alert('Location Error', 'Could not get your location'),
                { enableHighAccuracy: true }
              );
            }
          }}
          style={{
            position: 'absolute',
            bottom: 220,
            right: 16,
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Text style={{ fontSize: 20 }}>{'\uD83D\uDCCD'}</Text>
        </TouchableOpacity>

        {/* Proximity detection popup */}
        <ProximityReporter stations={displayStations} userLocation={userLocation} />

        {/* Filter modal */}
        <FilterModal
          visible={showFilter}
          onClose={() => setShowFilter(false)}
          onApply={setFilters}
          initialFilter={filters}
        />
      </View>
    );
  }

  // --- Desktop: side-by-side panel + map ---
  return (
    <View style={styles.root}>
      {/* ---- Left Station Panel ---- */}
      <View style={styles.panel}>
        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>{'\uD83D\uDD0D'}</Text>
            <TextInput
              placeholder="Search stations..."
              placeholderTextColor={colors.textTertiary}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity onPress={() => setShowFilter(true)} style={styles.filterButton}>
              <Text style={styles.filterIcon}>{'\u2699\uFE0F'}</Text>
            </TouchableOpacity>
          </View>

          {/* Filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {FILTER_CHIPS.map((chip) => {
              const isActive = activeChip === chip;
              return (
                <TouchableOpacity
                  key={chip}
                  onPress={() => setActiveChip(chip)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isActive ? colors.primaryLight : colors.surfaceSecondary,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isActive ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {chip}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Station count */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>{panelTitle}</Text>
        </View>

        {/* Submit Station button */}
        <TouchableOpacity
          onPress={() => navigation.navigate('SubmitStation')}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
            backgroundColor: colors.secondary + '15', borderWidth: 1, borderColor: colors.secondary,
            borderRadius: 10, paddingVertical: 8, marginHorizontal: 16, marginBottom: 8, marginTop: 4,
          }}
        >
          <Text style={{ fontSize: 14 }}>{'\u2795'}</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.secondary }}>Submit New Station</Text>
        </TouchableOpacity>

        {/* Share Your Charger banner */}
        <TouchableOpacity
          onPress={() => navigation.navigate('ListHomeCharger')}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: '#00FF8810', borderWidth: 1, borderColor: '#00FF8830',
            borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12,
            marginHorizontal: 16, marginBottom: 8,
          }}
        >
          <Text style={{ fontSize: 18 }}>{'\uD83C\uDFE0'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#00FF88' }}>Share Your Charger</Text>
            <Text style={{ fontSize: 10, color: colors.textTertiary }}>List your home charger for other EV drivers</Text>
          </View>
          <Text style={{ fontSize: 14, color: '#00FF88' }}>{'\u203A'}</Text>
        </TouchableOpacity>

        {/* Home chargers toggle */}
        {homeChargers.length > 0 && (
          <TouchableOpacity
            onPress={() => setShowHomeChargers(!showHomeChargers)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              marginHorizontal: 16, marginBottom: 8,
              paddingVertical: 6, paddingHorizontal: 10,
              backgroundColor: showHomeChargers ? '#00FF8815' : colors.surfaceSecondary,
              borderRadius: 8, borderWidth: 1,
              borderColor: showHomeChargers ? '#00FF8840' : colors.border,
            }}
          >
            <Text style={{ fontSize: 14 }}>{'\uD83C\uDFE0'}</Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: showHomeChargers ? '#00FF88' : colors.textSecondary }}>
              Home Chargers ({homeChargers.length})
            </Text>
            <View style={{
              width: 8, height: 8, borderRadius: 4, marginLeft: 'auto',
              backgroundColor: showHomeChargers ? '#00FF88' : colors.textTertiary,
            }} />
          </TouchableOpacity>
        )}

        {/* Station list */}
        <ScrollView style={styles.stationList} showsVerticalScrollIndicator={false}>
          {filteredStations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No stations found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `No results for "${searchQuery}". Try a different search.`
                  : 'No EV charging stations match your filters.'}
              </Text>
            </View>
          ) : (
            filteredStations.map((station) => {
              const powerKw = getMaxPowerKw(station);
              const statusColor = getStatusColor(station);
              const providerName = station.provider?.name ?? '';

              return (
                <TouchableOpacity
                  key={station.id}
                  onPress={() => handleStationPress(station)}
                  style={styles.stationCard}
                  activeOpacity={0.7}
                >
                  {/* Availability dot */}
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />

                  {/* Info */}
                  <View style={styles.stationInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={styles.stationName} numberOfLines={1}>
                        {station.name}
                      </Text>
                      {(station as any).is_verified && (
                        <Text style={{ fontSize: 11, color: '#00D4FF', fontWeight: '700' }}>{'\u2713'}</Text>
                      )}
                    </View>
                    <Text style={styles.stationAddress} numberOfLines={1}>
                      {station.address || station.city || station.area || ''}
                    </Text>
                    <View style={styles.metaRow}>
                      {powerKw != null && (
                        <View style={styles.powerBadge}>
                          <Text style={styles.powerText}>{powerKw} kW</Text>
                        </View>
                      )}
                      {station.connectors && station.connectors.length > 0 && (
                        <View style={styles.connectorBadge}>
                          <Text style={styles.connectorText}>
                            {Array.from(new Set(station.connectors.map((c) => c.type))).join(' / ')}
                          </Text>
                        </View>
                      )}
                      {providerName ? (
                        <Text style={styles.providerText}>{providerName}</Text>
                      ) : null}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      {station.rating_avg > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Text style={{ fontSize: 10, color: '#FFB020' }}>{'\u2605'}</Text>
                          <Text style={{ fontSize: 10, color: colors.textSecondary }}>
                            {station.rating_avg.toFixed(1)} ({station.review_count})
                          </Text>
                        </View>
                      )}
                      {reliabilityScores.has(station.id) && (
                        <ReliabilityBadge score={reliabilityScores.get(station.id)!} />
                      )}
                    </View>
                    {(() => {
                      const live = liveStatuses.get(station.id);
                      if (!live) return null;
                      const liveColor = live.status === 'available' ? colors.statusAvailable :
                        live.status === 'partially_available' ? colors.statusPartial :
                        live.status === 'busy' ? colors.statusOccupied : live.status === 'iced' ? colors.warning : colors.error;
                      return (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                          <Text style={{ fontSize: 8 }}>{'\uD83D\uDCE1'}</Text>
                          <Text style={{ fontSize: 9, color: liveColor, fontWeight: '600' }}>
                            {live.status === 'available' ? 'Available' : live.status === 'partially_available' ? 'Some free' : live.status === 'busy' ? 'Busy' : live.status === 'iced' ? 'ICE\'d' : 'Out of service'}
                          </Text>
                          <Text style={{ fontSize: 8, color: colors.textTertiary }}>{'\u00B7'} {live.timeAgo} {'\u00B7'} {live.lastReportTime}</Text>
                        </View>
                      );
                    })()}
                    {(() => {
                      const rec = recommendations.get(station.id);
                      if (!rec || rec.score < 60) return null;
                      return (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                          <View style={{
                            backgroundColor: rec.score >= 80 ? 'rgba(0, 255, 136, 0.15)' : 'rgba(0, 212, 255, 0.15)',
                            paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4,
                          }}>
                            <Text style={{
                              fontSize: 10, fontWeight: '700',
                              color: rec.score >= 80 ? '#00FF88' : '#00D4FF',
                            }}>
                              AI {rec.score}%
                            </Text>
                          </View>
                          {rec.reasons[0] && (
                            <Text style={{ fontSize: 9, color: '#8892B0' }} numberOfLines={1}>{rec.reasons[0]}</Text>
                          )}
                        </View>
                      );
                    })()}
                  </View>

                  {/* Photo thumbnail */}
                  {(() => {
                    const photoData = stationPhotos.get(station.id);
                    if (!photoData?.firstPhotoUrl) return null;
                    return (
                      <View style={{ position: 'relative', marginLeft: 8, flexShrink: 0 }}>
                        <img
                          src={photoData.firstPhotoUrl}
                          style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }}
                        />
                        {photoData.count > 1 && (
                          <View style={{
                            position: 'absolute', bottom: -3, right: -3,
                            backgroundColor: colors.surface, borderRadius: 8,
                            paddingHorizontal: 4, paddingVertical: 1,
                            borderWidth: 1, borderColor: colors.border,
                          }}>
                            <Text style={{ fontSize: 7, color: colors.textSecondary, fontWeight: '600' }}>
                              {'\uD83D\uDCF7'} {photoData.count}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })()}

                  {/* Distance + Navigate */}
                  <View style={{ alignItems: 'flex-end', gap: 6, marginLeft: 8 }}>
                    {station.distance_km != null && (
                      <Text style={styles.distanceText}>
                        {station.distance_km < 1
                          ? `${Math.round(station.distance_km * 1000)} m`
                          : `${station.distance_km.toFixed(1)} km`}
                      </Text>
                    )}
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}&travelmode=driving`;
                        if (typeof window !== 'undefined') window.open(url, '_blank');
                      }}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 6,
                        backgroundColor: colors.primaryLight,
                        borderWidth: 1,
                        borderColor: colors.primary,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.primary }}>{'\uD83D\uDCCD'} Navigate</Text>
                    </TouchableOpacity>
                    {station.distance_km != null && station.distance_km <= 0.1 && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          Alert.alert(
                            `Report: ${station.name}`,
                            'What\'s the current status?',
                            [
                              { text: '\u2705 Available', onPress: () => stationReportService.submitReport({ stationId: station.id, userId: undefined, status: 'available' }).then(() => Alert.alert('Thanks! \u26A1')) },
                              { text: '\uD83D\uDFE1 Some Free', onPress: () => stationReportService.submitReport({ stationId: station.id, userId: undefined, status: 'partially_available' }).then(() => Alert.alert('Thanks! \u26A1')) },
                              { text: '\uD83D\uDD34 All Busy', onPress: () => stationReportService.submitReport({ stationId: station.id, userId: undefined, status: 'busy' }).then(() => Alert.alert('Thanks! \u26A1')) },
                              { text: '\u26A0\uFE0F Broken', style: 'destructive', onPress: () => stationReportService.submitReport({ stationId: station.id, userId: undefined, status: 'out_of_service' }).then(() => Alert.alert('Thanks! \u26A1')) },
                              { text: '\uD83D\uDE97 ICE\'d', onPress: () => stationReportService.submitReport({ stationId: station.id, userId: undefined, status: 'iced' }).then(() => Alert.alert('Thanks! \u26A1')) },
                              { text: 'Cancel', style: 'cancel' },
                            ]
                          );
                        }}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 6,
                          backgroundColor: colors.secondary + '15',
                          borderWidth: 1,
                          borderColor: colors.secondary,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '600', color: colors.secondary }}>{'\uD83D\uDCE1'} Report</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          {/* Bottom spacer */}
          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </View>

      {/* ---- Map fills remaining space ---- */}
      <View style={styles.mapContainer}>
        <WebMap
          stations={filteredStations}
          homeChargers={showHomeChargers ? homeChargers : []}
          onStationPress={handleStationPress}
          userLocation={userLocation}
        />
        {/* Proximity detection popup */}
        <ProximityReporter stations={displayStations} userLocation={userLocation} />
      </View>

      {/* Filter modal */}
      <FilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={setFilters}
        initialFilter={filters}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const PANEL_WIDTH = 340;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },

  // -- Station panel (left) --
  panel: {
    width: PANEL_WIDTH,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  searchSection: {
    padding: spacing.md,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    // @ts-ignore web outline
    outlineStyle: 'none',
  },
  filterButton: {
    marginLeft: 4,
    padding: 4,
  },
  filterIcon: {
    fontSize: 16,
  },

  // Chips
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Count
  countRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  countText: {
    ...typography.caption,
    color: colors.textTertiary,
  },

  // Station list
  stationList: {
    flex: 1,
  },
  stationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
    flexShrink: 0,
  },
  stationInfo: {
    flex: 1,
    minWidth: 0,
  },
  stationName: {
    ...typography.bodyBold,
    color: colors.text,
    fontSize: 14,
  },
  stationAddress: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  powerBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  powerText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
  connectorBadge: {
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  connectorText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  providerText: {
    fontSize: 10,
    color: colors.textTertiary,
  },
  distanceText: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 13,
    color: colors.primary,
    marginLeft: 8,
    flexShrink: 0,
  },

  // Empty state
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // -- Map (right) --
  mapContainer: {
    flex: 1,
  },
});
