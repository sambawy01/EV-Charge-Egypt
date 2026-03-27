import React from 'react';
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

export function FleetNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="Vehicles"
        component={VehiclesStack}
        options={{ tabBarLabel: 'Vehicles' }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleStack}
        options={{ tabBarLabel: 'Schedule' }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsStack}
        options={{ tabBarLabel: 'Reports' }}
      />
      <Tab.Screen
        name="FleetSettings"
        component={SettingsStack}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}
