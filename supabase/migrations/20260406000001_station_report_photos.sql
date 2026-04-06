-- Add photos column to station_reports
ALTER TABLE station_reports ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';

-- Create storage bucket for station photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('station-photos', 'station-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for station-photos bucket
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'station_photos_insert' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "station_photos_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'station-photos');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'station_photos_read' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "station_photos_read" ON storage.objects FOR SELECT USING (bucket_id = 'station-photos');
  END IF;
END $$;
