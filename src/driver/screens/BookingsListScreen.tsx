import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Header, LoadingScreen } from '@/core/components';
import { BookingCard } from '../components/BookingCard';
import { useBookings } from '@/core/queries/useBookings';
import { colors } from '@/core/theme/colors';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

const TABS: { key: string | undefined; label: string }[] = [
  { key: undefined, label: 'All' },
  { key: 'confirmed', label: 'Upcoming' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Past' },
];

export function BookingsListScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
  const { data: bookings, isLoading } = useBookings(activeTab);

  return (
    <View style={styles.container}>
      <Header title="My Bookings" />
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.label}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <FlatList
          data={bookings || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onPress={() =>
                navigation.navigate('BookingDetail', { bookingId: item.id })
              }
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No bookings yet. Find a station and charge!
            </Text>
          }
          contentContainerStyle={{ paddingVertical: spacing.md }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: { ...typography.caption, color: colors.textSecondary },
  tabTextActive: { color: colors.white, fontWeight: '600' },
  empty: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
    padding: spacing.xl,
  },
});
