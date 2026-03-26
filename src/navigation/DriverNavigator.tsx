import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '@/core/theme/colors';
import { MapScreen } from '@/driver/screens/MapScreen';
import { StationDetailScreen } from '@/driver/screens/StationDetailScreen';
import { BookingScreen } from '@/driver/screens/BookingScreen';
import { ChargingSessionScreen } from '@/driver/screens/ChargingSessionScreen';
import { BookingsListScreen } from '@/driver/screens/BookingsListScreen';
import { BookingDetailScreen } from '@/driver/screens/BookingDetailScreen';
import { WalletScreen } from '@/driver/screens/WalletScreen';
import { TopUpScreen } from '@/driver/screens/TopUpScreen';
import { TransactionHistoryScreen } from '@/driver/screens/TransactionHistoryScreen';

const Tab = createBottomTabNavigator();
const MapStack = createNativeStackNavigator();
const BookingsStack = createNativeStackNavigator();
const WalletStack = createNativeStackNavigator();

function MapTabStack() {
  return (
    <MapStack.Navigator screenOptions={{ headerShown: false }}>
      <MapStack.Screen name="Map" component={MapScreen} />
      <MapStack.Screen name="StationDetail" component={StationDetailScreen} />
      <MapStack.Screen name="Booking" component={BookingScreen} />
      <MapStack.Screen
        name="ChargingSession"
        component={ChargingSessionScreen}
      />
      <MapStack.Screen name="BookingDetail" component={BookingDetailScreen} />
    </MapStack.Navigator>
  );
}

function BookingsTabStack() {
  return (
    <BookingsStack.Navigator screenOptions={{ headerShown: false }}>
      <BookingsStack.Screen
        name="BookingsList"
        component={BookingsListScreen}
      />
      <BookingsStack.Screen
        name="BookingDetail"
        component={BookingDetailScreen}
      />
      <BookingsStack.Screen
        name="ChargingSession"
        component={ChargingSessionScreen}
      />
      <BookingsStack.Screen name="BookingsTab" component={BookingsListScreen} />
    </BookingsStack.Navigator>
  );
}

function WalletTabStack() {
  return (
    <WalletStack.Navigator screenOptions={{ headerShown: false }}>
      <WalletStack.Screen name="Wallet" component={WalletScreen} />
      <WalletStack.Screen name="TopUp" component={TopUpScreen} />
      <WalletStack.Screen
        name="TransactionHistory"
        component={TransactionHistoryScreen}
      />
    </WalletStack.Navigator>
  );
}

function AITabPlaceholder() {
  const { View, Text } = require('react-native');
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
      }}
    >
      <Text style={{ fontSize: 18, color: colors.textSecondary }}>
        AI Assistant — Coming Soon
      </Text>
    </View>
  );
}

function ProfileTabPlaceholder() {
  const { View, Text } = require('react-native');
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
      }}
    >
      <Text style={{ fontSize: 18, color: colors.textSecondary }}>
        Profile — Coming Soon
      </Text>
    </View>
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
        component={AITabPlaceholder}
        options={{ tabBarLabel: 'AI' }}
      />
      <Tab.Screen
        name="WalletTab"
        component={WalletTabStack}
        options={{ tabBarLabel: 'Wallet' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileTabPlaceholder}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
