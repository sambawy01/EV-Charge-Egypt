import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/core/theme';

// Existing screens
import { MapScreen } from '@/driver/screens/MapScreen';
import { StationDetailScreen } from '@/driver/screens/StationDetailScreen';
import { BookingScreen } from '@/driver/screens/BookingScreen';
import { ChargingSessionScreen } from '@/driver/screens/ChargingSessionScreen';
import { BookingsListScreen } from '@/driver/screens/BookingsListScreen';
import { BookingDetailScreen } from '@/driver/screens/BookingDetailScreen';
import { WalletScreen } from '@/driver/screens/WalletScreen';
import { TopUpScreen } from '@/driver/screens/TopUpScreen';
import { TransactionHistoryScreen } from '@/driver/screens/TransactionHistoryScreen';

// Plan 5: AI Layer screens
import { AIAssistantScreen } from '@/driver/screens/AIAssistantScreen';
import { RouteResultScreen } from '@/driver/screens/RouteResultScreen';
import { CostReportScreen } from '@/driver/screens/CostReportScreen';

// Plan 6: Driver Profile screens
import { ProfileScreen } from '@/driver/screens/ProfileScreen';
import { VehicleScreen } from '@/driver/screens/VehicleScreen';
import { AddVehicleScreen } from '@/driver/screens/AddVehicleScreen';
import { FavoritesScreen } from '@/driver/screens/FavoritesScreen';
import { SettingsScreen } from '@/driver/screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const MapStack = createNativeStackNavigator();
const BookingsStack = createNativeStackNavigator();
const WalletStack = createNativeStackNavigator();
const AIStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function MapTabStack() {
  return (
    <MapStack.Navigator screenOptions={{ headerShown: false }}>
      <MapStack.Screen name="Map" component={MapScreen} />
      <MapStack.Screen name="StationDetail" component={StationDetailScreen} />
      <MapStack.Screen name="Booking" component={BookingScreen} />
      <MapStack.Screen name="ChargingSession" component={ChargingSessionScreen} />
      <MapStack.Screen name="BookingDetail" component={BookingDetailScreen} />
    </MapStack.Navigator>
  );
}

function BookingsTabStack() {
  return (
    <BookingsStack.Navigator screenOptions={{ headerShown: false }}>
      <BookingsStack.Screen name="BookingsList" component={BookingsListScreen} />
      <BookingsStack.Screen name="BookingDetail" component={BookingDetailScreen} />
      <BookingsStack.Screen name="ChargingSession" component={ChargingSessionScreen} />
      <BookingsStack.Screen name="BookingsTab" component={BookingsListScreen} />
    </BookingsStack.Navigator>
  );
}

function WalletTabStack() {
  return (
    <WalletStack.Navigator screenOptions={{ headerShown: false }}>
      <WalletStack.Screen name="Wallet" component={WalletScreen} />
      <WalletStack.Screen name="TopUp" component={TopUpScreen} />
      <WalletStack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
    </WalletStack.Navigator>
  );
}

function AITabStack() {
  return (
    <AIStack.Navigator screenOptions={{ headerShown: false }}>
      <AIStack.Screen name="AIAssistant" component={AIAssistantScreen} />
      <AIStack.Screen name="RouteResult" component={RouteResultScreen} />
      <AIStack.Screen name="CostReport" component={CostReportScreen} />
    </AIStack.Navigator>
  );
}

function ProfileTabStack() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="Vehicle" component={VehicleScreen} />
      <ProfileStack.Screen name="AddVehicle" component={AddVehicleScreen} />
      <ProfileStack.Screen name="Favorites" component={FavoritesScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
    </ProfileStack.Navigator>
  );
}

function GlowTab({ icon, label, isFocused, onPress, colors }: {
  icon: string; label: string; isFocused: boolean; onPress: () => void; colors: any;
}) {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFocused) {
      const loop = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      );
      loop.start();
      return () => loop.stop();
    } else {
      spinAnim.setValue(0);
    }
  }, [isFocused]);

  // Animated glow position for the active tab — shifts shadow offset in a circle
  const glowX = spinAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, 6, 0, -6, 0],
  });
  const glowY = spinAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [-6, 0, 6, 0, -6],
  });
  // Pulsing glow intensity
  const glowOpacity = spinAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0.4, 0.7, 0.4, 0.7, 0.4],
  });
  const glowRadius = spinAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [10, 16, 10, 16, 10],
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
        backgroundColor: isFocused ? colors.surfaceTertiary : colors.surfaceSecondary,
        borderWidth: 1.5,
        borderColor: isFocused ? colors.primary : colors.secondary,
        borderBottomWidth: isFocused ? 3 : 2,
        borderBottomColor: isFocused ? colors.primaryDark : colors.secondaryDark,
        // Active: animated spinning blue glow | Inactive: static green glow
        shadowColor: isFocused ? colors.primary : colors.secondary,
        shadowOffset: isFocused
          ? { width: glowX as any, height: glowY as any }
          : { width: 0, height: 0 },
        shadowOpacity: isFocused ? (glowOpacity as any) : 0.35,
        shadowRadius: isFocused ? (glowRadius as any) : 10,
        elevation: isFocused ? 10 : 5,
      }}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
        <Text style={{
          fontFamily: isFocused ? 'SpaceGrotesk-SemiBold' : undefined,
          fontSize: 14,
          color: isFocused ? colors.primary : colors.white,
          fontWeight: isFocused ? '600' : '400',
        }}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function InlineTabs({ state, descriptors, navigation }: any) {
  const { colors } = useTheme();

  const tabs = [
    { name: 'MapTab', icon: '\u{1F4CD}', label: 'Map' },
    { name: 'BookingsTab', icon: '\u{1F4CB}', label: 'Bookings' },
    { name: 'AITab', icon: '\u{1F916}', label: 'AI' },
    { name: 'WalletTab', icon: '\u{1F4B3}', label: 'Wallet' },
    { name: 'ProfileTab', icon: '\u{1F464}', label: 'Profile' },
  ];

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 8,
    }}>
      {/* Brand */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
        <Text style={{ fontSize: 26 }}>{'\u26A1'}</Text>
        <Text style={{
          fontFamily: 'SpaceGrotesk-Bold',
          fontSize: 18,
          color: colors.primary,
          marginLeft: 8,
        }}>EV Charge</Text>
      </View>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Nav tabs — all with cyan borders, active has spinning glow */}
      {tabs.map((tab) => {
        const routeIndex = state.routes.findIndex((r: any) => r.name === tab.name);
        const isFocused = state.index === routeIndex;
        return (
          <GlowTab
            key={tab.name}
            icon={tab.icon}
            label={tab.label}
            isFocused={isFocused}
            colors={colors}
            onPress={() => {
              if (!isFocused) navigation.navigate(tab.name);
            }}
          />
        );
      })}
    </View>
  );
}

export function DriverNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <InlineTabs {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="MapTab" component={MapTabStack} />
      <Tab.Screen name="BookingsTab" component={BookingsTabStack} />
      <Tab.Screen name="AITab" component={AITabStack} />
      <Tab.Screen name="WalletTab" component={WalletTabStack} />
      <Tab.Screen name="ProfileTab" component={ProfileTabStack} />
    </Tab.Navigator>
  );
}
