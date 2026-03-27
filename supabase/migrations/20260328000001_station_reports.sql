-- Crowdsourced station status reports
CREATE TABLE IF NOT EXISTS station_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id TEXT NOT NULL,
  user_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('available', 'busy', 'out_of_service', 'partially_available')),
  available_spots INTEGER,
  total_spots INTEGER,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_station_reports_station ON station_reports(station_id);
CREATE INDEX IF NOT EXISTS idx_station_reports_created ON station_reports(created_at DESC);

-- Enable RLS
ALTER TABLE station_reports ENABLE ROW LEVEL SECURITY;

-- Anyone can read reports
CREATE POLICY "reports_read" ON station_reports FOR SELECT USING (true);

-- Anyone can insert reports (even anon — we want low friction)
CREATE POLICY "reports_insert" ON station_reports FOR INSERT WITH CHECK (true);
