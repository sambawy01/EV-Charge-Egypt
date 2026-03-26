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

-- Connectors (2-3 per station based on area)
INSERT INTO connectors (station_id, external_connector_id, type, power_kw, price_per_kwh)
SELECT s.id, 'CCS-1', 'CCS', 60, 0.05 FROM stations s;

INSERT INTO connectors (station_id, external_connector_id, type, power_kw, price_per_kwh)
SELECT s.id, 'T2-1', 'Type2', 22, 0.04 FROM stations s;

INSERT INTO connectors (station_id, external_connector_id, type, power_kw, price_per_kwh)
SELECT s.id, 'CHD-1', 'CHAdeMO', 50, 0.045 FROM stations s
WHERE s.area IN ('Maadi', 'New Cairo', '6th October', 'Nasr City', 'Heliopolis');
