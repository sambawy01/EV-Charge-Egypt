import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '@/core/stores/authStore';
import { LoadingScreen } from '@/core/components';
import { AuthNavigator } from './AuthNavigator';
import { DriverNavigator } from './DriverNavigator';
import { FleetNavigator } from './FleetNavigator';

export function RootNavigator() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen message="Starting EV Charge Egypt..." />;
  }

  return (
    <NavigationContainer>
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
