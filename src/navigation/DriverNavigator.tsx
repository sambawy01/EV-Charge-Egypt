import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '@/core/theme/colors';

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

export function DriverNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: { borderTopColor: colors.border },
      }}
    >
      <Tab.Screen
        name="MapTab"
        component={MapTabStack}
        options={{ tabBarLabel: 'Map' }}
      />
      <Tab.Screen
        name="BookingsTab"
        component={BookingsTabStack}
        options={{ tabBarLabel: 'Bookings' }}
      />
      <Tab.Screen
        name="AITab"
        component={AITabStack}
        options={{ tabBarLabel: 'AI' }}
      />
      <Tab.Screen
        name="WalletTab"
        component={WalletTabStack}
        options={{ tabBarLabel: 'Wallet' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileTabStack}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
