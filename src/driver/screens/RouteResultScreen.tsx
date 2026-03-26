import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Header, Card, Button } from '@/core/components';
import { useAIStore } from '@/core/stores/aiStore';
import { formatEGP, formatKWh } from '@/core/utils/formatCurrency';
import { colors } from '@/core/theme/colors';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

export function RouteResultScreen({ navigation }: any) {
  const route = useAIStore((s) => s.lastRoute);

  if (!route) {
    return (
      <View style={styles.container}>
        <Header title="Route" onBack={() => navigation.goBack()} />
        <Text style={styles.empty}>No route planned yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Trip Plan" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summary}>{route.summary}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{route.totalDistanceKm} km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {Math.floor(route.totalTimeMin / 60)}h {route.totalTimeMin % 60}m
              </Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatEGP(route.totalChargeCost)}</Text>
              <Text style={styles.statLabel}>Charge Cost</Text>
            </View>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Charging Stops</Text>
        {route.stops.map((stop, i) => (
          <Card key={i} style={styles.stopCard}>
            <View style={styles.stopHeader}>
              <View style={styles.stopNumber}>
                <Text style={styles.stopNumberText}>{i + 1}</Text>
              </View>
              <View style={styles.stopInfo}>
                <Text style={styles.stopName}>{stop.stationName}</Text>
                <Text style={styles.stopAddress}>{stop.address}</Text>
              </View>
            </View>
            <View style={styles.stopDetails}>
              <Text style={styles.detail}>Arrive: {stop.estimatedArrival}</Text>
              <Text style={styles.detail}>
                Charge: {stop.chargeTimeMin} min · {formatKWh(stop.estimatedKwh)}
              </Text>
              <Text style={styles.detail}>Cost: {formatEGP(stop.estimatedCost)}</Text>
            </View>
            <Button
              title="Book This Stop"
              onPress={() => navigation.navigate('Booking', { stationId: stop.stationId })}
              variant="outline"
              size="sm"
            />
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  empty: {
    ...(typography.body as object),
    color: colors.textTertiary,
    textAlign: 'center',
    padding: spacing.xl,
  },
  summaryCard: { backgroundColor: colors.primaryLight, marginBottom: spacing.lg },
  summary: { ...(typography.body as object), color: colors.primaryDark, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { ...(typography.bodyBold as object), color: colors.primaryDark },
  statLabel: { ...(typography.small as object), color: colors.accent },
  sectionTitle: { ...(typography.h3 as object), color: colors.text, marginBottom: spacing.md },
  stopCard: { marginBottom: spacing.md },
  stopHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  stopNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  stopNumberText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  stopInfo: { flex: 1 },
  stopName: { ...(typography.bodyBold as object), color: colors.text },
  stopAddress: { ...(typography.caption as object), color: colors.textSecondary },
  stopDetails: { marginBottom: spacing.sm },
  detail: { ...(typography.caption as object), color: colors.textSecondary, marginBottom: 2 },
});
