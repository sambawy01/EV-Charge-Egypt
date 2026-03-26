# Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the EV Charge Egypt app with auth, navigation, state management, design system, database schema, and provider adapter foundation.
**Architecture:** Expo 55 app with Supabase backend (Auth + PostgreSQL + Realtime + Edge Functions). Zustand for global state, React Query for server state. Provider adapter pattern abstracts 5 charging networks behind a unified interface.
**Tech Stack:** React Native (Expo 55), Supabase, Zustand, TanStack React Query, expo-router, expo-secure-store, TypeScript

---

## File Structure

```
ev-charge-egypt/
├── app.json
├── App.tsx
├── index.ts
├── package.json
├── tsconfig.json
├── .env.example
├── jest.config.js
├── babel.config.js
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── src/
│   ├── core/
│   │   ├── auth/
│   │   │   ├── authService.ts
│   │   │   ├── AuthProvider.tsx
│   │   │   └── useAuth.ts
│   │   ├── components/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── LoadingScreen.tsx
│   │   │   └── index.ts
│   │   ├── config/
│   │   │   ├── supabase.ts
│   │   │   ├── constants.ts
│   │   │   └── featureFlags.ts
│   │   ├── hooks/
│   │   │   └── useAppState.ts
│   │   ├── providers/
│   │   │   ├── types.ts
│   │   │   ├── ProviderAdapter.ts
│   │   │   ├── MockAdapter.ts
│   │   │   └── index.ts
│   │   ├── queries/
│   │   │   └── queryClient.ts
│   │   ├── services/
│   │   │   └── offlineDb.ts
│   │   │   └── offlineDb.web.ts
│   │   ├── stores/
│   │   │   ├── authStore.ts
│   │   │   ├── uiStore.ts
│   │   │   └── bookingStore.ts
│   │   ├── theme/
│   │   │   ├── colors.ts
│   │   │   ├── spacing.ts
│   │   │   ├── typography.ts
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── auth.ts
│   │   │   ├── station.ts
│   │   │   ├── booking.ts
│   │   │   ├── wallet.ts
│   │   │   └── fleet.ts
│   │   └── utils/
│   │       ├── formatCurrency.ts
│   │       └── validators.ts
│   ├── driver/
│   │   └── screens/
│   │       └── .gitkeep
│   ├── fleet/
│   │   └── screens/
│   │       └── .gitkeep
│   └── navigation/
│       ├── RootNavigator.tsx
│       ├── AuthNavigator.tsx
│       ├── DriverNavigator.tsx
│       └── FleetNavigator.tsx
├── screens/
│   ├── auth/
│   │   ├── WelcomeScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   └── RegisterScreen.tsx
│   └── common/
│       └── LoadingScreen.tsx
└── __tests__/
    ├── core/
    │   ├── authService.test.ts
    │   ├── authStore.test.ts
    │   ├── Button.test.tsx
    │   ├── MockAdapter.test.ts
    │   └── featureFlags.test.ts
    └── screens/
        ├── WelcomeScreen.test.tsx
        └── LoginScreen.test.tsx
```

---

## Task 1: Project Scaffolding

- [ ] **Step 1: Create Expo project and install dependencies**
  - File: `package.json`
  ```bash
  npx create-expo-app@latest ev-charge-egypt --template blank-typescript
  cd ev-charge-egypt
  npx expo install @supabase/supabase-js zustand @tanstack/react-query \
    react-native-maps expo-location expo-notifications expo-secure-store \
    expo-linear-gradient react-native-svg @react-navigation/native \
    @react-navigation/bottom-tabs @react-navigation/native-stack \
    react-native-screens react-native-safe-area-context \
    react-native-gesture-handler react-native-reanimated \
    expo-sqlite @expo/vector-icons expo-font expo-splash-screen \
    react-native-mmkv
  npm install -D jest @testing-library/react-native @testing-library/jest-native \
    @types/react @types/react-native typescript
  ```

- [ ] **Step 2: Configure app.json**
  - File: `app.json`
  ```json
  {
    "expo": {
      "name": "EV Charge Egypt",
      "slug": "ev-charge-egypt",
      "version": "1.0.0",
      "orientation": "portrait",
      "icon": "./assets/icon.png",
      "scheme": "evcharge",
      "userInterfaceStyle": "light",
      "splash": { "image": "./assets/splash-icon.png", "resizeMode": "contain", "backgroundColor": "#F0FDF4" },
      "ios": { "supportsTablet": true, "bundleIdentifier": "com.evchargeegypt.app", "config": { "googleMapsApiKey": "YOUR_KEY" } },
      "android": { "adaptiveIcon": { "foregroundImage": "./assets/android-icon-foreground.png", "backgroundColor": "#10B981" }, "package": "com.evchargeegypt.app", "config": { "googleMaps": { "apiKey": "YOUR_KEY" } } },
      "plugins": ["expo-location", "expo-notifications", "expo-secure-store"]
    }
  }
  ```

- [ ] **Step 3: Configure TypeScript**
  - File: `tsconfig.json`
  ```json
  {
    "extends": "expo/tsconfig.base",
    "compilerOptions": {
      "strict": true,
      "baseUrl": ".",
      "paths": { "@/*": ["src/*"], "@screens/*": ["screens/*"] }
    }
  }
  ```

- [ ] **Step 4: Create .env.example**
  - File: `.env.example`
  ```
  EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  EXPO_PUBLIC_GOOGLE_MAPS_KEY=your-google-maps-key
  ```

- [ ] **Step 5: Create jest.config.js**
  - File: `jest.config.js`
  ```js
  module.exports = {
    preset: 'jest-expo',
    setupFilesAfterSetup: ['@testing-library/jest-native/extend-expect'],
    transformIgnorePatterns: [
      'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
    ],
    moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1', '^@screens/(.*)$': '<rootDir>/screens/$1' }
  };
  ```

- [ ] **Step 6: Verify build**
  ```bash
  npx expo start --web  # Should launch without errors
  ```

- [ ] **Step 7: Commit**
  ```
  feat: scaffold EV Charge Egypt Expo 55 project with all dependencies
  ```

---

## Task 2: Supabase Database Schema

