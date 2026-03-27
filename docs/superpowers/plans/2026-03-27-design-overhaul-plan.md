# Design Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the app from generic mint-green template into a dark-mode-first, Tesla/Rivian-energy EV platform with electric cyan/green accents and Space Grotesk headers.

**Architecture:** Theme system rewrite (colors → dark/light token maps with React context), font loading via expo-font, then propagate to all 6 core components and 2 navigators. 65 screen/component files already use `colors.xxx` tokens so they'll update automatically; 8 files with hardcoded colors need manual fixes.

**Tech Stack:** React Native, Expo, expo-font (Space Grotesk), React Context, AsyncStorage, expo-linear-gradient

---

### Task 1: Install Space Grotesk font + expo-font setup

**Files:**
- Create: `assets/fonts/SpaceGrotesk-SemiBold.ttf`
- Create: `assets/fonts/SpaceGrotesk-Bold.ttf`
- Modify: `App.tsx`

- [ ] **Step 1: Download Space Grotesk font files**

```bash
cd "/Users/bistrocloud/Documents/EV Charging Aggregator"
curl -L "https://fonts.google.com/download?family=Space+Grotesk" -o /tmp/space-grotesk.zip
unzip -o /tmp/space-grotesk.zip -d /tmp/space-grotesk
cp /tmp/space-grotesk/static/SpaceGrotesk-SemiBold.ttf assets/fonts/SpaceGrotesk-SemiBold.ttf
cp /tmp/space-grotesk/static/SpaceGrotesk-Bold.ttf assets/fonts/SpaceGrotesk-Bold.ttf
```

If the Google Fonts download URL doesn't work, download Space Grotesk from https://fonts.google.com/specimen/Space+Grotesk and place the SemiBold and Bold `.ttf` files into `assets/fonts/`.

- [ ] **Step 2: Update App.tsx to load fonts**

```tsx
import React, { useCallback } from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { queryClient } from '@/core/queries/queryClient';
import { AuthProvider } from '@/core/auth/AuthProvider';
import { ThemeProvider, useTheme } from '@/core/theme';
import { RootNavigator } from '@/navigation/RootNavigator';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { colors, isDark } = useTheme();
  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <RootNavigator />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'SpaceGrotesk-SemiBold': require('./assets/fonts/SpaceGrotesk-SemiBold.ttf'),
    'SpaceGrotesk-Bold': require('./assets/fonts/SpaceGrotesk-Bold.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
              <AppContent />
            </View>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
```

Note: `ThemeProvider` and `useTheme` don't exist yet — they'll be created in Task 2. This file will error until Task 2 is complete.

- [ ] **Step 3: Commit**

```bash
git add assets/fonts/ App.tsx
git commit -m "feat: add Space Grotesk font and font loading setup"
```

---

### Task 2: Rewrite theme system — colors, typography, spacing, ThemeProvider

**Files:**
- Rewrite: `src/core/theme/colors.ts`
- Rewrite: `src/core/theme/typography.ts`
- Modify: `src/core/theme/spacing.ts`
- Rewrite: `src/core/theme/index.ts`

- [ ] **Step 1: Rewrite colors.ts with dark/light token maps**

