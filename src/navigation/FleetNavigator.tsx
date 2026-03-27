import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FleetHomeScreen } from '@/fleet/screens/FleetHomeScreen';
import { VehicleListScreen } from '@/fleet/screens/VehicleListScreen';
import { VehicleDetailScreen } from '@/fleet/screens/VehicleDetailScreen';
import { DriverDetailScreen } from '@/fleet/screens/DriverDetailScreen';
import { AssignDriverScreen } from '@/fleet/screens/AssignDriverScreen';
import { ScheduleScreen } from '@/fleet/screens/ScheduleScreen';
import { AIScheduleReviewScreen } from '@/fleet/screens/AIScheduleReviewScreen';
import { ReportsScreen } from '@/fleet/screens/ReportsScreen';
import { CostBreakdownScreen } from '@/fleet/screens/CostBreakdownScreen';
import { BatteryHealthScreen } from '@/fleet/screens/BatteryHealthScreen';
import { ExportScreen } from '@/fleet/screens/ExportScreen';
import { FleetSettingsScreen } from '@/fleet/screens/FleetSettingsScreen';
import { CreditTopUpScreen } from '@/fleet/screens/CreditTopUpScreen';
import { MemberManagementScreen } from '@/fleet/screens/MemberManagementScreen';
import { BillingScreen } from '@/fleet/screens/BillingScreen';
import { useTheme } from '@/core/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={FleetHomeScreen} />
      <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} />
      <Stack.Screen name="DriverDetail" component={DriverDetailScreen} />
    </Stack.Navigator>
  );
}

function VehiclesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VehicleList" component={VehicleListScreen} />
      <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} />
      <Stack.Screen name="AssignDriver" component={AssignDriverScreen} />
      <Stack.Screen name="DriverDetail" component={DriverDetailScreen} />
    </Stack.Navigator>
  );
}

function ScheduleStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ScheduleMain" component={ScheduleScreen} />
      <Stack.Screen name="AIScheduleReview" component={AIScheduleReviewScreen} />
    </Stack.Navigator>
  );
}

function ReportsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ReportsMain" component={ReportsScreen} />
      <Stack.Screen name="CostBreakdown" component={CostBreakdownScreen} />
      <Stack.Screen name="BatteryHealth" component={BatteryHealthScreen} />
      <Stack.Screen name="Export" component={ExportScreen} />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsMain" component={FleetSettingsScreen} />
      <Stack.Screen name="CreditTopUp" component={CreditTopUpScreen} />
      <Stack.Screen name="MemberManagement" component={MemberManagementScreen} />
      <Stack.Screen name="DriverDetail" component={DriverDetailScreen} />
      <Stack.Screen name="Billing" component={BillingScreen} />
    </Stack.Navigator>
  );
}

function InlineTabs({ state, descriptors, navigation }: any) {
  const { colors } = useTheme();

  const tabs = [
    { name: 'FleetHome', icon: '\u{1F4CA}', label: 'Dashboard' },
    { name: 'VehiclesTab', icon: '\u{1F697}', label: 'Vehicles' },
    { name: 'ScheduleTab', icon: '\u{1F4C5}', label: 'Schedule' },
    { name: 'ReportsTab', icon: '\u{1F4C8}', label: 'Reports' },
    { name: 'SettingsTab', icon: '\u2699\uFE0F', label: 'Settings' },
  ];

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 2,
    }}>
      {/* Brand */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
        <Text style={{ fontSize: 20 }}>{'\u26A1'}</Text>
        <Text style={{
          fontFamily: 'SpaceGrotesk-Bold',
          fontSize: 15,
          color: colors.primary,
          marginLeft: 6,
        }}>EV Fleet</Text>
      </View>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Nav tabs */}
      {tabs.map((tab) => {
        const routeIndex = state.routes.findIndex((r: any) => r.name === tab.name);
        const isFocused = state.index === routeIndex;
        return (
          <TouchableOpacity
            key={tab.name}
            onPress={() => {
              if (!isFocused) navigation.navigate(tab.name);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: isFocused ? colors.primaryLight : 'transparent',
              gap: 5,
            }}
          >
            <Text style={{ fontSize: 14 }}>{tab.icon}</Text>
            <Text style={{
              fontSize: 12,
              color: isFocused ? colors.primary : colors.textTertiary,
              fontWeight: isFocused ? '600' : '400',
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function FleetNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <InlineTabs {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="FleetHome" component={DashboardStack} />
      <Tab.Screen name="VehiclesTab" component={VehiclesStack} />
      <Tab.Screen name="ScheduleTab" component={ScheduleStack} />
      <Tab.Screen name="ReportsTab" component={ReportsStack} />
      <Tab.Screen name="SettingsTab" component={SettingsStack} />
    </Tab.Navigator>
  );
}