- [ ] **Step 1: Write migration file**
  - File: `supabase/migrations/001_initial_schema.sql`
  ```sql
  -- Enable extensions
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  -- User Profiles
  CREATE TABLE user_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('driver', 'fleet_manager', 'admin')),
    full_name text NOT NULL,
    phone text,
    avatar_url text,
    preferred_lang text DEFAULT 'ar',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  -- Fleets (must come before vehicles due to FK)
  CREATE TABLE fleets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid REFERENCES user_profiles(id) NOT NULL,
    company_name text NOT NULL,
    plan text DEFAULT 'starter' CHECK (plan IN ('starter', 'business', 'enterprise')),
    credit_balance numeric DEFAULT 0,
    auto_topup_threshold numeric,
    auto_topup_amount numeric,
    created_at timestamptz DEFAULT now()
  );

  -- Vehicles
  CREATE TABLE vehicles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES user_profiles(id) NOT NULL,
    fleet_id uuid REFERENCES fleets(id),
    make text NOT NULL,
    model text NOT NULL,
    year int,
    battery_capacity_kwh numeric NOT NULL,
    connector_types text[] NOT NULL,
    license_plate text,
    created_at timestamptz DEFAULT now()
  );

  -- Fleet Members
  CREATE TABLE fleet_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fleet_id uuid REFERENCES fleets(id) NOT NULL,
    user_id uuid REFERENCES user_profiles(id) NOT NULL,
    vehicle_id uuid REFERENCES vehicles(id),
    daily_limit numeric,
    weekly_limit numeric,
    is_active boolean DEFAULT true,
    UNIQUE (fleet_id, user_id)
  );

  -- Providers
  CREATE TABLE providers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    logo_url text,
    api_base_url text,
    api_key_encrypted text,
    adapter_type text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
  );

  -- Stations
  CREATE TABLE stations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid REFERENCES providers(id) NOT NULL,
    external_station_id text NOT NULL,
    name text NOT NULL,
    address text,
    latitude numeric NOT NULL,
    longitude numeric NOT NULL,
    city text,
    area text,
    amenities text[] DEFAULT '{}',
    photos text[] DEFAULT '{}',
    rating_avg numeric(2,1) DEFAULT 0,
    review_count int DEFAULT 0,
    is_active boolean DEFAULT true,
    last_synced_at timestamptz,
    created_at timestamptz DEFAULT now(),
    UNIQUE (provider_id, external_station_id)
  );

  -- Connectors
  CREATE TABLE connectors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id uuid REFERENCES stations(id) NOT NULL,
    external_connector_id text,
    type text NOT NULL CHECK (type IN ('CCS', 'CHAdeMO', 'Type2', 'GBT')),
    power_kw numeric NOT NULL,
    price_per_kwh numeric NOT NULL,
    currency text DEFAULT 'EGP',
    status text DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'booked', 'offline')),
    last_status_check timestamptz,
    UNIQUE (station_id, external_connector_id)
  );

  -- Bookings
  CREATE TABLE bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES user_profiles(id) NOT NULL,
    connector_id uuid REFERENCES connectors(id) NOT NULL,
    station_id uuid REFERENCES stations(id) NOT NULL,
    vehicle_id uuid REFERENCES vehicles(id),
    fleet_id uuid REFERENCES fleets(id),
    provider_booking_ref text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled', 'no_show')),
    scheduled_start timestamptz NOT NULL,
    scheduled_end timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
  );

  -- Charging Sessions
  CREATE TABLE charging_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid REFERENCES bookings(id),
    user_id uuid REFERENCES user_profiles(id) NOT NULL,
    connector_id uuid REFERENCES connectors(id) NOT NULL,
    start_time timestamptz NOT NULL,
    end_time timestamptz,
    kwh_delivered numeric DEFAULT 0,
    cost_provider numeric DEFAULT 0,
    cost_service_fee numeric DEFAULT 10,
    cost_total numeric DEFAULT 0,
    payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at timestamptz DEFAULT now()
  );

  -- Wallets
  CREATE TABLE wallets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES user_profiles(id),
    fleet_id uuid REFERENCES fleets(id),
    balance numeric DEFAULT 0,
    currency text DEFAULT 'EGP',
    CHECK (user_id IS NOT NULL OR fleet_id IS NOT NULL)
  );

  -- Transactions
  CREATE TABLE transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id uuid REFERENCES wallets(id) NOT NULL,
    type text NOT NULL CHECK (type IN ('topup', 'charge', 'subscription', 'refund', 'credit_bonus')),
    amount numeric NOT NULL,
    method text CHECK (method IN ('card', 'fawry', 'instapay', 'vodafone_cash', 'orange_cash', 'etisalat_cash', 'credits', 'system')),
    reference_id text,
    status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at timestamptz DEFAULT now()
  );

  -- Reviews
  CREATE TABLE reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES user_profiles(id) NOT NULL,
    station_id uuid REFERENCES stations(id) NOT NULL,
    rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment text,
    photos text[] DEFAULT '{}',
    ai_summary text,
    created_at timestamptz DEFAULT now()
  );

  -- Station Analytics
  CREATE TABLE station_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id uuid REFERENCES stations(id) NOT NULL,
    hour_of_day int NOT NULL CHECK (hour_of_day BETWEEN 0 AND 23),
    day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    avg_occupancy_pct numeric DEFAULT 0,
    avg_wait_min numeric DEFAULT 0,
    avg_session_min numeric DEFAULT 0,
    sample_count int DEFAULT 0,
    updated_at timestamptz DEFAULT now(),
    UNIQUE (station_id, hour_of_day, day_of_week)
  );

  -- AI Interactions
  CREATE TABLE ai_interactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES user_profiles(id),
    type text NOT NULL,
    input text,
    output text,
    model_used text,
    created_at timestamptz DEFAULT now()
  );

  -- Ads
  CREATE TABLE ads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_name text NOT NULL,
    placement text CHECK (placement IN ('charging_wait', 'post_charge', 'amenity', 'digest', 'ai_contextual')),
    title text NOT NULL,
    description text,
    image_url text,
    action_url text,
    target_area text,
    budget numeric,
    impressions int DEFAULT 0,
    clicks int DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
  );

  -- Notifications
  CREATE TABLE notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES user_profiles(id) NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    body text,
    data jsonb DEFAULT '{}',
    read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
  );

  -- Indexes
  CREATE INDEX idx_stations_location ON stations (latitude, longitude);
  CREATE INDEX idx_stations_provider ON stations (provider_id);
  CREATE INDEX idx_connectors_station ON connectors (station_id);
  CREATE INDEX idx_bookings_user ON bookings (user_id);
  CREATE INDEX idx_bookings_status ON bookings (status);
  CREATE INDEX idx_sessions_user ON charging_sessions (user_id);
  CREATE INDEX idx_transactions_wallet ON transactions (wallet_id);
  CREATE INDEX idx_notifications_user ON notifications (user_id, read);
  ```

- [ ] **Step 2: Write RLS policies**
  - File: `supabase/migrations/002_rls_policies.sql`
  ```sql
  -- Enable RLS on all tables
  ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE fleets ENABLE ROW LEVEL SECURITY;
  ALTER TABLE fleet_members ENABLE ROW LEVEL SECURITY;
  ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
  ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE connectors ENABLE ROW LEVEL SECURITY;
  ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
  ALTER TABLE charging_sessions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
  ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
  ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
  ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

  -- user_profiles: users can read/update their own profile
  CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
  CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
  CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

  -- vehicles: users see own vehicles
  CREATE POLICY "Users can view own vehicles" ON vehicles FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own vehicles" ON vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own vehicles" ON vehicles FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "Users can delete own vehicles" ON vehicles FOR DELETE USING (auth.uid() = user_id);

  -- providers: public read
  CREATE POLICY "Anyone can view providers" ON providers FOR SELECT USING (true);

  -- stations: public read
  CREATE POLICY "Anyone can view stations" ON stations FOR SELECT USING (true);

  -- connectors: public read
  CREATE POLICY "Anyone can view connectors" ON connectors FOR SELECT USING (true);

  -- bookings: users see own bookings
  CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own bookings" ON bookings FOR UPDATE USING (auth.uid() = user_id);

  -- charging_sessions: users see own sessions
  CREATE POLICY "Users can view own sessions" ON charging_sessions FOR SELECT USING (auth.uid() = user_id);

  -- wallets: users see own wallet
  CREATE POLICY "Users can view own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);

  -- transactions: users see own transactions via wallet
  CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT
    USING (wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid()));

  -- reviews: public read, users can create own
  CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
  CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

  -- notifications: users see own
  CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

  -- ads: public read
  CREATE POLICY "Anyone can view active ads" ON ads FOR SELECT USING (is_active = true);

  -- fleets: owner can manage
  CREATE POLICY "Fleet owners can view fleet" ON fleets FOR SELECT USING (auth.uid() = owner_id);
  CREATE POLICY "Fleet owners can update fleet" ON fleets FOR UPDATE USING (auth.uid() = owner_id);
  CREATE POLICY "Users can create fleets" ON fleets FOR INSERT WITH CHECK (auth.uid() = owner_id);

  -- fleet_members: fleet owner or member can view
  CREATE POLICY "Fleet members can view membership" ON fleet_members FOR SELECT
    USING (auth.uid() = user_id OR fleet_id IN (SELECT id FROM fleets WHERE owner_id = auth.uid()));
  ```

- [ ] **Step 3: Apply migration to Supabase**
  ```bash
  supabase db push
  ```

- [ ] **Step 4: Commit**
  ```
  feat: add complete database schema with 16 tables and RLS policies
  ```

---

## Task 3: Supabase Client Config

- [ ] **Step 1: Write test**
  - File: `__tests__/core/supabaseConfig.test.ts`
  ```typescript
  import { supabase } from '@/core/config/supabase';
  describe('Supabase client', () => {
    it('should export a valid client', () => {
      expect(supabase).toBeDefined();
      expect(supabase.auth).toBeDefined();
      expect(supabase.from).toBeDefined();
    });
  });
  ```

- [ ] **Step 2: Verify test fails**
  ```bash
  npx jest __tests__/core/supabaseConfig.test.ts
  ```

- [ ] **Step 3: Implement**
  - File: `src/core/config/supabase.ts`
  ```typescript
  import { createClient } from '@supabase/supabase-js';
  import * as SecureStore from 'expo-secure-store';
  import { Platform } from 'react-native';

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  const ExpoSecureStoreAdapter = {
    getItem: (key: string) => {
      if (Platform.OS === 'web') return localStorage.getItem(key);
      return SecureStore.getItemAsync(key);
    },
    setItem: (key: string, value: string) => {
      if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
      return SecureStore.setItemAsync(key, value);
    },
    removeItem: (key: string) => {
      if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
      return SecureStore.deleteItemAsync(key);
    },
  };

  export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  ```

- [ ] **Step 4: Verify test passes**
  ```bash
  npx jest __tests__/core/supabaseConfig.test.ts
  ```

- [ ] **Step 5: Commit**
  ```
  feat: configure Supabase client with secure storage adapter
  ```

---

## Task 4: Theme / Design System

- [ ] **Step 1: Implement colors**
  - File: `src/core/theme/colors.ts`
  ```typescript
  export const colors = {
    primary: '#10B981',
    primaryDark: '#064E3B',
    primaryLight: '#D1FAE5',
    accent: '#0D9488',
    background: '#F0FDF4',
    surface: '#FFFFFF',
    surfaceSecondary: '#F9FAFB',
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#3B82F6',
    statusAvailable: '#10B981',
    statusPartial: '#F59E0B',
    statusOccupied: '#EF4444',
    statusOffline: '#9CA3AF',
    white: '#FFFFFF',
    black: '#000000',
  } as const;
  ```

- [ ] **Step 2: Implement spacing**
  - File: `src/core/theme/spacing.ts`
  ```typescript
  export const spacing = {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
  } as const;

  export const borderRadius = {
    sm: 6, md: 12, lg: 16, xl: 24, full: 9999,
  } as const;
  ```

- [ ] **Step 3: Implement typography**
  - File: `src/core/theme/typography.ts`
  ```typescript
  import { Platform } from 'react-native';

  const fontFamily = Platform.OS === 'ios' ? 'System' : 'Roboto';

  export const typography = {
    h1: { fontFamily, fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
    h2: { fontFamily, fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
    h3: { fontFamily, fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
    body: { fontFamily, fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
    bodyBold: { fontFamily, fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
    caption: { fontFamily, fontSize: 14, fontWeight: '400' as const, lineHeight: 18 },
    small: { fontFamily, fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
    button: { fontFamily, fontSize: 16, fontWeight: '600' as const, lineHeight: 20 },
  } as const;
  ```

