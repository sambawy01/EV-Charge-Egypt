import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { colors } from '@/core/theme/colors';

const Tab = createBottomTabNavigator();

function Placeholder({ name }: { name: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <Text style={{ fontSize: 18, color: colors.textSecondary }}>{name} — Coming Soon</Text>
    </View>
  );
}

function MapTab() { return <Placeholder name="Map" />; }
function BookingsTab() { return <Placeholder name="Bookings" />; }
function AITab() { return <Placeholder name="AI Assistant" />; }
function WalletTab() { return <Placeholder name="Wallet" />; }
function ProfileTab() { return <Placeholder name="Profile" />; }

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
      <Tab.Screen name="MapTab" component={MapTab} options={{ tabBarLabel: 'Map' }} />
      <Tab.Screen name="BookingsTab" component={BookingsTab} options={{ tabBarLabel: 'Bookings' }} />
      <Tab.Screen name="AITab" component={AITab} options={{ tabBarLabel: 'AI' }} />
      <Tab.Screen name="WalletTab" component={WalletTab} options={{ tabBarLabel: 'Wallet' }} />
      <Tab.Screen name="ProfileTab" component={ProfileTab} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}
