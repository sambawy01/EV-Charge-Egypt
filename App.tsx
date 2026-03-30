import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar, View, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';
import { queryClient } from '@/core/queries/queryClient';
import { AuthProvider } from '@/core/auth/AuthProvider';
import { ThemeProvider, useTheme } from '@/core/theme';
import { RootNavigator } from '@/navigation/RootNavigator';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { colors, isDark } = useTheme();
  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <RootNavigator />
    </>
  );
}

function LocationGate({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const [locationStatus, setLocationStatus] = useState<'pending' | 'granted' | 'denied'>('pending');

  useEffect(() => {
    if (Platform.OS !== 'web' || !navigator?.geolocation) {
      // On native, expo-location handles permissions differently
      setLocationStatus('granted');
      return;
    }

    // Check if permission already granted
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          setLocationStatus('granted');
        } else if (result.state === 'denied') {
          setLocationStatus('denied');
        } else {
          // prompt — request it
          requestLocation();
        }
        result.onchange = () => {
          if (result.state === 'granted') setLocationStatus('granted');
          else if (result.state === 'denied') setLocationStatus('denied');
        };
      }).catch(() => {
        // permissions API not supported — try requesting directly
        requestLocation();
      });
    } else {
      requestLocation();
    }
  }, []);

  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      () => setLocationStatus('granted'),
      () => setLocationStatus('denied'),
      { timeout: 15000, enableHighAccuracy: true }
    );
  };

  if (locationStatus === 'pending') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0E1A', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>📍</Text>
        <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 24, color: '#00D4FF', textAlign: 'center', marginBottom: 12 }}>
          Location Access Required
        </Text>
        <Text style={{ fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 15, color: '#8892B0', textAlign: 'center', lineHeight: 22, maxWidth: 350 }}>
          WattsOn needs your location to find nearby charging stations, provide accurate distances, and enable community status reporting.
        </Text>
        <Text style={{ fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 13, color: '#5A6482', textAlign: 'center', marginTop: 16 }}>
          Waiting for location permission...
        </Text>
      </View>
    );
  }

  if (locationStatus === 'denied') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0E1A', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Text style={{ fontSize: 48, marginBottom: 20 }}>📍</Text>
        <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 24, color: '#00D4FF', textAlign: 'center', marginBottom: 12 }}>
          Location Required
        </Text>
        <Text style={{ fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 15, color: '#8892B0', textAlign: 'center', lineHeight: 22, maxWidth: 380, marginBottom: 8 }}>
          WattsOn requires location access to work. We use your location to:
        </Text>
        <View style={{ alignSelf: 'stretch', maxWidth: 380, gap: 8, marginVertical: 16 }}>
          {[
            { icon: '🗺️', text: 'Find charging stations near you' },
            { icon: '📏', text: 'Show accurate distances to stations' },
            { icon: '📡', text: 'Enable proximity-based status reporting' },
            { icon: '🛣️', text: 'Plan routes with charging stops' },
          ].map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#141B2D', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#2A3350' }}>
              <Text style={{ fontSize: 18 }}>{item.icon}</Text>
              <Text style={{ fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 14, color: '#F0F4FF' }}>{item.text}</Text>
            </View>
          ))}
        </View>
        <Text style={{ fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 12, color: '#5A6482', textAlign: 'center', marginBottom: 20 }}>
          Your location is never stored or shared with third parties.
        </Text>
        <TouchableOpacity
          onPress={requestLocation}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#00D4FF', '#0095CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 14, paddingVertical: 16, paddingHorizontal: 40, alignItems: 'center' }}
          >
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 16, color: '#000000' }}>
              Enable Location Access
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={{ fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 11, color: '#5A6482', textAlign: 'center', marginTop: 12, maxWidth: 320 }}>
          If the button doesn't work, enable location in your browser settings and refresh the page.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'SpaceGrotesk-SemiBold': require('./assets/fonts/SpaceGrotesk-SemiBold.ttf'),
    'SpaceGrotesk-Bold': require('./assets/fonts/SpaceGrotesk-Bold.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
              <LocationGate>
                <AppContent />
              </LocationGate>
            </View>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