- [ ] **Step 4: Create theme index**
  - File: `src/core/theme/index.ts`
  ```typescript
  export { colors } from './colors';
  export { spacing, borderRadius } from './spacing';
  export { typography } from './typography';
  ```

- [ ] **Step 5: Commit**
  ```
  feat: add EV green theme with colors, spacing, and typography
  ```

---

## Task 5: Core Type Definitions

- [ ] **Step 1: Auth types**
  - File: `src/core/types/auth.ts`
  ```typescript
  export type UserRole = 'driver' | 'fleet_manager' | 'admin';

  export interface UserProfile {
    id: string;
    role: UserRole;
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    preferred_lang: 'ar' | 'en';
    created_at: string;
    updated_at: string;
  }

  export interface AuthState {
    user: UserProfile | null;
    session: any | null;
    isLoading: boolean;
    isAuthenticated: boolean;
  }
  ```

- [ ] **Step 2: Station types**
  - File: `src/core/types/station.ts`
  ```typescript
  export type ConnectorType = 'CCS' | 'CHAdeMO' | 'Type2' | 'GBT';
  export type ConnectorStatus = 'available' | 'occupied' | 'booked' | 'offline';
  export type StationStatus = 'available' | 'partial' | 'occupied' | 'offline';

  export interface Provider {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    is_active: boolean;
  }

  export interface Station {
    id: string;
    provider_id: string;
    provider?: Provider;
    external_station_id: string;
    name: string;
    address: string | null;
    latitude: number;
    longitude: number;
    city: string | null;
    area: string | null;
    amenities: string[];
    photos: string[];
    rating_avg: number;
    review_count: number;
    is_active: boolean;
    last_synced_at: string | null;
    connectors?: Connector[];
    status?: StationStatus;
    distance_km?: number;
  }

  export interface Connector {
    id: string;
    station_id: string;
    external_connector_id: string | null;
    type: ConnectorType;
    power_kw: number;
    price_per_kwh: number;
    currency: string;
    status: ConnectorStatus;
    last_status_check: string | null;
  }

  export interface Review {
    id: string;
    user_id: string;
    station_id: string;
    rating: number;
    comment: string | null;
    photos: string[];
    ai_summary: string | null;
    created_at: string;
    user?: { full_name: string; avatar_url: string | null };
  }
  ```

- [ ] **Step 3: Booking types**
  - File: `src/core/types/booking.ts`
  ```typescript
  export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'no_show';
  export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

  export interface Booking {
    id: string;
    user_id: string;
    connector_id: string;
    station_id: string;
    vehicle_id: string | null;
    fleet_id: string | null;
    provider_booking_ref: string | null;
    status: BookingStatus;
    scheduled_start: string;
    scheduled_end: string;
    created_at: string;
    station?: import('./station').Station;
    connector?: import('./station').Connector;
  }

  export interface ChargingSession {
    id: string;
    booking_id: string | null;
    user_id: string;
    connector_id: string;
    start_time: string;
    end_time: string | null;
    kwh_delivered: number;
    cost_provider: number;
    cost_service_fee: number;
    cost_total: number;
    payment_status: PaymentStatus;
    created_at: string;
  }
  ```

- [ ] **Step 4: Wallet types**
  - File: `src/core/types/wallet.ts`
  ```typescript
  export type TransactionType = 'topup' | 'charge' | 'subscription' | 'refund' | 'credit_bonus';
  export type PaymentMethod = 'card' | 'fawry' | 'instapay' | 'vodafone_cash' | 'orange_cash' | 'etisalat_cash' | 'credits' | 'system';

  export interface Wallet {
    id: string;
    user_id: string | null;
    fleet_id: string | null;
    balance: number;
    currency: string;
  }

  export interface Transaction {
    id: string;
    wallet_id: string;
    type: TransactionType;
    amount: number;
    method: PaymentMethod | null;
    reference_id: string | null;
    status: 'pending' | 'completed' | 'failed';
    created_at: string;
  }
  ```

- [ ] **Step 5: Fleet types**
  - File: `src/core/types/fleet.ts`
  ```typescript
  export type FleetPlan = 'starter' | 'business' | 'enterprise';

  export interface Fleet {
    id: string;
    owner_id: string;
    company_name: string;
    plan: FleetPlan;
    credit_balance: number;
    auto_topup_threshold: number | null;
    auto_topup_amount: number | null;
    created_at: string;
  }

  export interface FleetMember {
    id: string;
    fleet_id: string;
    user_id: string;
    vehicle_id: string | null;
    daily_limit: number | null;
    weekly_limit: number | null;
    is_active: boolean;
    user?: import('./auth').UserProfile;
    vehicle?: import('./station').Station;
  }

  export interface Vehicle {
    id: string;
    user_id: string;
    fleet_id: string | null;
    make: string;
    model: string;
    year: number | null;
    battery_capacity_kwh: number;
    connector_types: string[];
    license_plate: string | null;
    created_at: string;
  }
  ```

- [ ] **Step 6: Commit**
  ```
  feat: add TypeScript type definitions for all domain entities
  ```

---

## Task 6: Zustand Stores

- [ ] **Step 1: Write authStore test**
  - File: `__tests__/core/authStore.test.ts`
  ```typescript
  import { useAuthStore } from '@/core/stores/authStore';

  describe('authStore', () => {
    beforeEach(() => useAuthStore.getState().reset());

    it('should start with no user', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should set user on login', () => {
      useAuthStore.getState().setUser({ id: '1', role: 'driver', full_name: 'Test' } as any);
      expect(useAuthStore.getState().user?.full_name).toBe('Test');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('should clear user on logout', () => {
      useAuthStore.getState().setUser({ id: '1', role: 'driver', full_name: 'Test' } as any);
      useAuthStore.getState().clearUser();
      expect(useAuthStore.getState().user).toBeNull();
    });
  });
  ```

- [ ] **Step 2: Verify fails**
  ```bash
  npx jest __tests__/core/authStore.test.ts
  ```

- [ ] **Step 3: Implement authStore**
  - File: `src/core/stores/authStore.ts`
  ```typescript
  import { create } from 'zustand';
  import type { UserProfile } from '../types/auth';

  interface AuthStore {
    user: UserProfile | null;
    session: any | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    setUser: (user: UserProfile) => void;
    setSession: (session: any) => void;
    clearUser: () => void;
    setLoading: (loading: boolean) => void;
    reset: () => void;
  }

  const initialState = {
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  };

  export const useAuthStore = create<AuthStore>((set) => ({
    ...initialState,
    setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),
    setSession: (session) => set({ session }),
    clearUser: () => set({ user: null, session: null, isAuthenticated: false }),
    setLoading: (isLoading) => set({ isLoading }),
    reset: () => set(initialState),
  }));
  ```

- [ ] **Step 4: Implement uiStore**
  - File: `src/core/stores/uiStore.ts`
  ```typescript
  import { create } from 'zustand';

  interface UIStore {
    isFilterModalVisible: boolean;
    isNotificationsVisible: boolean;
    selectedProviderId: string | null;
    mapRegion: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } | null;
    toggleFilterModal: () => void;
    toggleNotifications: () => void;
    setSelectedProvider: (id: string | null) => void;
    setMapRegion: (region: UIStore['mapRegion']) => void;
  }

  export const useUIStore = create<UIStore>((set) => ({
    isFilterModalVisible: false,
    isNotificationsVisible: false,
    selectedProviderId: null,
    mapRegion: null,
    toggleFilterModal: () => set((s) => ({ isFilterModalVisible: !s.isFilterModalVisible })),
    toggleNotifications: () => set((s) => ({ isNotificationsVisible: !s.isNotificationsVisible })),
    setSelectedProvider: (id) => set({ selectedProviderId: id }),
    setMapRegion: (mapRegion) => set({ mapRegion }),
  }));
  ```

- [ ] **Step 5: Implement bookingStore**
  - File: `src/core/stores/bookingStore.ts`
  ```typescript
  import { create } from 'zustand';
  import type { Booking, ChargingSession } from '../types/booking';
  import type { Connector, Station } from '../types/station';

  interface BookingStore {
    selectedStation: Station | null;
    selectedConnector: Connector | null;
    activeBooking: Booking | null;
    activeSession: ChargingSession | null;
    setSelectedStation: (station: Station | null) => void;
    setSelectedConnector: (connector: Connector | null) => void;
    setActiveBooking: (booking: Booking | null) => void;
    setActiveSession: (session: ChargingSession | null) => void;
    reset: () => void;
  }

  export const useBookingStore = create<BookingStore>((set) => ({
    selectedStation: null,
    selectedConnector: null,
    activeBooking: null,
    activeSession: null,
    setSelectedStation: (selectedStation) => set({ selectedStation }),
    setSelectedConnector: (selectedConnector) => set({ selectedConnector }),
    setActiveBooking: (activeBooking) => set({ activeBooking }),
    setActiveSession: (activeSession) => set({ activeSession }),
    reset: () => set({ selectedStation: null, selectedConnector: null, activeBooking: null, activeSession: null }),
  }));
  ```

- [ ] **Step 6: Verify tests pass**
  ```bash
  npx jest __tests__/core/authStore.test.ts
  ```

