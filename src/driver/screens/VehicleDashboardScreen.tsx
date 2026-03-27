import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/core/theme';
import { typography } from '@/core/theme/typography';

export function VehicleDashboardScreen({ navigation }: any) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ ...typography.h1, color: colors.primary }}>Vehicle Dashboard</Text>
      <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: 8 }}>Loading...</Text>
    </View>
  );
}