```ts
const darkColors = {
  background: '#0A0E1A',
  surface: '#141B2D',
  surfaceSecondary: '#1C2438',
  surfaceTertiary: '#232B42',
  border: '#2A3350',
  borderFocus: '#00D4FF',

  primary: '#00D4FF',
  primaryDark: '#0095CC',
  primaryLight: 'rgba(0, 212, 255, 0.15)',
  primaryGlow: 'rgba(0, 212, 255, 0.3)',
  accent: '#00D4FF',

  secondary: '#00FF88',
  secondaryDark: '#00CC6A',
  secondaryGlow: 'rgba(0, 255, 136, 0.12)',

  text: '#F0F4FF',
  textSecondary: '#8892B0',
  textTertiary: '#5A6482',

  error: '#FF4D6A',
  warning: '#FFB020',
  success: '#00FF88',
  info: '#00D4FF',

  statusAvailable: '#00FF88',
  statusCharging: '#00D4FF',
  statusPartial: '#FFB020',
  statusOccupied: '#FF4D6A',
  statusOffline: '#5A6482',

  white: '#FFFFFF',
  black: '#000000',
} as const;

const lightColors = {
  background: '#F4F6FB',
  surface: '#FFFFFF',
  surfaceSecondary: '#EEF1F8',
  surfaceTertiary: '#E4E8F2',
  border: '#D0D5E3',
  borderFocus: '#00A8CC',

  primary: '#00A8CC',
  primaryDark: '#007A99',
  primaryLight: 'rgba(0, 168, 204, 0.10)',
  primaryGlow: 'rgba(0, 168, 204, 0.15)',
  accent: '#00A8CC',

  secondary: '#00CC6A',
  secondaryDark: '#009E52',
  secondaryGlow: 'rgba(0, 204, 106, 0.10)',

  text: '#0A0E1A',
  textSecondary: '#5A6482',
  textTertiary: '#8892B0',

  error: '#E53E5C',
  warning: '#E09A00',
  success: '#00CC6A',
  info: '#00A8CC',

  statusAvailable: '#00CC6A',
  statusCharging: '#00A8CC',
  statusPartial: '#E09A00',
  statusOccupied: '#E53E5C',
  statusOffline: '#8892B0',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ThemeColors = typeof darkColors;
export { darkColors, lightColors };

// Default export for backward compatibility during migration
export const colors = darkColors;
```

- [ ] **Step 2: Rewrite typography.ts with Space Grotesk headers**

```ts
import { Platform } from 'react-native';

const systemFont = Platform.OS === 'ios' ? 'System' : 'Roboto';

export const typography = {
  h1: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 32, fontWeight: '700' as const, lineHeight: 38, letterSpacing: -0.5 },
  h2: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 24, fontWeight: '700' as const, lineHeight: 30, letterSpacing: -0.5 },
  h3: { fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 20, fontWeight: '600' as const, lineHeight: 26, letterSpacing: -0.3 },
  body: { fontFamily: systemFont, fontSize: 15, fontWeight: '400' as const, lineHeight: 22, letterSpacing: 0 },
  bodyBold: { fontFamily: systemFont, fontSize: 15, fontWeight: '600' as const, lineHeight: 22, letterSpacing: 0 },
  caption: { fontFamily: systemFont, fontSize: 13, fontWeight: '400' as const, lineHeight: 18, letterSpacing: 0.1 },
  small: { fontFamily: systemFont, fontSize: 11, fontWeight: '400' as const, lineHeight: 16, letterSpacing: 0.2 },
  button: { fontFamily: systemFont, fontSize: 15, fontWeight: '600' as const, lineHeight: 20, letterSpacing: 0.3 },
  mono: { fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 14, fontWeight: '500' as const, lineHeight: 20, letterSpacing: 0 },
} as const;
```

- [ ] **Step 3: Update spacing.ts border radii**

```ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;
```

- [ ] **Step 4: Rewrite index.ts with ThemeProvider and useTheme hook**

