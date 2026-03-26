import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Header, Button, Card } from '@/core/components';
import { ChargingProgress } from '../components/ChargingProgress';
import { useRealtimeSession } from '@/core/queries/useChargingSession';
import { chargingService } from '@/core/services/chargingService';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

export function ChargingSessionScreen({ route, navigation }: any) {
  const { sessionId, connectorPowerKw, pricePerKwh } = route.params;
  const realtimeSession = useRealtimeSession(sessionId);
  const [localKwh, setLocalKwh] = useState(0);
  const [localCost, setLocalCost] = useState(0);
  const [startTime] = useState(Date.now());
  const [isStopping, setIsStopping] = useState(false);

  // Simulate charging progress locally (in real app, comes from provider via Edge Function)
  useEffect(() => {
    const interval = setInterval(() => {
      setLocalKwh((prev) => {
        const newKwh = prev + (connectorPowerKw / 3600) * 5; // 5 second intervals
        setLocalCost(newKwh * pricePerKwh + 10);
        return newKwh;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [connectorPowerKw, pricePerKwh]);

  // Update from realtime if available
  useEffect(() => {
    if (realtimeSession) {
      setLocalKwh(realtimeSession.kwh_delivered);
      setLocalCost(realtimeSession.cost_total);
    }
  }, [realtimeSession]);

  const handleStop = useCallback(async () => {
    Alert.alert('Stop Charging', 'Are you sure you want to stop?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Stop',
        style: 'destructive',
        onPress: async () => {
          setIsStopping(true);
          try {
            await chargingService.stopSession(
              sessionId,
              localKwh,
              pricePerKwh,
              false,
            );
            navigation.replace('BookingsTab');
          } catch (e: any) {
            Alert.alert('Error', e.message);
            setIsStopping(false);
          }
        },
      },
    ]);
  }, [sessionId, localKwh, pricePerKwh, navigation]);

  const elapsed = Math.round((Date.now() - startTime) / 60000);
  const targetKwh = 50;
  const remaining = Math.max(
    0,
    Math.round(((targetKwh - localKwh) / (connectorPowerKw || 1)) * 60),
  );

  return (
    <View style={styles.container}>
      <Header title="Charging" />
      <View style={styles.body}>
        <ChargingProgress
          kwhDelivered={localKwh}
          costTotal={localCost}
          targetKwh={targetKwh}
          elapsedMinutes={elapsed}
          estimatedMinutesRemaining={remaining}
        />

        <Card style={styles.whileYouWait}>
          <Text style={styles.waitTitle}>While you wait</Text>
          <Text style={styles.waitText}>
            Explore nearby amenities and offers
          </Text>
        </Card>
      </View>
      <View style={styles.footer}>
        <Button
          title="Stop Charging"
          onPress={handleStop}
          variant="outline"
          size="lg"
          loading={isStopping}
          style={{ borderColor: colors.error }}
          textStyle={{ color: colors.error }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1, padding: spacing.md },
  whileYouWait: { marginTop: spacing.lg },
  waitTitle: { ...typography.bodyBold, color: colors.text },
  waitText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
