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

export function FleetNavigator() {
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
        name="Dashboard"
        component={() => <Placeholder name="Fleet Dashboard" />}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="Vehicles"
        component={() => <Placeholder name="Vehicles" />}
        options={{ tabBarLabel: 'Vehicles' }}
      />
      <Tab.Screen
        name="Schedule"
        component={() => <Placeholder name="Schedule" />}
        options={{ tabBarLabel: 'Schedule' }}
      />
      <Tab.Screen
        name="Reports"
        component={() => <Placeholder name="Reports" />}
        options={{ tabBarLabel: 'Reports' }}
      />
      <Tab.Screen
        name="FleetSettings"
        component={() => <Placeholder name="Fleet Settings" />}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}
