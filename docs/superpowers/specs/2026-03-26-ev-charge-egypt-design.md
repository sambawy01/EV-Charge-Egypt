# EV Charge Egypt — Design Specification

> Egypt's first unified EV charging platform. One app to find, book, charge, and pay across all Egyptian EV providers.

**Date**: 2026-03-26
**Status**: Draft
**Author**: Product & Engineering

---

## 1. Context & Goals

### What We're Building

Egypt's first unified EV charging platform. One app to find, book, charge, and pay across all Egyptian EV providers. Like Booking.com for EV charging.

### Market Context

- ~300 EV charging stations in Egypt, mostly Cairo and Alexandria
- Government target: 3,000+ stations by 2027
- 5 providers each with their own app: IKARUS, Sha7en, Elsewedy Plug, Kilowatt EV, New Energy
- No aggregator exists for Egypt. Global apps (PlugShare, Chargemap, Bonnet) have minimal Egypt coverage
- Proven model globally — localizing for Egypt's fast-growing market

### User Pain Points

- Need 5 separate apps to access all chargers
- Can't compare prices across providers
- Drive to a station only to find it occupied
- No way to reserve a charging slot
- No trip planning with charging stops for intercity travel

### Business Model

- **10 EGP flat service fee** per charging session (paid by driver)
- **Fleet subscriptions**: Starter (free, 5 vehicles), Business (1,500 EGP/month, 25 vehicles), Enterprise (10,000 EGP/month, unlimited vehicles)
- **Enterprise credit system** with bulk top-up bonuses (5-12% based on amount)
- **Subtle contextual ads** (while charging, post-charge, nearby amenities)
- **Future**: anonymized data insights to providers/government
- Providers pay nothing initially — free to onboard

### Geographic Strategy

Egypt-first (Cairo + Alexandria), expand to other Egyptian cities, then potentially Gulf/MENA region.

---

## 2. Architecture

### Tech Stack

- **React Native (Expo 55)** — iOS, Android, Web
- **Supabase Pro (EU Frankfurt / eu-central-1)** — Auth, PostgreSQL, Realtime, Edge Functions, Storage
- **Zustand** — global state management
- **TanStack React Query** — server state + caching
- **Claude API** — AI layer via Supabase Edge Functions
- **react-native-maps** — native map integration

### System Architecture

```
Mobile App (React Native/Expo)
    ↕
Supabase (Auth + PostgreSQL + Realtime + Edge Functions)
    ↕
Provider Adapter Layer
    ↕
5 Provider APIs (IKARUS, Sha7en, Elsewedy, Kilowatt, New Energy)
```

### Provider Integration

Each provider wrapped in a unified adapter implementing:

- `getStations()` → `Station[]`
- `getAvailability(stationId)` → `ConnectorStatus[]`
- `createBooking(stationId, userId, timeSlot)` → `Booking`
- `cancelBooking(bookingId)` → `void`
- `startCharging(bookingId)` → `Session`
- `stopCharging(sessionId)` → `SessionResult`
- `getPrice(stationId, connectorType)` → `Price`

**Sync strategy:**

| Data | Frequency |
|------|-----------|
| Station list | Every 6 hours |
| Connector availability | Every 60 seconds for visible stations |
| Booking | Real-time via provider API |
| Charging session | Every 30 seconds while active |

### Folder Structure

```
src/
├── core/
│   ├── auth/
│   ├── components/
│   ├── hooks/
│   ├── providers/          # Provider adapter layer
│   │   ├── types.ts
│   │   ├── ProviderAdapter.ts
│   │   ├── IkarusAdapter.ts
│   │   ├── Sha7enAdapter.ts
│   │   ├── ElsewedyAdapter.ts
│   │   ├── KilowattAdapter.ts
│   │   ├── NewEnergyAdapter.ts
│   │   └── index.ts
│   ├── queries/
│   ├── services/
│   ├── stores/
│   ├── theme/
│   ├── types/
│   └── utils/
├── driver/
│   ├── screens/
│   └── components/
├── fleet/
│   ├── screens/
│   └── components/
└── navigation/
    ├── RootNavigator.tsx
    ├── DriverNavigator.tsx
    ├── FleetNavigator.tsx
    └── AuthNavigator.tsx
```

