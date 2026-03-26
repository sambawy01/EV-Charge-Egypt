import React from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { Header, LoadingScreen } from '@/core/components';
import { StationListItem } from '../components/StationListItem';
import { useFavorites } from '@/core/queries/useFavorites';
import { useStations } from '@/core/queries/useStations';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

export function FavoritesScreen({ navigation }: any) {
  const { data: favoriteIds } = useFavorites();
  const { data: allStations, isLoading } = useStations();

  const favorites = allStations?.filter((s) => favoriteIds?.includes(s.id)) || [];

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Header title="Favorite Stations" onBack={() => navigation.goBack()} />
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StationListItem
            station={item}
            onPress={() =>
              navigation.navigate('StationDetail', { stationId: item.id })
            }
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No favorite stations yet. Tap the heart on any station to save it!
          </Text>
        }
        contentContainerStyle={styles.content}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingVertical: spacing.md },
  empty: {
    ...(typography.body as object),
    color: colors.textTertiary,
    textAlign: 'center',
    padding: spacing.xl,
  },
});
