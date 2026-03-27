import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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

function SideTabBar({ state, descriptors, navigation }: any) {
  const { colors } = useTheme();

  const icons: Record<string, string> = {
    MapTab: '\u{1F4CD}',
    BookingsTab: '\u{1F4CB}',
    AITab: '\u{1F916}',
    WalletTab: '\u{1F4B3}',
    ProfileTab: '\u{1F464}',
  };

  const labels: Record<string, string> = {
    MapTab: 'Map',
    BookingsTab: 'Bookings',
    AITab: 'AI',
    WalletTab: 'Wallet',
    ProfileTab: 'Profile',
  };

  return (
    <View
      style={{
        width: 72,
        backgroundColor: colors.surface,
        borderRightWidth: 1,
        borderRightColor: colors.border,
        paddingTop: 48,
        paddingBottom: 24,
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 8,
      }}
    >
      {/* Brand mark */}
      <Text style={{ fontSize: 24, marginBottom: 24 }}>{'\u26A1'}</Text>

      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isFocused ? colors.primaryLight : 'transparent',
            }}
          >
            <Text style={{ fontSize: 20 }}>{icons[route.name] || '\u25CF'}</Text>
            <Text
              style={{
                fontSize: 9,
                marginTop: 2,
                color: isFocused ? colors.primary : colors.textTertiary,
                fontWeight: isFocused ? '600' : '400',
              }}
            >
              {labels[route.name] || route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function DriverNavigator() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.background }}>
      <Tab.Navigator
        tabBar={(props) => <SideTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
        sceneContainerStyle={{ flex: 1 }}
      >
        <Tab.Screen name="MapTab" component={MapTabStack} />
        <Tab.Screen name="BookingsTab" component={BookingsTabStack} />
        <Tab.Screen name="AITab" component={AITabStack} />
        <Tab.Screen name="WalletTab" component={WalletTabStack} />
        <Tab.Screen name="ProfileTab" component={ProfileTabStack} />
      </Tab.Navigator>
    </View>
  );
}
