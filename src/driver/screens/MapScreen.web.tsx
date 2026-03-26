import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useStations } from '@/core/queries/useStations';
import { useMapStore } from '@/core/stores/mapStore';
import { WebMap } from '../components/WebMap';
import { StationListItem } from '../components/StationListItem';
import { SearchBar } from '../components/SearchBar';
import { FilterModal } from '../components/FilterModal';
import { LoadingScreen } from '@/core/components';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import type { Station } from '@/core/types/station';

// Get user location — returns null while loading, then the location or a fallback
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
      () => setResolved(true), // denied or error — proceed without location
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    );
  }, []);
  return { location, resolved };
}

export function MapScreen({ navigation }: any) {
  const { searchQuery, filters, setSearchQuery, setFilters } = useMapStore();
  const [showFilter, setShowFilter] = useState(false);
  const [listExpanded, setListExpanded] = useState(false);
  const { location: userLocation, resolved: gpsResolved } = useWebLocation();

  // Pass user location to the query so results are proximity-sorted
  const { data: stations, isLoading, error } = useStations(filters, userLocation);

  const handleStationPress = useCallback(
    (station: Station) => {
      navigation.navigate('StationDetail', { stationId: station.id });
    },
    [navigation]
  );

  // Filter stations by search query locally
  const filteredStations = (stations || []).filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.address ?? '').toLowerCase().includes(q) ||
      (s.area ?? '').toLowerCase().includes(q) ||
      (s.provider?.name ?? '').toLowerCase().includes(q)
    );
  });

  // Wait for GPS before rendering the map so it centers on the user
  if (!gpsResolved || isLoading) return <LoadingScreen message="Finding your location..." />;

  const listData = filteredStations.slice(0, listExpanded ? 40 : 8);

  // Build the panel title based on context
  const panelTitle = buildPanelTitle(filteredStations, searchQuery, userLocation);

  return (
    <View style={styles.container}>
      {/* Search bar overlay */}
      <View style={styles.searchOverlay}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFilterPress={() => setShowFilter(true)}
        />
      </View>

      {/* Leaflet map takes the top portion */}
      <View style={styles.mapContainer}>
        <WebMap
          stations={filteredStations}
          onStationPress={handleStationPress}
          userLocation={userLocation}
        />
      </View>

      {/* Station list panel at the bottom */}
      <View style={[styles.listPanel, listExpanded && styles.listPanelExpanded]}>
        <TouchableOpacity
          style={styles.panelHandle}
          onPress={() => setListExpanded((v) => !v)}
          activeOpacity={0.7}
        >
          <View style={styles.handle} />
          <Text style={styles.panelTitle}>{panelTitle}</Text>
          <Text style={styles.expandHint}>{listExpanded ? 'Show less' : 'Show more'}</Text>
        </TouchableOpacity>

        {filteredStations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No stations found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? `No results for "${searchQuery}". Try a different search.`
                : 'No EV charging stations found within 200 km. More stations are being added to Egypt regularly.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={listData}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <StationListItem station={item} onPress={() => handleStationPress(item)} />
            )}
            contentContainerStyle={{ paddingBottom: spacing.xl }}
            showsVerticalScrollIndicator={false}
            scrollEnabled={listExpanded}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>

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
// Helpers
// ---------------------------------------------------------------------------

function buildPanelTitle(
  stations: Station[],
  searchQuery: string,
  userLocation: { latitude: number; longitude: number } | null
): string {
  const count = stations.length;
  const noun = count === 1 ? 'station' : 'stations';

  if (searchQuery) {
    return `${count} ${noun} for "${searchQuery}"`;
  }

  if (count === 0) {
    return 'No stations nearby';
  }

  // If we have distances, describe proximity
  const nearest = stations[0];
  if (nearest?.distance_km != null && userLocation) {
    if (nearest.distance_km < 50) {
      return `${count} ${noun} near you`;
    }
    return `${count} ${noun} in Egypt (nearest ${Math.round(nearest.distance_km)} km away)`;
  }

  return `${count} ${noun} in Egypt`;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const LIST_PANEL_DEFAULT = 280;
const LIST_PANEL_EXPANDED = 520;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchOverlay: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: spacing.md,
  },
  mapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // map fills the screen minus the collapsed list panel
    bottom: LIST_PANEL_DEFAULT,
  },
  listPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: LIST_PANEL_DEFAULT,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden' as any,
  },
  listPanelExpanded: {
    height: LIST_PANEL_EXPANDED,
  },
  panelHandle: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginRight: spacing.sm,
  },
  panelTitle: {
    ...typography.bodyBold,
    color: colors.text,
    flex: 1,
  },
  expandHint: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
});
