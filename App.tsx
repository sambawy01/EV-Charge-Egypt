import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/core/queries/queryClient';
import { AuthProvider } from '@/core/auth/AuthProvider';
import { RootNavigator } from '@/navigation/RootNavigator';
import { colors } from '@/core/theme/colors';

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
          <RootNavigator />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
