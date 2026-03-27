import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useStations } from '@/core/queries/useStations';
import { useMapStore } from '@/core/stores/mapStore';
import { WebMap } from '../components/WebMap';
import { FilterModal } from '../components/FilterModal';
import { LoadingScreen } from '@/core/components';
import { colors } from '@/core/theme/colors';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import type { Station } from '@/core/types/station';
import { aiContextService } from '@/core/services/aiContextService';
import { useVehicles } from '@/core/queries/useVehicles';

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
  const { location: userLocation, resolved: gpsResolved } = useWebLocation();

  const { data: stations, isLoading } = useStations(filters, userLocation);
  const { data: vehicles } = useVehicles();

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

  if (!gpsResolved || isLoading) return <LoadingScreen message="Finding your location..." />;

  const panelTitle = buildPanelTitle(filteredStations, searchQuery, userLocation);

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
                    <Text style={styles.stationName} numberOfLines={1}>
                      {station.name}
                    </Text>
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
                      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.primary }}>📍 Navigate</Text>
                    </TouchableOpacity>
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
          onStationPress={handleStationPress}
          userLocation={userLocation}
        />
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
