-- Add operating_hours column to stations table
ALTER TABLE stations ADD COLUMN IF NOT EXISTS operating_hours TEXT;

-- Add operating_hours column to submitted_stations table
ALTER TABLE submitted_stations ADD COLUMN IF NOT EXISTS operating_hours TEXT;

-- Update station_reports status CHECK constraint to include 'iced'
ALTER TABLE station_reports DROP CONSTRAINT IF EXISTS station_reports_status_check;
ALTER TABLE station_reports ADD CONSTRAINT station_reports_status_check
  CHECK (status IN ('available', 'busy', 'out_of_service', 'partially_available', 'iced'));
