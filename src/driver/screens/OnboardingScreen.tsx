import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@/core/components';
import { locationService } from '@/core/services/locationService';
import { notificationService } from '@/core/services/notificationService';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

const STEPS = [
  {
    title: 'Add Your Vehicle',
    description:
      'Tell us what you drive so we can find the right chargers for you.',
    icon: '🚗',
    action: 'Add Vehicle',
  },
  {
    title: 'Enable Location',
    description: 'Find charging stations near you and get directions.',
    icon: '📍',
    action: 'Enable Location',
  },
  {
    title: 'Stay Notified',
    description: 'Get alerts when your charger is ready or your session ends.',
    icon: '🔔',
    action: 'Enable Notifications',
  },
];

export function OnboardingScreen({ navigation }: any) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleAction = async () => {
    if (currentStep === 0) {
      navigation.navigate('AddVehicle');
      setCurrentStep(1);
    } else if (currentStep === 1) {
      await locationService.requestPermission();
      setCurrentStep(2);
    } else if (currentStep === 2) {
      await notificationService.requestPermission();
      navigation.replace('DriverTabs');
    }
  };

  const step = STEPS[currentStep];

  return (
    <View style={styles.container}>
      <View style={styles.progress}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i <= currentStep && styles.dotActive]} />
        ))}
      </View>
      <View style={styles.content}>
        <Text style={styles.icon}>{step.icon}</Text>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>
      </View>
      <View style={styles.actions}>
        <Button title={step.action} onPress={handleAction} size="lg" />
        <Button
          title="Skip"
          onPress={() => navigation.replace('DriverTabs')}
          variant="ghost"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xl,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 24 },
  content: { alignItems: 'center' },
  icon: { fontSize: 64, marginBottom: spacing.lg },
  title: { ...(typography.h2 as object), color: colors.text, textAlign: 'center' },
  description: {
    ...(typography.body as object),
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    maxWidth: 300,
  },
  actions: { gap: spacing.sm },
});
