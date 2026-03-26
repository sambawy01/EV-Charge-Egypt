import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useStations } from '@/core/queries/useStations';
import { useMapStore } from '@/core/stores/mapStore';
import { StationListItem } from '../components/StationListItem';
import { SearchBar } from '../components/SearchBar';
import { FilterModal } from '../components/FilterModal';
import { LoadingScreen } from '@/core/components';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import type { Station } from '@/core/types/station';

export function MapScreen({ navigation }: any) {
  const { searchQuery, filters, setSearchQuery, setFilters } = useMapStore();
  const [showFilter, setShowFilter] = useState(false);
  const { data: stations, isLoading } = useStations(filters);

  const handleStationPress = (station: Station) => {
    navigation.navigate('StationDetail', { stationId: station.id });
  };

  if (isLoading) return <LoadingScreen message="Loading stations..." />;

  return (
    <View style={styles.container}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onFilterPress={() => setShowFilter(true)}
      />
      <Text style={styles.webNote}>Map view available on mobile. Showing list view.</Text>
      <FlatList
        data={stations || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StationListItem station={item} onPress={() => handleStationPress(item)} />
        )}
        contentContainerStyle={{ paddingVertical: spacing.md }}
      />
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
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 60 },
  webNote: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    padding: spacing.sm,
  },
});
