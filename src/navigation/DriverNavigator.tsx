import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/core/theme';
import { aiContextService } from '@/core/services/aiContextService';
import { useVehicles } from '@/core/queries/useVehicles';

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

// Plan 7: Vehicle Dashboard screen
import { VehicleDashboardScreen } from '@/driver/screens/VehicleDashboardScreen';

// Plan 8: AI Trip Planner
import { TripPlannerScreen } from '@/driver/screens/TripPlannerScreen';

// Plan 9: News Feed
import { NewsScreen } from '@/driver/screens/NewsScreen';

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
const VehicleStack = createNativeStackNavigator();
const NewsStack = createNativeStackNavigator();
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

function VehicleTabStack() {
  return (
    <VehicleStack.Navigator screenOptions={{ headerShown: false }}>
      <VehicleStack.Screen name="VehicleDashboard" component={VehicleDashboardScreen} />
      <VehicleStack.Screen name="VehicleList" component={VehicleScreen} />
      <VehicleStack.Screen name="AddVehicle" component={AddVehicleScreen} />
      <VehicleStack.Screen name="TripPlanner" component={TripPlannerScreen} />
    </VehicleStack.Navigator>
  );
}

function NewsTabStack() {
  return (
    <NewsStack.Navigator screenOptions={{ headerShown: false }}>
      <NewsStack.Screen name="NewsFeed" component={NewsScreen} />
    </NewsStack.Navigator>
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
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isFocused) {
      const spinLoop = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      );
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.07,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      );
      spinLoop.start();
      pulseLoop.start();
      return () => { spinLoop.stop(); pulseLoop.stop(); };
    } else {
      spinAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [isFocused]);

  const glowX = spinAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, 6, 0, -6, 0],
  });
  const glowY = spinAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [-6, 0, 6, 0, -6],
  });
  const glowOpacity = spinAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0.4, 0.7, 0.4, 0.7, 0.4],
  });
  const glowRadius = spinAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [10, 16, 10, 16, 10],
  });

  // Gradient border trick: outer LinearGradient as border, inner dark View as content
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View style={{
        transform: [{ scale: isFocused ? pulseAnim : 1 }],
        shadowColor: isFocused ? '#D946EF' : '#00D4FF',
        shadowOffset: isFocused
          ? { width: glowX as any, height: glowY as any }
          : { width: 0, height: 0 },
        shadowOpacity: isFocused ? (glowOpacity as any) : 0.2,
        shadowRadius: isFocused ? (glowRadius as any) : 6,
        elevation: isFocused ? 10 : 4,
        borderRadius: 12,
      }}>
        <LinearGradient
          colors={isFocused ? ['#00D4FF', '#8B5CF6', '#D946EF'] : ['#00D4FF44', '#8B5CF644', '#D946EF44']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 12, padding: 1.5 }}
        >
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 18,
            paddingVertical: 12,
            borderRadius: 10.5,
            gap: 8,
            backgroundColor: colors.surfaceSecondary,
          }}>
            <Text style={{ fontSize: 18 }}>{icon}</Text>
            <Text style={{
              fontFamily: isFocused ? 'SpaceGrotesk-SemiBold' : undefined,
              fontSize: 14,
              color: '#FFFFFF',
              fontWeight: isFocused ? '700' : '400',
            }}>
              {label}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

function InlineTabs({ state, descriptors, navigation }: any) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { data: vehicles } = useVehicles();

  const aiNotifCount = useMemo(() => {
    if (!vehicles?.length) return 0;
    const ctx = aiContextService.buildContext(vehicles[0], null);
    return aiContextService.getNotificationCount(ctx);
  }, [vehicles]);

  const tabs = [
    { name: 'MapTab', icon: '\u{1F4CD}', label: 'Map' },
    { name: 'AITab', icon: '\u{1F916}', label: 'AI' },
    { name: 'NewsTab', icon: '\u{1F4F0}', label: 'News' },
    { name: 'WalletTab', icon: '\u{1F4B3}', label: 'Wallet' },
    { name: 'VehicleTab', icon: '\u{1F697}', label: 'Vehicle' },
    { name: 'ProfileTab', icon: '\u{1F464}', label: 'Profile' },
  ];

  // --- Mobile: simple bottom tab bar ---
  if (isMobile) {
    return (
      <View style={{
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingBottom: 20,
        paddingTop: 8,
      }}>
        {tabs.map((tab) => {
          const routeIndex = state.routes.findIndex((r: any) => r.name === tab.name);
          const isFocused = state.index === routeIndex;
          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => { if (!isFocused) navigation.navigate(tab.name); }}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 4,
                position: 'relative',
              }}
            >
              <Text style={{ fontSize: 20, marginBottom: 2 }}>{tab.icon}</Text>
              <Text style={{
                fontSize: 10,
                color: isFocused ? colors.primary : colors.textTertiary,
                fontWeight: isFocused ? '700' : '400',
              }}>
                {tab.label}
              </Text>
              {tab.name === 'AITab' && aiNotifCount > 0 && !isFocused && (
                <View style={{
                  position: 'absolute',
                  top: -2,
                  right: '20%',
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: '#D946EF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: colors.surface,
                }}>
                  <Text style={{ fontSize: 8, fontWeight: '700', color: '#FFFFFF' }}>{aiNotifCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // --- Desktop: top bar with brand + GlowTab buttons ---
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
        }}>WattsOn</Text>
      </View>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Nav tabs — all with cyan borders, active has spinning glow */}
      {tabs.map((tab) => {
        const routeIndex = state.routes.findIndex((r: any) => r.name === tab.name);
        const isFocused = state.index === routeIndex;
        return (
          <View key={tab.name} style={{ position: 'relative' }}>
            <GlowTab
              icon={tab.icon}
              label={tab.label}
              isFocused={isFocused}
              colors={colors}
              onPress={() => {
                if (!isFocused) navigation.navigate(tab.name);
              }}
            />
            {tab.name === 'AITab' && aiNotifCount > 0 && !isFocused && (
              <View style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: '#D946EF',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: colors.surface,
              }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#FFFFFF' }}>{aiNotifCount}</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

export function DriverNavigator() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <Tab.Navigator
      tabBar={(props) => <InlineTabs {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarPosition: isMobile ? 'bottom' : 'top',
      }}
    >
      <Tab.Screen name="MapTab" component={MapTabStack} />
      <Tab.Screen name="AITab" component={AITabStack} />
      <Tab.Screen name="NewsTab" component={NewsTabStack} />
      <Tab.Screen name="WalletTab" component={WalletTabStack} />
      <Tab.Screen name="VehicleTab" component={VehicleTabStack} />
      <Tab.Screen name="ProfileTab" component={ProfileTabStack} />
    </Tab.Navigator>
  );
}
