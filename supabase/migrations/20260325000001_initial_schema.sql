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

-- Indexes
CREATE INDEX idx_stations_location ON stations (latitude, longitude);
CREATE INDEX idx_stations_provider ON stations (provider_id);
CREATE INDEX idx_connectors_station ON connectors (station_id);
CREATE INDEX idx_bookings_user ON bookings (user_id);
CREATE INDEX idx_bookings_status ON bookings (status);
CREATE INDEX idx_sessions_user ON charging_sessions (user_id);
CREATE INDEX idx_transactions_wallet ON transactions (wallet_id);
CREATE INDEX idx_notifications_user ON notifications (user_id, read);