- [ ] **Step 7: Commit**
  ```
  feat: add Zustand stores for auth, UI, and booking state
  ```

---

## Task 7: React Query Client

- [ ] **Step 1: Implement query client**
  - File: `src/core/queries/queryClient.ts`
  ```typescript
  import { QueryClient } from '@tanstack/react-query';

  export const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
        retry: 2,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 1,
      },
    },
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: configure React Query client with EV app defaults
  ```

---

## Task 8: Auth Service

- [ ] **Step 1: Write test**
  - File: `__tests__/core/authService.test.ts`
  ```typescript
  import { authService } from '@/core/auth/authService';

  jest.mock('@/core/config/supabase', () => ({
    supabase: {
      auth: {
        signUp: jest.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null }),
        signInWithPassword: jest.fn().mockResolvedValue({ data: { user: { id: '1' }, session: {} }, error: null }),
        signOut: jest.fn().mockResolvedValue({ error: null }),
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
      },
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: '1', role: 'driver' }, error: null }) }) }),
        select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: '1', role: 'driver' }, error: null }) }) }),
      }),
    },
  }));

  describe('authService', () => {
    it('should have signUp method', () => expect(authService.signUp).toBeDefined());
    it('should have signIn method', () => expect(authService.signIn).toBeDefined());
    it('should have signOut method', () => expect(authService.signOut).toBeDefined());
  });
  ```

- [ ] **Step 2: Verify fails**
  ```bash
  npx jest __tests__/core/authService.test.ts
  ```

- [ ] **Step 3: Implement authService**
  - File: `src/core/auth/authService.ts`
  ```typescript
  import { supabase } from '../config/supabase';
  import type { UserProfile, UserRole } from '../types/auth';

  export const authService = {
    async signUp(email: string, password: string, fullName: string, role: UserRole): Promise<UserProfile> {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Sign up failed');

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .insert({ id: authData.user.id, role, full_name: fullName })
        .select()
        .single();
      if (profileError) throw profileError;
      return profile;
    },

    async signIn(email: string, password: string): Promise<{ profile: UserProfile; session: any }> {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      if (profileError) throw profileError;
      return { profile, session: data.session };
    },

    async signOut(): Promise<void> {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },

    async getProfile(userId: string): Promise<UserProfile | null> {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) return null;
      return data;
    },

    async getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },

    onAuthStateChange(callback: (event: string, session: any) => void) {
      return supabase.auth.onAuthStateChange(callback);
    },
  };
  ```

- [ ] **Step 4: Implement useAuth hook**
  - File: `src/core/auth/useAuth.ts`
  ```typescript
  import { useCallback } from 'react';
  import { useAuthStore } from '../stores/authStore';
  import { authService } from './authService';
  import type { UserRole } from '../types/auth';

  export function useAuth() {
    const { user, isAuthenticated, isLoading, setUser, setSession, clearUser, setLoading } = useAuthStore();

    const signUp = useCallback(async (email: string, password: string, fullName: string, role: UserRole) => {
      setLoading(true);
      try {
        const profile = await authService.signUp(email, password, fullName, role);
        setUser(profile);
        return profile;
      } finally {
        setLoading(false);
      }
    }, [setUser, setLoading]);

    const signIn = useCallback(async (email: string, password: string) => {
      setLoading(true);
      try {
        const { profile, session } = await authService.signIn(email, password);
        setUser(profile);
        setSession(session);
        return profile;
      } finally {
        setLoading(false);
      }
    }, [setUser, setSession, setLoading]);

    const signOut = useCallback(async () => {
      await authService.signOut();
      clearUser();
    }, [clearUser]);

    return { user, isAuthenticated, isLoading, signUp, signIn, signOut };
  }
  ```

- [ ] **Step 5: Implement AuthProvider**
  - File: `src/core/auth/AuthProvider.tsx`
  ```typescript
  import React, { useEffect } from 'react';
  import { useAuthStore } from '../stores/authStore';
  import { authService } from './authService';

  export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setSession, clearUser, setLoading } = useAuthStore();

    useEffect(() => {
      authService.getSession().then(async (session) => {
        if (session?.user) {
          const profile = await authService.getProfile(session.user.id);
          if (profile) { setUser(profile); setSession(session); }
          else clearUser();
        } else { clearUser(); }
        setLoading(false);
      });

      const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await authService.getProfile(session.user.id);
          if (profile) { setUser(profile); setSession(session); }
        } else if (event === 'SIGNED_OUT') { clearUser(); }
      });

      return () => subscription.unsubscribe();
    }, []);

    return <>{children}</>;
  }
  ```

- [ ] **Step 6: Verify tests pass**
  ```bash
  npx jest __tests__/core/authService.test.ts
  ```

- [ ] **Step 7: Commit**
  ```
  feat: implement auth service, useAuth hook, and AuthProvider
  ```

---

## Task 9: Core UI Components

- [ ] **Step 1: Write Button test**
  - File: `__tests__/core/Button.test.tsx`
  ```typescript
  import React from 'react';
  import { render, fireEvent } from '@testing-library/react-native';
  import { Button } from '@/core/components/Button';

  describe('Button', () => {
    it('renders title', () => {
      const { getByText } = render(<Button title="Charge Now" onPress={() => {}} />);
      expect(getByText('Charge Now')).toBeTruthy();
    });
    it('calls onPress', () => {
      const onPress = jest.fn();
      const { getByText } = render(<Button title="Tap" onPress={onPress} />);
      fireEvent.press(getByText('Tap'));
      expect(onPress).toHaveBeenCalled();
    });
    it('disables when loading', () => {
      const onPress = jest.fn();
      const { getByText } = render(<Button title="Wait" onPress={onPress} loading />);
      fireEvent.press(getByText('Wait'));
      expect(onPress).not.toHaveBeenCalled();
    });
  });
  ```

- [ ] **Step 2: Verify fails**

- [ ] **Step 3: Implement Button**
  - File: `src/core/components/Button.tsx`
  ```typescript
  import React from 'react';
  import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
  import { colors } from '../theme/colors';
  import { spacing, borderRadius } from '../theme/spacing';
  import { typography } from '../theme/typography';

  interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
  }

  export function Button({ title, onPress, variant = 'primary', size = 'md', loading, disabled, style, textStyle }: ButtonProps) {
    const isDisabled = disabled || loading;

    const containerStyles = [
      styles.base,
      styles[`container_${variant}`],
      styles[`size_${size}`],
      isDisabled && styles.disabled,
      style,
    ];

    const textStyles = [
      styles.text,
      styles[`text_${variant}`],
      styles[`textSize_${size}`],
      textStyle,
    ];

    return (
      <TouchableOpacity style={containerStyles} onPress={onPress} disabled={isDisabled} activeOpacity={0.7}>
        {loading ? <ActivityIndicator color={variant === 'primary' ? colors.white : colors.primary} /> : null}
        <Text style={textStyles}>{title}</Text>
      </TouchableOpacity>
    );
  }

  const styles = StyleSheet.create({
    base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
    container_primary: { backgroundColor: colors.primary, borderRadius: borderRadius.md },
    container_secondary: { backgroundColor: colors.primaryLight, borderRadius: borderRadius.md },
    container_outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary, borderRadius: borderRadius.md },
    container_ghost: { backgroundColor: 'transparent' },
    size_sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    size_md: { paddingVertical: spacing.md - 2, paddingHorizontal: spacing.lg },
    size_lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
    disabled: { opacity: 0.5 },
    text: { ...typography.button },
    text_primary: { color: colors.white },
    text_secondary: { color: colors.primaryDark },
    text_outline: { color: colors.primary },
    text_ghost: { color: colors.primary },
    textSize_sm: { fontSize: 14 },
    textSize_md: { fontSize: 16 },
    textSize_lg: { fontSize: 18 },
  });
  ```

- [ ] **Step 4: Implement Card**
  - File: `src/core/components/Card.tsx`
  ```typescript
  import React from 'react';
  import { View, StyleSheet, ViewStyle } from 'react-native';
  import { colors } from '../theme/colors';
  import { spacing, borderRadius } from '../theme/spacing';

  interface CardProps { children: React.ReactNode; style?: ViewStyle; variant?: 'elevated' | 'outlined' | 'flat'; }

  export function Card({ children, style, variant = 'elevated' }: CardProps) {
    return <View style={[styles.base, styles[variant], style]}>{children}</View>;
  }

  const styles = StyleSheet.create({
    base: { borderRadius: borderRadius.lg, padding: spacing.md, backgroundColor: colors.surface },
    elevated: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    outlined: { borderWidth: 1, borderColor: colors.border },
    flat: {},
  });
  ```

