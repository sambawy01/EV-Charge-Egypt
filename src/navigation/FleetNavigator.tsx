import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

  const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <AnimatedGradient
        colors={isFocused ? ['#00D4FF', '#8B5CF6', '#D946EF'] : ['#0e2a3d', '#1a1535', '#2a1230']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 18,
          paddingVertical: 12,
          borderRadius: 12,
          gap: 8,
          borderWidth: 1.5,
          borderColor: isFocused ? '#D946EF' : '#00D4FF',
          borderBottomWidth: isFocused ? 3 : 2,
          borderBottomColor: isFocused ? '#8B5CF6' : '#0095CC',
          shadowColor: isFocused ? '#D946EF' : '#00D4FF',
          shadowOffset: isFocused
            ? { width: glowX as any, height: glowY as any }
            : { width: 0, height: 0 },
          shadowOpacity: isFocused ? (glowOpacity as any) : 0.3,
          shadowRadius: isFocused ? (glowRadius as any) : 8,
          elevation: isFocused ? 10 : 5,
          transform: [{ scale: isFocused ? pulseAnim : 1 }],
        }}
      >
        <Text style={{ fontSize: 18 }}>{icon}</Text>
        <Text style={{
          fontFamily: isFocused ? 'SpaceGrotesk-SemiBold' : undefined,
          fontSize: 14,
          color: '#FFFFFF',
          fontWeight: isFocused ? '700' : '400',
        }}>
          {label}
        </Text>
      </AnimatedGradient>
    </TouchableOpacity>
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
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 6,
    }}>
      {/* Brand */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
        <Text style={{ fontSize: 26 }}>{'\u26A1'}</Text>
        <Text style={{
          fontFamily: 'SpaceGrotesk-Bold',
          fontSize: 18,
          color: colors.primary,
          marginLeft: 8,
        }}>EV Fleet</Text>
      </View>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Nav tabs — all cyan borders, active has spinning glow */}
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
