import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import { useStationDetail } from '@/core/queries/useStationDetail';
import { Header, Card, Button, LoadingScreen } from '@/core/components';
import { ConnectorRow } from '../components/ConnectorRow';
import { AmenityBadge } from '../components/AmenityBadge';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

export function StationDetailScreen({ route, navigation }: any) {
  const { stationId } = route.params;
  const { data: station, isLoading } = useStationDetail(stationId);

  if (isLoading || !station) return <LoadingScreen message="Loading station..." />;

  const openNavigation = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${station.latitude},${station.longitude}`,
      android: `geo:0,0?q=${station.latitude},${station.longitude}(${station.name})`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <Header title={station.name} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.infoCard}>
          <Text style={styles.providerName}>{station.provider?.name}</Text>
          <Text style={styles.address}>{station.address}</Text>
          <View style={styles.statsRow}>
            <Text style={styles.stat}>
              {station.rating_avg?.toFixed(1)} ★ ({station.review_count} reviews)
            </Text>
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>AI Prediction</Text>
          <Text style={styles.prediction}>Usually free at this time</Text>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Connectors</Text>
          {station.connectors?.map((c) => (
            <ConnectorRow key={c.id} connector={c} />
          ))}
        </Card>

        {station.amenities.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenityRow}>
              {station.amenities.map((a) => (
                <AmenityBadge key={a} amenity={a} />
              ))}
            </View>
          </Card>
        )}

        <View style={styles.actions}>
          <Button
            title="Book Now"
            onPress={() => navigation.navigate('Booking', { stationId: station.id })}
            size="lg"
          />
          <Button
            title="Navigate"
            onPress={openNavigation}
            variant="outline"
            size="lg"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  infoCard: { marginBottom: spacing.md },
  providerName: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  address: { ...typography.body, color: colors.textSecondary },
  statsRow: { flexDirection: 'row', marginTop: spacing.sm },
  stat: { ...typography.caption, color: colors.textSecondary },
  section: { marginBottom: spacing.md },
  sectionTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.sm },
  prediction: { ...typography.body, color: colors.accent, fontStyle: 'italic' },
  amenityRow: { flexDirection: 'row', flexWrap: 'wrap' },
  actions: { gap: spacing.sm, marginTop: spacing.md },
});