### Two User Roles

| Role | Access | Description |
|------|--------|-------------|
| Driver | Free (10 EGP/charge) | Individual EV owner |
| Fleet Manager | Subscription | Manages company EV fleet |

---

## 3. Driver Experience

### 3.1 Home Screen (Map-First)

- Full-screen map centered on user location
- All chargers from all 5 providers as color-coded pins:
  - **Green** = available
  - **Orange** = partially occupied
  - **Red** = all occupied
  - **Gray** = offline
  - Provider logo on each pin
- **Top**: search bar ("Search location or route...")
- **Bottom sheet** (swipe up): nearest chargers list with price, speed, availability
- **Filter button**: connector type, speed (kW), provider, price range, amenities

### 3.2 Station Detail Screen

Tap pin to open slide-up sheet:

- Provider name + logo
- Address + distance + ETA
- Connectors list: type (CCS/CHAdeMO/Type2), speed (kW), price/kWh, live status
- AI prediction: "Usually free at this time" or "Gets busy in 30 min"
- **Book Now** button (enters booking flow)
- **Navigate** button (opens Apple/Google Maps)
- Reviews + photos from drivers
- Amenities: restaurant, bathroom, WiFi, mall, shade

### 3.3 Booking Flow

1. Select connector type
2. Select time slot (now, or schedule: 30min/1hr/2hr windows)
3. Price estimate: provider rate x estimated kWh + 10 EGP
4. Confirm booking
5. Push notification 10 min before: "Your charger is ready"
6. Arrive, tap "Start Charging" button
7. Live charging screen: kWh counter, cost counter, estimated time to target %
8. Done: receipt with breakdown

### 3.4 Charging Session Screen

- Live power flow animation
- Current charge %, kWh delivered, cost so far (real-time)
- Estimated time to target % (AI-calculated per car model + charger speed)
- **Stop Charging** button
- Push notification when done: "80% reached. Please move your car."
- "While you wait" section: nearby amenities + subtle ads

### 3.5 Profile & Vehicle

- **Add car**: make, model, year, battery capacity (auto-fill from EV database)
- Multiple vehicles supported
- **Payment methods**: credit/debit card, Fawry, InstaPay, Vodafone Cash, Orange Cash, Etisalat Cash
- Charging history with stats
- Favorite stations
- Notification preferences
- **Language**: Arabic / English

### 3.6 AI Assistant Tab

Chat interface powered by Claude API:

- "Where's the cheapest fast charger near Maadi?"
- "Plan my weekend trip to Gouna with charging stops"
- "What's the difference between CCS and Type 2?"
- "Charger won't start" — troubleshooting + report to provider
- Proactive tips: "You usually charge Thursdays. Station X has a free slot at 2pm."
- Monthly cost reports with optimization suggestions
- Battery health tips based on charging patterns

### 3.7 Wallet

- In-app wallet with balance
- **Top-up via**: card, Fawry, InstaPay, Vodafone Cash, Orange Cash, Etisalat Cash
- Auto-top-up option
- Transaction history
- Each charge: provider rate + 10 EGP deducted from wallet
- Shareable PDF receipts

---

## 4. Fleet Management

### 4.1 Fleet Home Dashboard

- Total vehicles with charge status: charging, idle, low battery, on route
- Today's spending vs budget
- Active charging sessions: driver, station, estimated completion
- Alerts: vehicles below 20%, missed bookings, overdue charges
- AI insight: "3 drivers charged at peak rates. Off-peak saves 1,200 EGP/month"

### 4.2 Vehicle Management

