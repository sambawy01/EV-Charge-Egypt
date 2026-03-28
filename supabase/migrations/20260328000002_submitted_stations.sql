-- User-submitted stations pending verification
CREATE TABLE IF NOT EXISTS submitted_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by TEXT,
  name TEXT NOT NULL,
  address TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  city TEXT,
  provider_name TEXT,
  connector_types TEXT[] DEFAULT '{}',
  power_kw NUMERIC,
  notes TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verification_count INTEGER DEFAULT 0,
  verified_by TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submitted_stations_status ON submitted_stations(status);
CREATE INDEX IF NOT EXISTS idx_submitted_stations_location ON submitted_stations(latitude, longitude);

ALTER TABLE submitted_stations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "submitted_read" ON submitted_stations FOR SELECT USING (true);
CREATE POLICY "submitted_insert" ON submitted_stations FOR INSERT WITH CHECK (true);
CREATE POLICY "submitted_update" ON submitted_stations FOR UPDATE USING (true);

-- Add verified flag to main stations table
ALTER TABLE stations ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE stations ADD COLUMN IF NOT EXISTS verified_count INTEGER DEFAULT 0;

-- Mark all existing stations as verified (they're from official sources)
UPDATE stations SET is_verified = true, verified_count = 5;