```ts
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, ThemeColors } from './colors';

export { spacing, borderRadius } from './spacing';
export { typography } from './typography';
export { darkColors, lightColors } from './colors';
// Keep backward compat
export { colors } from './colors';

type ThemeMode = 'dark' | 'light';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const THEME_STORAGE_KEY = 'ev_charge_theme_mode';

const ThemeContext = createContext<ThemeContextValue>({
  colors: darkColors,
  isDark: true,
  mode: 'dark',
  toggleTheme: () => {},
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') {
        setModeState(stored);
      }
    });
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
  };

  const toggleTheme = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };

  const value: ThemeContextValue = {
    colors: mode === 'dark' ? darkColors : lightColors,
    isDark: mode === 'dark',
    mode,
    toggleTheme,
    setMode,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

Note: AsyncStorage is available via `@react-native-async-storage/async-storage`. If not installed, expo's SecureStore (`expo-secure-store`) can be used instead — just swap the import and method names (`getItemAsync`/`setItemAsync`). Check `package.json` first.

- [ ] **Step 5: Install AsyncStorage if needed**

```bash
npx expo install @react-native-async-storage/async-storage
```

If AsyncStorage is already available or you prefer SecureStore, skip this step and adjust the import in `index.ts`.

- [ ] **Step 6: Commit**

```bash
git add src/core/theme/
git commit -m "feat: rewrite theme system — dark/light modes, cyan/green accents, Space Grotesk"
```

---

### Task 3: Update core components — Button, Card, Header, Badge, Avatar, LoadingScreen

**Files:**
- Modify: `src/core/components/Button.tsx`
- Modify: `src/core/components/Card.tsx`
- Modify: `src/core/components/Header.tsx`
- Modify: `src/core/components/Badge.tsx`
- Modify: `src/core/components/Avatar.tsx`
- Modify: `src/core/components/LoadingScreen.tsx`

All components switch from static `colors` import to `useTheme()` hook for dynamic theming.

- [ ] **Step 1: Rewrite Button.tsx**

```tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { spacing, borderRadius } from '../theme/spacing';
import { typography } from '../theme/typography';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  style,
  textStyle,
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const sizeStyle =
    size === 'sm' ? styles.size_sm :
    size === 'lg' ? styles.size_lg : styles.size_md;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[isDisabled && styles.disabled, style]}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, sizeStyle, { borderRadius: borderRadius.md, shadowColor: colors.primary }]}
        >
          {loading ? <ActivityIndicator color={colors.black} /> : null}
          <Text style={[styles.text, { color: colors.black }, textStyle]}>{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const containerStyles: ViewStyle = {
    backgroundColor:
      variant === 'secondary' ? colors.surfaceSecondary :
      variant === 'outline' ? 'transparent' : 'transparent',
    borderWidth: variant === 'outline' ? 1.5 : 0,
    borderColor: variant === 'outline' ? colors.primary : undefined,
    borderRadius: borderRadius.md,
  };

  const textColor =
    variant === 'secondary' ? colors.primary :
    variant === 'outline' ? colors.primary : colors.primary;

  return (
    <TouchableOpacity
      style={[styles.base, sizeStyle, containerStyles, isDisabled && styles.disabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  size_sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  size_md: { paddingVertical: spacing.md - 2, paddingHorizontal: spacing.lg },
  size_lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  disabled: { opacity: 0.4 },
  text: { ...typography.button },
});
```

- [ ] **Step 2: Rewrite Card.tsx**

```tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { spacing, borderRadius } from '../theme/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'flat';
}

export function Card({ children, style, variant = 'elevated' }: CardProps) {
  const { colors, isDark } = useTheme();

  const dynamicStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderWidth: variant === 'outlined' || (variant === 'elevated' && isDark) ? 1 : 0,
    borderColor: colors.border,
    ...(variant === 'elevated' && !isDark ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    } : {}),
  };

  return (
    <View style={[styles.base, dynamicStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
});
```

- [ ] **Step 3: Rewrite Header.tsx**

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function Header({ title, onBack, rightAction }: HeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.primary }]}>{'<'}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{title}</Text>
      {rightAction || <View style={styles.placeholder} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  title: {
    ...typography.h3,
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 24,
  },
  placeholder: {
    width: 40,
  },
});
```

- [ ] **Step 4: Rewrite Badge.tsx with pill status style**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { borderRadius, spacing } from '../theme/spacing';

interface BadgeProps {
  label: string;
  color?: string;
  backgroundColor?: string;
}

export function Badge({ label, color, backgroundColor }: BadgeProps) {
  const { colors } = useTheme();
  const badgeColor = color || colors.primary;
  const badgeBg = backgroundColor || colors.primaryLight;

  return (
    <View style={[styles.container, { backgroundColor: badgeBg }]}>
      <Text style={[styles.text, { color: badgeColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
```

- [ ] **Step 5: Rewrite Avatar.tsx**

```tsx
import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: number;
}

export function Avatar({ uri, name, size = 40 }: AvatarProps) {
  const { colors } = useTheme();

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, {
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: colors.surfaceSecondary,
          borderWidth: 2, borderColor: colors.primary,
        }]}
      />
    );
  }

  return (
    <View style={[styles.fallback, {
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 2, borderColor: colors.primary,
    }]}>
      <Text style={[styles.initials, { fontSize: size * 0.4, color: colors.primary }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {},
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
  },
});
```

- [ ] **Step 6: Rewrite LoadingScreen.tsx**

```tsx
import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme';
import { typography } from '../theme/typography';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.text, { color: colors.textSecondary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.body,
    marginTop: 16,
  },
});
```

- [ ] **Step 7: Commit**

```bash
git add src/core/components/
git commit -m "feat: update all core components to use dynamic theme — dark mode support"
```

---

### Task 4: Update navigators — dark tab bar, cyan active states

**Files:**
- Modify: `src/navigation/DriverNavigator.tsx`
- Modify: `src/navigation/FleetNavigator.tsx`
- Modify: `src/navigation/RootNavigator.tsx`

- [ ] **Step 1: Update DriverNavigator.tsx**

Replace the static `colors` import and tab bar styles. Change the import at the top:

```tsx
// Replace:
import { colors } from '@/core/theme/colors';
// With:
import { useTheme } from '@/core/theme';
```

Update the `DriverNavigator` function:

```tsx
export function DriverNavigator() {
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
      <Tab.Screen name="MapTab" component={MapTabStack} options={{ tabBarLabel: 'Map' }} />
      <Tab.Screen name="BookingsTab" component={BookingsTabStack} options={{ tabBarLabel: 'Bookings' }} />
      <Tab.Screen name="AITab" component={AITabStack} options={{ tabBarLabel: 'AI' }} />
      <Tab.Screen name="WalletTab" component={WalletTabStack} options={{ tabBarLabel: 'Wallet' }} />
      <Tab.Screen name="ProfileTab" component={ProfileTabStack} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}