- [ ] **Step 5: Implement Header, Badge, Avatar, LoadingScreen**
  - File: `src/core/components/Header.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
  import { colors } from '../theme/colors';
  import { spacing } from '../theme/spacing';
  import { typography } from '../theme/typography';

  interface HeaderProps { title: string; onBack?: () => void; rightAction?: React.ReactNode; }

  export function Header({ title, onBack, rightAction }: HeaderProps) {
    return (
      <View style={styles.container}>
        {onBack ? <TouchableOpacity onPress={onBack} style={styles.backButton}><Text style={styles.backText}>{'<'}</Text></TouchableOpacity> : <View style={styles.placeholder} />}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {rightAction || <View style={styles.placeholder} />}
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    title: { ...typography.h3, color: colors.text, flex: 1, textAlign: 'center' },
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    backText: { fontSize: 24, color: colors.primary },
    placeholder: { width: 40 },
  });
  ```

  - File: `src/core/components/Badge.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, StyleSheet } from 'react-native';
  import { colors } from '../theme/colors';
  import { borderRadius, spacing } from '../theme/spacing';

  interface BadgeProps { label: string; color?: string; backgroundColor?: string; }

  export function Badge({ label, color = colors.white, backgroundColor = colors.primary }: BadgeProps) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <Text style={[styles.text, { color }]}>{label}</Text>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full, alignSelf: 'flex-start' },
    text: { fontSize: 12, fontWeight: '600' },
  });
  ```

  - File: `src/core/components/Avatar.tsx`
  ```typescript
  import React from 'react';
  import { View, Image, Text, StyleSheet } from 'react-native';
  import { colors } from '../theme/colors';

  interface AvatarProps { uri?: string | null; name: string; size?: number; }

  export function Avatar({ uri, name, size = 40 }: AvatarProps) {
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    if (uri) return <Image source={{ uri }} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} />;
    return (
      <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
      </View>
    );
  }

  const styles = StyleSheet.create({
    image: { backgroundColor: colors.surfaceSecondary },
    fallback: { backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
    initials: { color: colors.primaryDark, fontWeight: '700' },
  });
  ```

  - File: `src/core/components/LoadingScreen.tsx`
  ```typescript
  import React from 'react';
  import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
  import { colors } from '../theme/colors';
  import { typography } from '../theme/typography';

  export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.text}>{message}</Text>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    text: { ...typography.body, color: colors.textSecondary, marginTop: 16 },
  });
  ```

  - File: `src/core/components/index.ts`
  ```typescript
  export { Button } from './Button';
  export { Card } from './Card';
  export { Header } from './Header';
  export { Badge } from './Badge';
  export { Avatar } from './Avatar';
  export { LoadingScreen } from './LoadingScreen';
  ```

- [ ] **Step 6: Verify tests pass**
  ```bash
  npx jest __tests__/core/Button.test.tsx
  ```

- [ ] **Step 7: Commit**
  ```
  feat: add core UI components — Button, Card, Header, Badge, Avatar, LoadingScreen
  ```

---

## Task 10: Auth Screens

- [ ] **Step 1: WelcomeScreen**
  - File: `screens/auth/WelcomeScreen.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, StyleSheet, Image } from 'react-native';
  import { Button } from '@/core/components';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function WelcomeScreen({ navigation }: any) {
    return (
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.title}>EV Charge Egypt</Text>
          <Text style={styles.subtitle}>Find, book & charge across all Egyptian EV providers. One app for everything.</Text>
        </View>
        <View style={styles.actions}>
          <Button title="Get Started" onPress={() => navigation.navigate('Register')} size="lg" />
          <Button title="I already have an account" onPress={() => navigation.navigate('Login')} variant="ghost" />
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, justifyContent: 'space-between', padding: spacing.xl },
    hero: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { ...typography.h1, color: colors.primaryDark, fontSize: 32, textAlign: 'center' },
    subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md, maxWidth: 300 },
    actions: { gap: spacing.sm, paddingBottom: spacing.xl },
  });
  ```

- [ ] **Step 2: LoginScreen**
  - File: `screens/auth/LoginScreen.tsx`
  ```typescript
  import React, { useState } from 'react';
  import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
  import { Button, Header } from '@/core/components';
  import { useAuth } from '@/core/auth/useAuth';
  import { colors } from '@/core/theme/colors';
  import { spacing, borderRadius } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { signIn, isLoading } = useAuth();

    const handleLogin = async () => {
      if (!email || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
      try { await signIn(email, password); }
      catch (e: any) { Alert.alert('Login Failed', e.message); }
    };

    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Header title="Sign In" onBack={() => navigation.goBack()} />
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="your@email.com" placeholderTextColor={colors.textTertiary} />
          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Enter password" placeholderTextColor={colors.textTertiary} />
          <Button title="Sign In" onPress={handleLogin} loading={isLoading} size="lg" style={{ marginTop: spacing.lg }} />
        </View>
      </KeyboardAvoidingView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    form: { flex: 1, padding: spacing.xl },
    label: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md },
    input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, ...typography.body, color: colors.text },
  });
  ```

- [ ] **Step 3: RegisterScreen with role selection**
  - File: `screens/auth/RegisterScreen.tsx`
  ```typescript
  import React, { useState } from 'react';
  import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
  import { Button, Header, Card } from '@/core/components';
  import { useAuth } from '@/core/auth/useAuth';
  import { colors } from '@/core/theme/colors';
  import { spacing, borderRadius } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';
  import type { UserRole } from '@/core/types/auth';

  export function RegisterScreen({ navigation }: any) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('driver');
    const { signUp, isLoading } = useAuth();

    const handleRegister = async () => {
      if (!fullName || !email || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
      try { await signUp(email, password, fullName, role); }
      catch (e: any) { Alert.alert('Registration Failed', e.message); }
    };

    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Header title="Create Account" onBack={() => navigation.goBack()} />
        <ScrollView style={styles.form} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={styles.sectionTitle}>I am a...</Text>
          <View style={styles.roleRow}>
            {(['driver', 'fleet_manager'] as UserRole[]).map((r) => (
              <TouchableOpacity key={r} onPress={() => setRole(r)} style={[styles.roleCard, role === r && styles.roleCardActive]}>
                <Text style={[styles.roleIcon]}>{r === 'driver' ? '🚗' : '🏢'}</Text>
                <Text style={[styles.roleLabel, role === r && styles.roleLabelActive]}>{r === 'driver' ? 'Driver' : 'Fleet Manager'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Ahmed Hassan" placeholderTextColor={colors.textTertiary} />
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="your@email.com" placeholderTextColor={colors.textTertiary} />
          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Min 8 characters" placeholderTextColor={colors.textTertiary} />
          <Button title="Create Account" onPress={handleRegister} loading={isLoading} size="lg" style={{ marginTop: spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    form: { flex: 1, padding: spacing.xl },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    roleRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
    roleCard: { flex: 1, alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface },
    roleCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    roleIcon: { fontSize: 32, marginBottom: spacing.sm },
    roleLabel: { ...typography.bodyBold, color: colors.textSecondary },
    roleLabelActive: { color: colors.primaryDark },
    label: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md },
    input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, ...typography.body, color: colors.text },
  });
  ```

- [ ] **Step 4: Commit**
  ```
  feat: add Welcome, Login, and Register screens with role selection
  ```

---

## Task 11: Navigation

- [ ] **Step 1: AuthNavigator**
  - File: `src/navigation/AuthNavigator.tsx`
  ```typescript
  import React from 'react';
  import { createNativeStackNavigator } from '@react-navigation/native-stack';
  import { WelcomeScreen } from '@screens/auth/WelcomeScreen';
  import { LoginScreen } from '@screens/auth/LoginScreen';
  import { RegisterScreen } from '@screens/auth/RegisterScreen';

  const Stack = createNativeStackNavigator();

  export function AuthNavigator() {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    );
  }
  ```

- [ ] **Step 2: DriverNavigator (placeholder tabs)**
  - File: `src/navigation/DriverNavigator.tsx`
  ```typescript
  import React from 'react';
  import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
  import { View, Text } from 'react-native';
  import { colors } from '@/core/theme/colors';

  const Tab = createBottomTabNavigator();

  const Placeholder = ({ name }: { name: string }) => (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <Text style={{ fontSize: 18, color: colors.textSecondary }}>{name} — Coming Soon</Text>
    </View>
  );

  const MapTab = () => <Placeholder name="Map" />;
  const BookingsTab = () => <Placeholder name="Bookings" />;
  const AITab = () => <Placeholder name="AI Assistant" />;
  const WalletTab = () => <Placeholder name="Wallet" />;
  const ProfileTab = () => <Placeholder name="Profile" />;

  export function DriverNavigator() {
    return (
      <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.textTertiary, tabBarStyle: { borderTopColor: colors.border } }}>
        <Tab.Screen name="MapTab" component={MapTab} options={{ tabBarLabel: 'Map' }} />
        <Tab.Screen name="BookingsTab" component={BookingsTab} options={{ tabBarLabel: 'Bookings' }} />
        <Tab.Screen name="AITab" component={AITab} options={{ tabBarLabel: 'AI' }} />
        <Tab.Screen name="WalletTab" component={WalletTab} options={{ tabBarLabel: 'Wallet' }} />
        <Tab.Screen name="ProfileTab" component={ProfileTab} options={{ tabBarLabel: 'Profile' }} />
      </Tab.Navigator>
    );
  }
  ```

- [ ] **Step 3: FleetNavigator (placeholder tabs)**
  - File: `src/navigation/FleetNavigator.tsx`
  ```typescript
  import React from 'react';
  import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
  import { View, Text } from 'react-native';
  import { colors } from '@/core/theme/colors';

  const Tab = createBottomTabNavigator();

  const Placeholder = ({ name }: { name: string }) => (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <Text style={{ fontSize: 18, color: colors.textSecondary }}>{name} — Coming Soon</Text>
    </View>
  );

  export function FleetNavigator() {
    return (
      <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary }}>
        <Tab.Screen name="Dashboard" component={() => <Placeholder name="Fleet Dashboard" />} />
        <Tab.Screen name="Vehicles" component={() => <Placeholder name="Vehicles" />} />
        <Tab.Screen name="Schedule" component={() => <Placeholder name="Schedule" />} />
        <Tab.Screen name="Reports" component={() => <Placeholder name="Reports" />} />
        <Tab.Screen name="Settings" component={() => <Placeholder name="Fleet Settings" />} />
      </Tab.Navigator>
    );
  }
  ```

