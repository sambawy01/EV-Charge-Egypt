-- Home Charger Sharing (PlugShare-style)
-- Allows users to list their personal EV chargers for other drivers to use

CREATE TABLE home_chargers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  connector_type TEXT NOT NULL,  -- 'Type 2', 'CCS', 'Wall Outlet', etc.
  power_kw NUMERIC DEFAULT 7,
  description TEXT,
  availability_schedule TEXT,    -- e.g., "Weekdays 6PM-10PM, Weekends all day"
  is_free BOOLEAN DEFAULT true,
  price_per_kwh NUMERIC,
  photos TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE home_chargers ENABLE ROW LEVEL SECURITY;

-- Anyone can view active home chargers
CREATE POLICY "Anyone can view active home chargers"
  ON home_chargers FOR SELECT
  USING (is_active = true);

-- Users can manage (insert, update, delete) their own chargers
CREATE POLICY "Users can insert own chargers"
  ON home_chargers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chargers"
  ON home_chargers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chargers"
  ON home_chargers FOR DELETE
  USING (auth.uid() = user_id);

-- Index for spatial queries
CREATE INDEX idx_home_chargers_location ON home_chargers (latitude, longitude);
CREATE INDEX idx_home_chargers_user ON home_chargers (user_id);
CREATE INDEX idx_home_chargers_active ON home_chargers (is_active) WHERE is_active = true;