```

- [ ] **Step 2: Update FleetNavigator.tsx the same way**

Same pattern — replace `import { colors }` with `import { useTheme }`, use `const { colors } = useTheme()` inside the component, and apply the same `tabBarStyle` with `backgroundColor: colors.surface`.

- [ ] **Step 3: Update RootNavigator.tsx**

The `NavigationContainer` needs a dark theme. Update:

```tsx
import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useAuthStore } from '@/core/stores/authStore';
import { LoadingScreen } from '@/core/components';
import { useTheme } from '@/core/theme';
import { AuthNavigator } from './AuthNavigator';
import { DriverNavigator } from './DriverNavigator';
import { FleetNavigator } from './FleetNavigator';

export function RootNavigator() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const { colors, isDark } = useTheme();

  if (isLoading) {
    return <LoadingScreen message="Starting EV Charge Egypt..." />;
  }

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      {!isAuthenticated ? (
        <AuthNavigator />
      ) : user?.role === 'fleet_manager' ? (
        <FleetNavigator />
      ) : (
        <DriverNavigator />
      )}
    </NavigationContainer>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/navigation/
git commit -m "feat: dark themed navigators — dark tab bar, cyan active states"
```

---

### Task 5: Fix hardcoded colors in 8 files

**Files:**
- Modify: `src/driver/components/WebMap.tsx` (13 hardcoded colors)
- Modify: `src/driver/components/SearchBar.tsx` (2 hardcoded)
- Modify: `src/driver/components/StationMarker.tsx` (3 hardcoded)
- Modify: `src/fleet/screens/BatteryHealthScreen.tsx` (1 hardcoded)
- Modify: `src/fleet/screens/CostBreakdownScreen.tsx` (1 hardcoded)
- Modify: `src/fleet/screens/BillingScreen.tsx` (1 hardcoded)
- Modify: `src/fleet/screens/ScheduleScreen.tsx` (1 hardcoded)
- Modify: `src/fleet/components/FleetAlertCard.tsx` (1 hardcoded)

- [ ] **Step 1: Fix each file**

For each file, replace hardcoded hex values with theme tokens:

**Mapping for dark mode:**
| Old hardcoded hex | New theme token |
|---|---|
| `#10B981` | `colors.statusAvailable` or `colors.secondary` |
| `#F59E0B` | `colors.statusPartial` or `colors.warning` |
| `#EF4444` | `colors.statusOccupied` or `colors.error` |
| `#9CA3AF` | `colors.statusOffline` or `colors.textTertiary` |
| `#6B7280` | `colors.textSecondary` |
| `#374151` | `colors.text` |
| `#3B82F6` | `colors.primary` |
| `#fff` / `#FFFFFF` | `colors.white` |
| `#000` / `#000000` | `colors.black` |
| `#FFFBEB` / `#FEF3C7` | `colors.surfaceSecondary` (warning tint → use surface) |
| `#F0FDF4` | `colors.surfaceSecondary` |
| `#FEF2F2` | `colors.surfaceSecondary` |