- All fleet vehicles: plate, model, battery %, last charged, assigned driver
- Tap for full history: sessions, costs, battery health trend
- Assign/remove drivers
- Set rules: "Don't charge above 80%", "Prefer stations under 0.05 EGP/kWh"

### 4.3 Smart Scheduling (AI)

- AI generates optimal charging schedule for fleet
- Factors: driver routes, station predictions, electricity rates, battery levels
- Fleet manager approves/adjusts
- Auto-books approved slots

### 4.4 Cost Reports & Analytics

- Monthly/weekly breakdowns per vehicle, per driver, per provider
- Provider comparison: "60% at Elsewedy, but IKARUS 15% cheaper"
- AI recommendations with projected savings
- Exportable PDF/CSV

### 4.5 Enterprise Credit System

- Pre-load credits: 10K-100K EGP with bonuses (5-12%)
- Per-driver spending limits (daily/weekly)
- Auto-top-up at threshold
- Real-time balance + burn rate
- AI predicts: "Balance runs out in 12 days"
- Monthly statements
- 10 EGP per-charge fee waived for Business/Enterprise

### 4.6 Pricing

| Plan | Price | Vehicles | Features |
|------|-------|----------|----------|
| Starter | Free | Up to 5 | Basic tracking, manual booking |
| Business | 1,500 EGP/month | Up to 25 | AI scheduling, reports, priority booking, waived per-charge fee, per-driver limits |
| Enterprise | 10,000 EGP/month | Unlimited | Everything in Business + credit system with bonuses, battery health monitoring, dedicated account manager, custom API, multi-location, driver scoring, predictive maintenance, guaranteed availability blocks, invoice billing, white-label option |

**Enterprise ROI**: 100-vehicle fleet saves ~65,000 EGP/month (waived fees + AI optimization + avoided repairs) vs 10,000 EGP subscription.

---

## 5. AI Intelligence Layer

All AI via Claude API through Supabase Edge Functions.

### 5.1 Predictive Availability

- Learns per-station patterns from booking/session data
- Shows on every station: "Usually free at this time" / "Gets busy in 30 min"
- Average wait time, best time to come
- Powers fleet scheduling

### 5.2 Smart Route Planner

- **Input**: destination + current battery %
- **Factors**: car model, battery capacity, driving speed, AC usage, traffic, weather
- **Output**: optimal route with charging stops
- Real-time re-routing if station occupied or traffic changes

### 5.3 Cost Optimizer

- Real-time price comparison across providers
- Monthly reports: actual spend vs optimal
- Proactive suggestions: "Sha7en 30% cheaper, 800m further"
- Off-peak alerts
- Fleet: optimize across all vehicles

### 5.4 Chat Assistant ("Charge AI")

- Natural language queries
- Trip planning with charging stops
- Troubleshooting guide
- Battery care education
- Contextual — knows your car, location, history

### 5.5 Battery Health Monitor

- Tracks: charge frequency, fast-charge ratio, depth of discharge
- Monthly health score
- Degradation alerts
- Fleet: health across all vehicles

### 5.6 Crowd Intelligence

- Auto-detects broken chargers from booking patterns
- AI reliability score per station
- Summarizes reviews automatically
- Flags suspicious reviews

### 5.7 Edge Functions

| Function | Purpose |
|----------|---------|
| `sync-stations` | Cron: fetch stations from all providers |
| `check-availability` | Real-time connector status |
| `create-booking` | Book via provider API |
| `start-charging` | Trigger session via provider API |
| `stop-charging` | End session, calculate cost, process payment |
| `process-payment` | Wallet deduction + payment gateway |
| `ai-predict-availability` | Prediction based on station_analytics |
| `ai-route-planner` | Smart routing with Claude |
| `ai-cost-optimizer` | Price comparison + suggestions |
| `ai-chat` | Claude-powered assistant |
| `ai-battery-health` | Analyze patterns, score health |
| `send-notification` | Push via Expo |

---

## 6. Database Schema

### Core Tables

