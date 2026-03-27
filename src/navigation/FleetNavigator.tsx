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

function FleetSideTabBar({ state, descriptors, navigation }: any) {
  const { colors } = useTheme();

  const icons: Record<string, string> = {
    FleetHome: '\u{1F4CA}',
    VehiclesTab: '\u{1F697}',
    ScheduleTab: '\u{1F4C5}',
    ReportsTab: '\u{1F4C8}',
    SettingsTab: '\u2699\uFE0F',
  };

  const labels: Record<string, string> = {
    FleetHome: 'Dashboard',
    VehiclesTab: 'Vehicles',
    ScheduleTab: 'Schedule',
    ReportsTab: 'Reports',
    SettingsTab: 'Settings',
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

export function FleetNavigator() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.background }}>
      <Tab.Navigator
        tabBar={(props) => <FleetSideTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
        sceneContainerStyle={{ flex: 1 }}
      >
        <Tab.Screen name="FleetHome" component={DashboardStack} />
        <Tab.Screen name="VehiclesTab" component={VehiclesStack} />
        <Tab.Screen name="ScheduleTab" component={ScheduleStack} />
        <Tab.Screen name="ReportsTab" component={ReportsStack} />
        <Tab.Screen name="SettingsTab" component={SettingsStack} />
      </Tab.Navigator>
    </View>
  );
}