For WebMap.tsx (which renders HTML in an iframe), the colors need to be injected as CSS variables or hardcoded in the HTML template — this is an exception since it's iframe content. Replace the hardcoded hex values in the HTML string with the equivalent dark theme hex values from the `darkColors` object. For dynamic theming in the WebMap iframe, pass the current colors as template parameters.

For all other files: add `import { useTheme } from '@/core/theme';`, call `const { colors } = useTheme();` inside the component, and replace hardcoded values.

- [ ] **Step 2: Commit**

```bash
git add src/driver/components/ src/fleet/screens/ src/fleet/components/
git commit -m "fix: replace all hardcoded colors with theme tokens"
```

---

### Task 6: Update auth screens — WelcomeScreen, LoginScreen, RegisterScreen

**Files:**
- Modify: `screens/auth/WelcomeScreen.tsx`
- Modify: `screens/auth/LoginScreen.tsx`
- Modify: `screens/auth/RegisterScreen.tsx`

These are the first screens users see — they must look premium.

- [ ] **Step 1: Update each screen**

For each file:
1. Replace `import { colors } from '...'` with `import { useTheme } from '@/core/theme';`
2. Add `const { colors } = useTheme();` inside the component
3. Replace all `colors.background` → dynamic, `colors.surface` → dynamic, etc.
4. Ensure backgrounds use `colors.background`, inputs use `colors.surfaceSecondary` with `colors.border` borders, and the primary CTA button uses the gradient primary variant.

- [ ] **Step 2: Commit**

```bash
git add screens/auth/
git commit -m "feat: dark theme auth screens — welcome, login, register"
```

---

### Task 7: Verify and test

- [ ] **Step 1: Start the app**

```bash
npx expo start --web
```

- [ ] **Step 2: Visual check**

Verify in the browser:
- App loads with dark background (`#0A0E1A`)
- Space Grotesk headers render correctly
- Bottom tab bar is dark with cyan active icons
- Cards have dark surface with borders, no white backgrounds
- Primary buttons show cyan gradient with glow
- Status badges use colored pill style
- Loading screen is dark with cyan spinner

- [ ] **Step 3: Test theme toggle**

If Settings screen has a theme toggle, switch to light mode and verify:
- Background switches to light gray-blue (`#F4F6FB`)
- Cards become white with subtle shadows
- Text becomes dark
- Accent colors remain cyan/green

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: polish design overhaul — visual adjustments"
```
