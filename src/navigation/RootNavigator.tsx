import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useTheme } from '@/core/theme';
import { useAuthStore } from '@/core/stores/authStore';
import { LoadingScreen } from '@/core/components';
import { AuthNavigator } from './AuthNavigator';
import { DriverNavigator } from './DriverNavigator';
import { FleetNavigator } from './FleetNavigator';

export function RootNavigator() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const { colors, isDark } = useTheme();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  };

  if (isLoading) {
    return <LoadingScreen message="Starting EV Charge Egypt..." />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      {!isAuthenticated ? (
        <AuthNavigator />
      ) : user?.role === 'fleet_manager' ? (
        <FleetNavigator />
      ) : (
        <DriverNavigator />
      )}
    </NavigationContainer>
  );
}