```sql
-- Users (extends auth.users)
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

-- Fleets
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

-- Payments/Transactions
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

-- Station Analytics (for AI predictions)
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

-- AI Interactions (audit)
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
```

---

## 7. Ads Strategy

Ads are subtle, contextual, and useful — never intrusive.

| Placement | When | Format | Example |
|-----------|------|--------|---------|
| While charging | 2-30 min wait | "Nearby" card | "Starbucks 50m away — 10% off" |
| Station amenities | Viewing station | Sponsored listing | "Costa Coffee here — free WiFi" |
| Post-charge | After session | Small banner | "BMW iX test drive at AutoMark" |
| AI assistant | Contextual | Suggestion | "Mall has 4 chargers + weekend sale" |
| Weekly digest | Email/push | Sponsored section | "AXA EV insurance — 20% off" |

**Never**: pop-ups, interstitials, video ads, ads while navigating.

**Ad categories**: EV dealerships, car insurance, nearby cafes/restaurants, EV accessories, road trip destinations.

---

## 8. Navigation Structure

### Driver (5 tabs + stack screens = 15 screens)

```
DriverNavigator
├── MapTab → StationDetail → Booking → ChargingSession
├── BookingsTab → BookingDetail
├── AITab → RouteResult, CostReport
├── WalletTab → TopUp, TransactionHistory
├── ProfileTab → Vehicle, AddVehicle, Favorites, Settings
└── Modals: Review, Filter, Notifications
```

### Fleet Manager (5 tabs + stack screens = 13 screens)

```
FleetNavigator
├── DashboardTab → VehicleDetail, DriverDetail
├── VehiclesTab → VehicleDetail, AssignDriver
├── ScheduleTab → AIScheduleReview
├── ReportsTab → CostBreakdown, BatteryHealth, Export
├── SettingsTab → CreditTopUp, MemberManagement, Billing
└── Modals: AddVehicle, AddDriver, Notifications
```

### Auth (4 screens)

```
AuthNavigator
├── Welcome
├── Login
├── Register (with role selection)
└── Onboarding (add vehicle, permissions)
```

**Total: 32 screens**

---

## 9. Payment Flow

### Individual Driver

```
Top up wallet (card/Fawry/mobile wallet)
    → Balance in wallet
        → Book charger
            → Start charging
                → Session ends
                    → Calculate: provider_rate × kWh + 10 EGP
                        → Deduct from wallet
                            → Receipt generated
```

### Fleet (Credit System)

```
Fleet manager loads credits (with bulk bonus)
    → Credits in fleet wallet
        → Driver books charger (within limits)
            → Charging session
                → Calculate: provider_rate × kWh (no 10 EGP fee)
                    → Deduct from fleet credits
                        → Appears in fleet manager's report
```

### Credit Top-Up Bonuses

| Amount | Bonus | Effective Discount |
|--------|-------|--------------------|
| 10,000 EGP | +500 | 5% |
| 25,000 EGP | +1,500 | 6% |
| 50,000 EGP | +4,000 | 8% |
| 100,000 EGP | +12,000 | 12% |

---

## 10. Success Metrics

| Metric | Target |
|--------|--------|
| Station data freshness | <60 second delay on availability |
| Booking success rate | >95% |
| App to charger time | <15 minutes average |
| AI prediction accuracy | >80% (availability) |
| Driver retention | >60% monthly active |
| Fleet conversion | >5% of registered fleets upgrade from Starter |
| Revenue per charge | 10 EGP average |
| Ad CTR | >2% (contextual ads) |
| App rating | >4.5 stars |

---

## 11. Technical Dependencies

| Package | Purpose |
|---------|---------|
| `react-native-maps` | Native maps |
| `expo-location` | GPS |
| `expo-notifications` | Push notifications |
| `@supabase/supabase-js` | Backend |
| `zustand` | State management |
| `@tanstack/react-query` | Server state |
| `expo-secure-store` | Credential storage |
| `react-native-svg` | Charts/icons |
| `expo-linear-gradient` | UI gradients |