- [ ] **Step 4: RootNavigator**
  - File: `src/navigation/RootNavigator.tsx`
  ```typescript
  import React from 'react';
  import { NavigationContainer } from '@react-navigation/native';
  import { useAuthStore } from '@/core/stores/authStore';
  import { LoadingScreen } from '@/core/components';
  import { AuthNavigator } from './AuthNavigator';
  import { DriverNavigator } from './DriverNavigator';
  import { FleetNavigator } from './FleetNavigator';

  export function RootNavigator() {
    const { isAuthenticated, isLoading, user } = useAuthStore();

    if (isLoading) return <LoadingScreen message="Starting EV Charge Egypt..." />;

    return (
      <NavigationContainer>
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

- [ ] **Step 5: Commit**
  ```
  feat: add navigation structure — Root, Auth, Driver, Fleet navigators
  ```

---

## Task 12: Provider Adapter Base

- [ ] **Step 1: Write MockAdapter test**
  - File: `__tests__/core/MockAdapter.test.ts`
  ```typescript
  import { MockAdapter } from '@/core/providers/MockAdapter';

  describe('MockAdapter', () => {
    const adapter = new MockAdapter();

    it('returns stations', async () => {
      const stations = await adapter.getStations();
      expect(stations.length).toBeGreaterThan(0);
      expect(stations[0]).toHaveProperty('name');
      expect(stations[0]).toHaveProperty('latitude');
    });

    it('returns availability for a station', async () => {
      const stations = await adapter.getStations();
      const availability = await adapter.getAvailability(stations[0].id);
      expect(availability.length).toBeGreaterThan(0);
      expect(availability[0]).toHaveProperty('status');
    });

    it('creates a booking', async () => {
      const booking = await adapter.createBooking('station-1', 'user-1', { start: new Date().toISOString(), end: new Date().toISOString() });
      expect(booking).toHaveProperty('id');
      expect(booking.status).toBe('confirmed');
    });
  });
  ```

- [ ] **Step 2: Verify fails**

- [ ] **Step 3: Implement provider types**
  - File: `src/core/providers/types.ts`
  ```typescript
  import type { Station, Connector } from '../types/station';

  export interface TimeSlot { start: string; end: string; }
  export interface ProviderBooking { id: string; providerRef: string; status: string; stationId: string; connectorId: string; }
  export interface ProviderSession { id: string; providerRef: string; kwhDelivered: number; costProvider: number; }
  export interface ProviderPrice { pricePerKwh: number; currency: string; connectorType: string; }

  export interface IProviderAdapter {
    readonly providerId: string;
    readonly providerName: string;
    getStations(): Promise<Station[]>;
    getAvailability(stationId: string): Promise<Connector[]>;
    createBooking(stationId: string, userId: string, timeSlot: TimeSlot): Promise<ProviderBooking>;
    cancelBooking(bookingId: string): Promise<void>;
    startCharging(bookingId: string): Promise<ProviderSession>;
    stopCharging(sessionId: string): Promise<ProviderSession>;
    getPrice(stationId: string, connectorType: string): Promise<ProviderPrice>;
  }
  ```

- [ ] **Step 4: Implement abstract ProviderAdapter**
  - File: `src/core/providers/ProviderAdapter.ts`
  ```typescript
  import type { IProviderAdapter, TimeSlot, ProviderBooking, ProviderSession, ProviderPrice } from './types';
  import type { Station, Connector } from '../types/station';

  export abstract class ProviderAdapter implements IProviderAdapter {
    abstract readonly providerId: string;
    abstract readonly providerName: string;
    abstract getStations(): Promise<Station[]>;
    abstract getAvailability(stationId: string): Promise<Connector[]>;
    abstract createBooking(stationId: string, userId: string, timeSlot: TimeSlot): Promise<ProviderBooking>;
    abstract cancelBooking(bookingId: string): Promise<void>;
    abstract startCharging(bookingId: string): Promise<ProviderSession>;
    abstract stopCharging(sessionId: string): Promise<ProviderSession>;
    abstract getPrice(stationId: string, connectorType: string): Promise<ProviderPrice>;
  }
  ```

- [ ] **Step 5: Implement MockAdapter with Cairo seed data**
  - File: `src/core/providers/MockAdapter.ts`
  ```typescript
  import { ProviderAdapter } from './ProviderAdapter';
  import type { TimeSlot, ProviderBooking, ProviderSession, ProviderPrice } from './types';
  import type { Station, Connector } from '../types/station';

  const MOCK_STATIONS: Station[] = [
    { id: 'ikarus-1', provider_id: 'ikarus', external_station_id: 'IK-001', name: 'IKARUS Maadi', address: 'Road 9, Maadi, Cairo', latitude: 29.9602, longitude: 31.2569, city: 'Cairo', area: 'Maadi', amenities: ['wifi', 'restaurant', 'shade'], photos: [], rating_avg: 4.5, review_count: 23, is_active: true, last_synced_at: null },
    { id: 'ikarus-2', provider_id: 'ikarus', external_station_id: 'IK-002', name: 'IKARUS New Cairo', address: '5th Settlement, New Cairo', latitude: 30.0131, longitude: 31.4089, city: 'Cairo', area: 'New Cairo', amenities: ['wifi', 'mall', 'bathroom'], photos: [], rating_avg: 4.2, review_count: 15, is_active: true, last_synced_at: null },
    { id: 'sha7en-1', provider_id: 'sha7en', external_station_id: 'SH-001', name: 'Sha7en Heliopolis', address: 'Merghani St, Heliopolis', latitude: 30.0876, longitude: 31.3225, city: 'Cairo', area: 'Heliopolis', amenities: ['bathroom', 'shade'], photos: [], rating_avg: 3.8, review_count: 8, is_active: true, last_synced_at: null },
    { id: 'sha7en-2', provider_id: 'sha7en', external_station_id: 'SH-002', name: 'Sha7en Zamalek', address: '26 July St, Zamalek', latitude: 30.0651, longitude: 31.2194, city: 'Cairo', area: 'Zamalek', amenities: ['restaurant', 'wifi'], photos: [], rating_avg: 4.0, review_count: 12, is_active: true, last_synced_at: null },
    { id: 'elsewedy-1', provider_id: 'elsewedy', external_station_id: 'EP-001', name: 'Elsewedy Plug 6th October', address: 'Mall of Arabia, 6th October', latitude: 29.9727, longitude: 30.9432, city: 'Cairo', area: '6th October', amenities: ['mall', 'restaurant', 'wifi', 'bathroom'], photos: [], rating_avg: 4.7, review_count: 45, is_active: true, last_synced_at: null },
    { id: 'elsewedy-2', provider_id: 'elsewedy', external_station_id: 'EP-002', name: 'Elsewedy Plug Nasr City', address: 'City Stars, Nasr City', latitude: 30.0729, longitude: 31.3452, city: 'Cairo', area: 'Nasr City', amenities: ['mall', 'restaurant', 'wifi', 'bathroom', 'shade'], photos: [], rating_avg: 4.6, review_count: 38, is_active: true, last_synced_at: null },
    { id: 'kilowatt-1', provider_id: 'kilowatt', external_station_id: 'KW-001', name: 'Kilowatt EV Downtown', address: 'Tahrir Square, Downtown', latitude: 30.0444, longitude: 31.2357, city: 'Cairo', area: 'Downtown', amenities: ['shade'], photos: [], rating_avg: 3.5, review_count: 5, is_active: true, last_synced_at: null },
    { id: 'kilowatt-2', provider_id: 'kilowatt', external_station_id: 'KW-002', name: 'Kilowatt EV Sheikh Zayed', address: 'Hyper One, Sheikh Zayed', latitude: 30.0313, longitude: 30.9757, city: 'Cairo', area: 'Sheikh Zayed', amenities: ['mall', 'restaurant'], photos: [], rating_avg: 4.1, review_count: 10, is_active: true, last_synced_at: null },
    { id: 'newenergy-1', provider_id: 'newenergy', external_station_id: 'NE-001', name: 'New Energy Mohandessin', address: 'Gameat El Dowal, Mohandessin', latitude: 30.0554, longitude: 31.2005, city: 'Cairo', area: 'Mohandessin', amenities: ['restaurant', 'wifi'], photos: [], rating_avg: 3.9, review_count: 7, is_active: true, last_synced_at: null },
    { id: 'newenergy-2', provider_id: 'newenergy', external_station_id: 'NE-002', name: 'New Energy Ain Sokhna Rd', address: 'Ain Sokhna Road, Km 45', latitude: 30.0027, longitude: 31.5877, city: 'Cairo', area: 'Ain Sokhna Road', amenities: ['bathroom', 'shade', 'restaurant'], photos: [], rating_avg: 4.3, review_count: 19, is_active: true, last_synced_at: null },
  ];

  const MOCK_CONNECTORS: Record<string, Connector[]> = {};
  MOCK_STATIONS.forEach((s) => {
    MOCK_CONNECTORS[s.id] = [
      { id: `${s.id}-ccs`, station_id: s.id, external_connector_id: 'CCS-1', type: 'CCS', power_kw: 60, price_per_kwh: 0.05, currency: 'EGP', status: 'available', last_status_check: null },
      { id: `${s.id}-type2`, station_id: s.id, external_connector_id: 'T2-1', type: 'Type2', power_kw: 22, price_per_kwh: 0.04, currency: 'EGP', status: 'available', last_status_check: null },
    ];
  });

  export class MockAdapter extends ProviderAdapter {
    readonly providerId = 'mock';
    readonly providerName = 'Mock Provider';

    async getStations(): Promise<Station[]> { return MOCK_STATIONS; }

    async getAvailability(stationId: string): Promise<Connector[]> {
      return MOCK_CONNECTORS[stationId] || [];
    }

    async createBooking(stationId: string, userId: string, timeSlot: TimeSlot): Promise<ProviderBooking> {
      return { id: `booking-${Date.now()}`, providerRef: `MOCK-${Date.now()}`, status: 'confirmed', stationId, connectorId: `${stationId}-ccs` };
    }

    async cancelBooking(bookingId: string): Promise<void> {}

    async startCharging(bookingId: string): Promise<ProviderSession> {
      return { id: `session-${Date.now()}`, providerRef: `MOCK-S-${Date.now()}`, kwhDelivered: 0, costProvider: 0 };
    }

    async stopCharging(sessionId: string): Promise<ProviderSession> {
      return { id: sessionId, providerRef: `MOCK-S-${Date.now()}`, kwhDelivered: 25.5, costProvider: 1.275 };
    }

    async getPrice(stationId: string, connectorType: string): Promise<ProviderPrice> {
      return { pricePerKwh: connectorType === 'CCS' ? 0.05 : 0.04, currency: 'EGP', connectorType };
    }
  }
  ```

- [ ] **Step 6: Provider index**
  - File: `src/core/providers/index.ts`
  ```typescript
  export { MockAdapter } from './MockAdapter';
  export { ProviderAdapter } from './ProviderAdapter';
  export type { IProviderAdapter, TimeSlot, ProviderBooking, ProviderSession, ProviderPrice } from './types';
  ```

- [ ] **Step 7: Verify tests pass**
  ```bash
  npx jest __tests__/core/MockAdapter.test.ts
  ```

- [ ] **Step 8: Commit**
  ```
  feat: add provider adapter pattern with MockAdapter and 10 Cairo seed stations
  ```

---

## Task 13: Seed Data Migration

- [ ] **Step 1: Create seed migration**
  - File: `supabase/migrations/003_seed_data.sql`
  ```sql
  -- 5 Providers
  INSERT INTO providers (id, name, slug, adapter_type, is_active) VALUES
    ('11111111-0000-0000-0000-000000000001', 'IKARUS', 'ikarus', 'ikarus', true),
    ('11111111-0000-0000-0000-000000000002', 'Sha7en', 'sha7en', 'sha7en', true),
    ('11111111-0000-0000-0000-000000000003', 'Elsewedy Plug', 'elsewedy', 'elsewedy', true),
    ('11111111-0000-0000-0000-000000000004', 'Kilowatt EV', 'kilowatt', 'kilowatt', true),
    ('11111111-0000-0000-0000-000000000005', 'New Energy', 'newenergy', 'newenergy', true);

  -- 20 Stations across Cairo
  INSERT INTO stations (provider_id, external_station_id, name, address, latitude, longitude, city, area, amenities) VALUES
    ('11111111-0000-0000-0000-000000000001', 'IK-001', 'IKARUS Maadi', 'Road 9, Maadi', 29.9602, 31.2569, 'Cairo', 'Maadi', ARRAY['wifi','restaurant','shade']),
    ('11111111-0000-0000-0000-000000000001', 'IK-002', 'IKARUS New Cairo', '5th Settlement', 30.0131, 31.4089, 'Cairo', 'New Cairo', ARRAY['wifi','mall','bathroom']),
    ('11111111-0000-0000-0000-000000000001', 'IK-003', 'IKARUS Helwan', 'Helwan Corniche', 29.8420, 31.3340, 'Cairo', 'Helwan', ARRAY['shade']),
    ('11111111-0000-0000-0000-000000000001', 'IK-004', 'IKARUS Katameya', 'Ring Road, Katameya', 30.0200, 31.3800, 'Cairo', 'Katameya', ARRAY['restaurant','bathroom']),
    ('11111111-0000-0000-0000-000000000002', 'SH-001', 'Sha7en Heliopolis', 'Merghani St', 30.0876, 31.3225, 'Cairo', 'Heliopolis', ARRAY['bathroom','shade']),
    ('11111111-0000-0000-0000-000000000002', 'SH-002', 'Sha7en Zamalek', '26 July St', 30.0651, 31.2194, 'Cairo', 'Zamalek', ARRAY['restaurant','wifi']),
    ('11111111-0000-0000-0000-000000000002', 'SH-003', 'Sha7en Dokki', 'Mossadak St', 30.0380, 31.2085, 'Cairo', 'Dokki', ARRAY['wifi']),
    ('11111111-0000-0000-0000-000000000002', 'SH-004', 'Sha7en Obour', 'Obour City Center', 30.2160, 31.4700, 'Cairo', 'Obour', ARRAY['mall','bathroom','restaurant']),
    ('11111111-0000-0000-0000-000000000003', 'EP-001', 'Elsewedy Plug 6th October', 'Mall of Arabia', 29.9727, 30.9432, 'Cairo', '6th October', ARRAY['mall','restaurant','wifi','bathroom']),
    ('11111111-0000-0000-0000-000000000003', 'EP-002', 'Elsewedy Plug Nasr City', 'City Stars', 30.0729, 31.3452, 'Cairo', 'Nasr City', ARRAY['mall','restaurant','wifi','bathroom','shade']),
    ('11111111-0000-0000-0000-000000000003', 'EP-003', 'Elsewedy Plug Smart Village', 'Smart Village', 30.0710, 31.0180, 'Cairo', 'Smart Village', ARRAY['wifi','restaurant']),
    ('11111111-0000-0000-0000-000000000003', 'EP-004', 'Elsewedy Plug Rehab', 'Rehab City Gate', 30.0580, 31.4930, 'Cairo', 'Rehab', ARRAY['mall','shade']),
    ('11111111-0000-0000-0000-000000000004', 'KW-001', 'Kilowatt Downtown', 'Tahrir Square', 30.0444, 31.2357, 'Cairo', 'Downtown', ARRAY['shade']),
    ('11111111-0000-0000-0000-000000000004', 'KW-002', 'Kilowatt Sheikh Zayed', 'Hyper One', 30.0313, 30.9757, 'Cairo', 'Sheikh Zayed', ARRAY['mall','restaurant']),
    ('11111111-0000-0000-0000-000000000004', 'KW-003', 'Kilowatt Shorouk', 'Shorouk City', 30.1540, 31.5980, 'Cairo', 'Shorouk', ARRAY['bathroom']),
    ('11111111-0000-0000-0000-000000000004', 'KW-004', 'Kilowatt Garden City', 'Qasr El Nil St', 30.0380, 31.2320, 'Cairo', 'Garden City', ARRAY['restaurant','shade']),
    ('11111111-0000-0000-0000-000000000005', 'NE-001', 'New Energy Mohandessin', 'Gameat El Dowal', 30.0554, 31.2005, 'Cairo', 'Mohandessin', ARRAY['restaurant','wifi']),
    ('11111111-0000-0000-0000-000000000005', 'NE-002', 'New Energy Ain Sokhna Rd', 'Ain Sokhna Road Km 45', 30.0027, 31.5877, 'Cairo', 'Ain Sokhna Road', ARRAY['bathroom','shade','restaurant']),
    ('11111111-0000-0000-0000-000000000005', 'NE-003', 'New Energy Tagamoa', 'Cairo Festival City', 30.0280, 31.4050, 'Cairo', 'Tagamoa', ARRAY['mall','wifi','restaurant','bathroom']),
    ('11111111-0000-0000-0000-000000000005', 'NE-004', 'New Energy Alex Road', 'Cairo-Alex Desert Road Km 80', 30.3150, 30.5400, 'Cairo', 'Alex Road', ARRAY['restaurant','bathroom','shade']);

  -- Connectors (2-3 per station)
  INSERT INTO connectors (station_id, external_connector_id, type, power_kw, price_per_kwh)
  SELECT s.id, 'CCS-1', 'CCS', 60, 0.05 FROM stations s;

  INSERT INTO connectors (station_id, external_connector_id, type, power_kw, price_per_kwh)
  SELECT s.id, 'T2-1', 'Type2', 22, 0.04 FROM stations s;

  INSERT INTO connectors (station_id, external_connector_id, type, power_kw, price_per_kwh)
  SELECT s.id, 'CHD-1', 'CHAdeMO', 50, 0.045 FROM stations s WHERE s.area IN ('Maadi', 'New Cairo', '6th October', 'Nasr City', 'Heliopolis');
  ```

- [ ] **Step 2: Apply migration**
  ```bash
  supabase db push
  ```

- [ ] **Step 3: Commit**
  ```
  feat: seed 5 providers, 20 Cairo stations, and connectors
  ```

---

## Task 14: Offline Database Setup

- [ ] **Step 1: Native implementation**
  - File: `src/core/services/offlineDb.ts`
  ```typescript
  import * as SQLite from 'expo-sqlite';

  let db: SQLite.SQLiteDatabase | null = null;

  export async function getOfflineDb(): Promise<SQLite.SQLiteDatabase> {
    if (db) return db;
    db = await SQLite.openDatabaseAsync('evcharge.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS cached_stations (
        id TEXT PRIMARY KEY, data TEXT NOT NULL, synced_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS cached_connectors (
        id TEXT PRIMARY KEY, station_id TEXT NOT NULL, data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS pending_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL, payload TEXT NOT NULL, created_at INTEGER NOT NULL
      );
    `);
    return db;
  }

  export async function cacheStations(stations: any[]) {
    const db = await getOfflineDb();
    const now = Date.now();
    for (const s of stations) {
      await db.runAsync('INSERT OR REPLACE INTO cached_stations (id, data, synced_at) VALUES (?, ?, ?)', [s.id, JSON.stringify(s), now]);
    }
  }

  export async function getCachedStations(): Promise<any[]> {
    const db = await getOfflineDb();
    const rows = await db.getAllAsync('SELECT data FROM cached_stations');
    return rows.map((r: any) => JSON.parse(r.data));
  }
  ```

- [ ] **Step 2: Web fallback**
  - File: `src/core/services/offlineDb.web.ts`
  ```typescript
  const STORE_KEY = 'evcharge_offline_';

  export async function getOfflineDb() { return null; }

  export async function cacheStations(stations: any[]) {
    localStorage.setItem(STORE_KEY + 'stations', JSON.stringify(stations));
  }

  export async function getCachedStations(): Promise<any[]> {
    const data = localStorage.getItem(STORE_KEY + 'stations');
    return data ? JSON.parse(data) : [];
  }
  ```

- [ ] **Step 3: Commit**
  ```
  feat: add offline database with web fallback for station caching
  ```

---

## Task 15: Config and Feature Flags

- [ ] **Step 1: Write feature flags test**
  - File: `__tests__/core/featureFlags.test.ts`
  ```typescript
  import { featureFlags } from '@/core/config/featureFlags';

  describe('featureFlags', () => {
    it('has AI feature flag', () => expect(typeof featureFlags.AI_ASSISTANT).toBe('boolean'));
    it('has fleet feature flag', () => expect(typeof featureFlags.FLEET_MANAGEMENT).toBe('boolean'));
    it('has ads feature flag', () => expect(typeof featureFlags.ADS_ENABLED).toBe('boolean'));
  });
  ```

- [ ] **Step 2: Implement constants**
  - File: `src/core/config/constants.ts`
  ```typescript
  export const APP_NAME = 'EV Charge Egypt';
  export const SERVICE_FEE_EGP = 10;
  export const DEFAULT_MAP_REGION = { latitude: 30.0444, longitude: 31.2357, latitudeDelta: 0.15, longitudeDelta: 0.15 }; // Cairo
  export const STATION_SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
  export const AVAILABILITY_POLL_MS = 60 * 1000; // 60 seconds
  export const CHARGING_POLL_MS = 30 * 1000; // 30 seconds
  export const CREDIT_BONUSES: Record<number, number> = { 10000: 500, 25000: 1500, 50000: 4000, 100000: 12000 };
  export const FLEET_PLANS = {
    starter: { price: 0, maxVehicles: 5, features: ['basic_tracking', 'manual_booking'] },
    business: { price: 1500, maxVehicles: 25, features: ['ai_scheduling', 'reports', 'priority_booking', 'waived_fee', 'driver_limits'] },
    enterprise: { price: 10000, maxVehicles: Infinity, features: ['all_business', 'credit_system', 'battery_health', 'account_manager', 'custom_api', 'white_label'] },
  } as const;
  ```

- [ ] **Step 3: Implement feature flags**
  - File: `src/core/config/featureFlags.ts`
  ```typescript
  export const featureFlags = {
    AI_ASSISTANT: true,
    FLEET_MANAGEMENT: true,
    ADS_ENABLED: false,
    ARABIC_RTL: false,
    OFFLINE_MODE: true,
    MOCK_PROVIDERS: true,   // Use mock adapters instead of real APIs
    PUSH_NOTIFICATIONS: true,
    AUTO_TOPUP: true,
    BATTERY_HEALTH: true,
    SMART_SCHEDULING: true,
  } as const;
  ```

- [ ] **Step 4: Verify tests pass**
  ```bash
  npx jest __tests__/core/featureFlags.test.ts
  ```

- [ ] **Step 5: Commit**
  ```
  feat: add app constants, fleet plans config, and feature flags
  ```

---

## Task 16: Utility Functions

- [ ] **Step 1: Implement formatCurrency**
  - File: `src/core/utils/formatCurrency.ts`
  ```typescript
  export function formatEGP(amount: number): string {
    return `${amount.toFixed(2)} EGP`;
  }

  export function formatKWh(kwh: number): string {
    return `${kwh.toFixed(1)} kWh`;
  }

  export function formatPricePerKWh(price: number): string {
    return `${price.toFixed(3)} EGP/kWh`;
  }
  ```

- [ ] **Step 2: Implement validators**
  - File: `src/core/utils/validators.ts`
  ```typescript
  export const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  export const isValidPassword = (password: string): boolean => password.length >= 8;
  export const isValidPhone = (phone: string): boolean => /^(\+20|0)(1[0125]\d{8})$/.test(phone);
  export const isValidLicensePlate = (plate: string): boolean => plate.length >= 3;
  ```

- [ ] **Step 3: Commit**
  ```
  feat: add currency formatting and Egyptian validation utilities
  ```

---

## Task 17: App Entry Point

- [ ] **Step 1: Implement App.tsx**
  - File: `App.tsx`
  ```typescript
  import React from 'react';
  import { StatusBar } from 'react-native';
  import { SafeAreaProvider } from 'react-native-safe-area-context';
  import { QueryClientProvider } from '@tanstack/react-query';
  import { queryClient } from '@/core/queries/queryClient';
  import { AuthProvider } from '@/core/auth/AuthProvider';
  import { RootNavigator } from '@/navigation/RootNavigator';
  import { colors } from '@/core/theme/colors';

  export default function App() {
    return (
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
            <RootNavigator />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    );
  }
  ```

- [ ] **Step 2: Verify app builds**
  ```bash
  npx expo start --web
  ```

- [ ] **Step 3: Commit**
  ```
  feat: wire up App entry point with providers and navigation
  ```

---

## Task 18: useAppState Hook

- [ ] **Step 1: Implement**
  - File: `src/core/hooks/useAppState.ts`
  ```typescript
  import { useEffect, useRef } from 'react';
  import { AppState, AppStateStatus } from 'react-native';

  export function useAppState(onChange: (state: AppStateStatus) => void) {
    const appState = useRef(AppState.currentState);

    useEffect(() => {
      const subscription = AppState.addEventListener('change', (nextState) => {
        if (appState.current !== nextState) {
          onChange(nextState);
          appState.current = nextState;
        }
      });
      return () => subscription.remove();
    }, [onChange]);

    return appState.current;
  }
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add useAppState hook for background/foreground transitions
  ```

---

## Task 19: Smoke Test

- [ ] **Step 1: Write WelcomeScreen test**
  - File: `__tests__/screens/WelcomeScreen.test.tsx`
  ```typescript
  import React from 'react';
  import { render } from '@testing-library/react-native';
  import { WelcomeScreen } from '@screens/auth/WelcomeScreen';

  const mockNavigation = { navigate: jest.fn() };

  describe('WelcomeScreen', () => {
    it('renders app name', () => {
      const { getByText } = render(<WelcomeScreen navigation={mockNavigation} />);
      expect(getByText('EV Charge Egypt')).toBeTruthy();
    });
    it('has Get Started button', () => {
      const { getByText } = render(<WelcomeScreen navigation={mockNavigation} />);
      expect(getByText('Get Started')).toBeTruthy();
    });
  });
  ```

- [ ] **Step 2: Write LoginScreen test**
  - File: `__tests__/screens/LoginScreen.test.tsx`
  ```typescript
  import React from 'react';
  import { render, fireEvent } from '@testing-library/react-native';
  import { LoginScreen } from '@screens/auth/LoginScreen';

  jest.mock('@/core/auth/useAuth', () => ({ useAuth: () => ({ signIn: jest.fn(), isLoading: false }) }));

  describe('LoginScreen', () => {
    it('renders email input', () => {
      const { getByPlaceholderText } = render(<LoginScreen navigation={{ goBack: jest.fn() }} />);
      expect(getByPlaceholderText('your@email.com')).toBeTruthy();
    });
  });
  ```

- [ ] **Step 3: Run all tests**
  ```bash
  npx jest --coverage
  ```

- [ ] **Step 4: Commit**
  ```
  test: add smoke tests for Welcome and Login screens
  ```

---

## Task 20: Verify Full Foundation

- [ ] **Step 1: Run full test suite**
  ```bash
  npx jest --verbose
  ```

- [ ] **Step 2: Verify app starts on web**
  ```bash
  npx expo start --web
  ```

- [ ] **Step 3: Verify TypeScript compiles**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 4: Final commit**
  ```
  chore: verify foundation — all tests pass, app builds, TypeScript clean
  ```

---

**Total: 20 tasks, ~65 steps**
