import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { StationListItem } from './StationListItem';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import type { Station } from '@/core/types/station';
import type { ReliabilityScore } from '@/core/services/reliabilityScoreService';

interface Props {
  stations: Station[];
  onStationPress: (station: Station) => void;
  reliabilityScores?: Map<string, ReliabilityScore>;
  stationPhotos?: Map<string, { count: number; firstPhotoUrl: string | null }>;
}

export function StationBottomSheet({ stations, onStationPress, reliabilityScores, stationPhotos }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <Text style={styles.title}>{stations.length} stations nearby</Text>
      <FlatList
        data={stations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const photoData = stationPhotos?.get(item.id);
          return (
            <StationListItem
              station={item}
              onPress={() => onStationPress(item)}
              reliabilityScore={reliabilityScores?.get(item.id)}
              photoUrl={photoData?.firstPhotoUrl ?? undefined}
              photoCount={photoData?.count}
            />
          );
        }}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.sm,
    maxHeight: 400,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.bodyBold,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
});
