import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useStations } from '@/core/queries/useStations';
import { useMapStore } from '@/core/stores/mapStore';
import { locationService } from '@/core/services/locationService';
import { StationMarker } from '../components/StationMarker';
import { StationBottomSheet } from '../components/StationBottomSheet';
import { SearchBar } from '../components/SearchBar';
import { FilterModal } from '../components/FilterModal';
import { LoadingScreen } from '@/core/components';
import { DEFAULT_MAP_REGION } from '@/core/config/constants';
import type { Station } from '@/core/types/station';

export function MapScreen({ navigation }: any) {
  const { region, searchQuery, filters, setRegion, setSearchQuery, setFilters } = useMapStore();
  const [showFilter, setShowFilter] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );

  // Get user location on mount
  useEffect(() => {
    (async () => {
      const granted = await locationService.requestPermission();
      if (granted) {
        const loc = await locationService.getCurrentLocation();
        setUserLocation(loc);
        setRegion({ ...DEFAULT_MAP_REGION, latitude: loc.latitude, longitude: loc.longitude });
      }
    })();
  }, []);

  // Pass user location to the station query for OCM proximity search
  const { data: stations, isLoading } = useStations(filters, userLocation);

  // Stations already come sorted by distance from the service when location is provided
  const displayStations = (stations || []).map((s) => {
    if (s.distance_km != null) return s;
    return {
      ...s,
      distance_km: locationService.getDistanceKm(
        { latitude: region.latitude, longitude: region.longitude },
        { latitude: s.latitude, longitude: s.longitude }
      ),
    };
  });

  const handleStationPress = useCallback(
    (station: Station) => {
      navigation.navigate('StationDetail', { stationId: station.id });
    },
    [navigation]
  );

  if (isLoading) return <LoadingScreen message="Loading real station data..." />;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {displayStations.map((station) => (
          <Marker
            key={station.id}
            coordinate={{ latitude: station.latitude, longitude: station.longitude }}
            onPress={() => handleStationPress(station)}
          >
            <StationMarker
              status={station.status || 'offline'}
              providerSlug={station.provider?.slug || ''}
            />
          </Marker>
        ))}
      </MapView>
      <View style={styles.searchOverlay}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFilterPress={() => setShowFilter(true)}
        />
      </View>
      <View style={styles.bottomSheet}>
        <StationBottomSheet
          stations={displayStations.slice(0, 20)}
          onStationPress={handleStationPress}
        />
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  searchOverlay: { position: 'absolute', top: 60, left: 0, right: 0, zIndex: 10 },
  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0 },
});
