import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { StationListItem } from './StationListItem';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import type { Station } from '@/core/types/station';

interface Props {
  stations: Station[];
  onStationPress: (station: Station) => void;
}

export function StationBottomSheet({ stations, onStationPress }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <Text style={styles.title}>{stations.length} stations nearby</Text>
      <FlatList
        data={stations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StationListItem station={item} onPress={() => onStationPress(item)} />
        )}
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
