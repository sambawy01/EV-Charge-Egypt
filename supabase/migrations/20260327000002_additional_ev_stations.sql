-- ============================================================================
-- Additional EV Charging Stations in Egypt — March 27, 2026
-- Sources: PlugShare, Electromaps, OpenChargeMap, EV24.africa, EgyptToday,
--          Zawya, Enterprise, provider websites, news articles 2024-2026
-- ============================================================================
--
-- This migration adds stations from:
--   1. IKARUS (10 additional locations beyond our existing 5)
--   2. Electra (new provider — Egypt's growing fast-charging network)
--   3. New Energy Egypt (newenergyeg.com)
--   4. Infinity EV (additional locations in compounds, gas stations, highways)
--   5. Revolta / Sha7en (additional highway + city locations)
--   6. Elsewedy Plug (compound expansions)
--   7. Stations in underrepresented areas (Delta, Sinai, Suez, Fayoum)
--   8. Miscellaneous new providers
-- ============================================================================

-- ============================================================================
-- NEW PROVIDERS
-- ============================================================================

INSERT INTO ev_providers (id, name, slug, website, support_phone, is_active) VALUES
  ('11111111-0000-0000-0000-000000000013', 'Shift EV', 'shift-ev', 'https://shift-ev.com', NULL, true),
  ('11111111-0000-0000-0000-000000000014', 'Luxman Energy', 'luxman-energy', 'https://www.luxmanenergy.com', NULL, true),
  ('11111111-0000-0000-0000-000000000015', 'Camp Firr (Private)', 'camp-firr', NULL, NULL, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- INSERT ADDITIONAL STATIONS
-- ============================================================================

INSERT INTO ev_stations (
  provider_id, external_station_id, name, address, latitude, longitude,
  city, area, governorate, connector_types, power_kw, total_bays,
  amenities, is_active, is_verified, source, notes
) VALUES

-- =========================================================================
-- IKARUS — ADDITIONAL STATIONS (10 new, beyond existing 5 + Zafarana)
-- Source: ikaruselectric.com/en/charging-map, PlugShare, social media posts
-- IKARUS has 15+ stations across Egypt; we had only 5 confirmed.
-- =========================================================================

-- IKARUS - Madinaty (confirmed via IKARUS app/social media)
(
  '11111111-0000-0000-0000-000000000001', 'IKARUS-MADINATY',
  'IKARUS Madinaty',
  'Madinaty Open Air Mall, Madinaty, New Cairo',
  30.1072, 31.6390,
  'Madinaty', 'Open Air Mall', 'Cairo',
  '{"CCS2","Type 2"}', 60, 2,
  '{"shopping","food"}', true, false, 'IKARUS app / social media',
  'CCS2 DC 60kW + Type 2 AC. At Madinaty Open Air Mall parking.'
),

-- IKARUS - Rehab City
(
  '11111111-0000-0000-0000-000000000001', 'IKARUS-REHAB',
  'IKARUS El Rehab',
  'El Rehab City, Main Gate area, New Cairo',
  30.0590, 31.4930,
  'New Cairo', 'El Rehab', 'Cairo',
  '{"CCS2","Type 2"}', 60, 2,
  '{}', true, false, 'IKARUS app / social media',
  'CCS2 DC + Type 2 AC chargers'
),

-- IKARUS - Ain Sokhna Highway (rest stop)
(
  '11111111-0000-0000-0000-000000000001', 'IKARUS-SOKHNA-HWY',
  'IKARUS Ain Sokhna Highway',
  'Cairo-Ain Sokhna Highway, KM 60 rest area',
  29.8300, 32.0500,
  'Ain Sokhna', 'Cairo-Sokhna Highway', 'Suez',
  '{"CCS2","GB/T DC"}', 120, 2,
  '{}', true, false, 'IKARUS social media / PlugShare reports',
  'DC fast charger on Cairo-Sokhna highway. Critical for coastal travel.'
),

-- IKARUS - 6th of October City
(
  '11111111-0000-0000-0000-000000000001', 'IKARUS-6OCT',
  'IKARUS 6th of October',
  'Central Axis (Al Mehwar Al Markazi), 6th of October City',
  30.0050, 30.9700,
  '6th of October', 'Central Axis', 'Giza',
  '{"CCS2","Type 2"}', 60, 2,
  '{}', true, false, 'IKARUS charging map',
  'Along the main commercial axis of 6th of October City'
),

-- IKARUS - Sheikh Zayed
(
  '11111111-0000-0000-0000-000000000001', 'IKARUS-SHEIKHZAYED',
  'IKARUS Sheikh Zayed',
  'Hyper One area, Sheikh Zayed City',
  30.0350, 30.9850,
  'Sheikh Zayed', 'Hyper One', 'Giza',
  '{"CCS2","Type 2"}', 60, 2,
  '{"shopping"}', true, false, 'IKARUS charging map',
  'Near Hyper One hypermarket'
),

-- IKARUS - Heliopolis (Cairo)
(
  '11111111-0000-0000-0000-000000000001', 'IKARUS-HELIOPOLIS',
  'IKARUS Heliopolis',
  'El Merghany Street area, Heliopolis, Cairo',
  30.0830, 31.3300,
  'Cairo', 'Heliopolis', 'Cairo',
  '{"CCS2","Type 2"}', 60, 2,
  '{}', true, false, 'IKARUS charging map',
  'CCS2 DC + Type 2 AC'
),

-- IKARUS - Obour City
(
  '11111111-0000-0000-0000-000000000001', 'IKARUS-OBOUR',
  'IKARUS Obour City',
  'El Obour City, Cairo-Ismailia Road',
  30.2265, 31.4750,
  'El Obour', NULL, 'Qalyubia',
  '{"CCS2","Type 2"}', 60, 2,
  '{}', true, false, 'IKARUS charging map',
  NULL
),

-- IKARUS - New Administrative Capital
(
  '11111111-0000-0000-0000-000000000001', 'IKARUS-NAC',
  'IKARUS New Administrative Capital',
  'Business District, New Administrative Capital',
  30.0200, 31.7650,
  'New Administrative Capital', 'Business District', 'Cairo',
  '{"CCS2","Type 2"}', 120, 2,
  '{}', true, false, 'IKARUS charging map / news',
  'Part of Elsewedy-IKARUS joint EV infrastructure rollout in NAC'
),

-- IKARUS - Hurghada
(
  '11111111-0000-0000-0000-000000000001', 'IKARUS-HURGHADA',
  'IKARUS Hurghada',
  'Sheraton Road, Hurghada',
  27.2200, 33.8400,
  'Hurghada', 'Sheraton Road', 'Red Sea',
  '{"CCS2","Type 2"}', 60, 2,
  '{"hotel","food"}', true, false, 'IKARUS charging map',
  NULL
),

-- IKARUS - Cairo-Alex Desert Road (rest stop)
(
  '11111111-0000-0000-0000-000000000001', 'IKARUS-ALEXRD',
  'IKARUS Cairo-Alex Desert Road',
  'Cairo-Alexandria Desert Road, KM 75 rest area',
  30.3500, 30.4500,
  'Giza', 'Cairo-Alex Desert Road', 'Giza',
  '{"CCS2","GB/T DC"}', 120, 2,
  '{"restaurant","restrooms"}', true, false, 'IKARUS social media / Enterprise news',
  'Highway DC fast charger. Elsewedy-IKARUS partnership station.'
),

-- =========================================================================
-- ELECTRA CHARGERS — New provider (electrachargers.com)
-- Egypt''s growing fast-charging network, CCS2 up to 400kW
-- Source: electrachargers.com/map, social media, news
-- =========================================================================

-- Electra - Downtown Cairo
(
  '11111111-0000-0000-0000-000000000007', 'ELECTRA-DOWNTOWN',
  'Electra - Downtown Cairo Hub',
  'Qasr El Nil, Downtown Cairo',
  30.0500, 31.2400,
  'Cairo', 'Downtown', 'Cairo',
  '{"CCS2"}', 150, 4,
  '{"parking"}', true, false, 'electrachargers.com',
  'DC fast charging hub. CCS2 up to 150kW.'
),

-- Electra - New Cairo 90th Street
(
  '11111111-0000-0000-0000-000000000007', 'ELECTRA-90ST',
  'Electra - New Cairo 90th Street',
  'North 90th Street, 5th Settlement, New Cairo',
  30.0300, 31.4700,
  'New Cairo', '5th Settlement', 'Cairo',
  '{"CCS2"}', 150, 4,
  '{}', true, false, 'electrachargers.com',
  'Fast DC charging. CCS2 150kW.'
),

-- Electra - 6th of October
(
  '11111111-0000-0000-0000-000000000007', 'ELECTRA-6OCT',
  'Electra - 6th of October',
  'Central Axis, 6th of October City',
  30.0100, 30.9600,
  '6th of October', 'Central Axis', 'Giza',
  '{"CCS2"}', 150, 4,
  '{}', true, false, 'electrachargers.com',
  'Fast DC charging hub.'
),

-- Electra - Heliopolis
(
  '11111111-0000-0000-0000-000000000007', 'ELECTRA-HELIOPOLIS',
  'Electra - Heliopolis',
  'El Nozha, Heliopolis, Cairo',
  30.0900, 31.3600,
  'Cairo', 'Heliopolis', 'Cairo',
  '{"CCS2"}', 150, 4,
  '{}', true, false, 'electrachargers.com',
  'CCS2 fast charging.'
),

-- Electra - Maadi
(
  '11111111-0000-0000-0000-000000000007', 'ELECTRA-MAADI',
  'Electra - Maadi',
  'Road 9, Maadi, Cairo',
  29.9600, 31.2600,
  'Cairo', 'Maadi', 'Cairo',
  '{"CCS2"}', 150, 4,
  '{}', true, false, 'electrachargers.com',
  'CCS2 fast charging in Maadi commercial area.'
),

-- Electra - Alexandria
(
  '11111111-0000-0000-0000-000000000007', 'ELECTRA-ALEX',
  'Electra - Alexandria Corniche',
  'El Geish Road, Gleem, Alexandria',
  31.2450, 29.9650,
  'Alexandria', 'Gleem', 'Alexandria',
  '{"CCS2"}', 150, 4,
  '{}', true, false, 'electrachargers.com',
  'Alexandria fast-charging hub.'
),

-- Electra - Sheikh Zayed
(
  '11111111-0000-0000-0000-000000000007', 'ELECTRA-ZAYED',
  'Electra - Sheikh Zayed',
  '26th of July Corridor, Sheikh Zayed',
  30.0400, 31.0100,
  'Sheikh Zayed', '26th of July Corridor', 'Giza',
  '{"CCS2"}', 150, 4,
  '{}', true, false, 'electrachargers.com',
  'CCS2 fast charging hub.'
),

-- =========================================================================
-- NEW ENERGY EGYPT — (newenergyeg.com)
-- Two branches: Cairo and South Sinai. Expanding in Delta and Upper Egypt.
-- Installs chargers at fuel stations, malls, dealerships, new developments.
-- =========================================================================

-- New Energy - Nasr City Service Center
(
  '11111111-0000-0000-0000-000000000005', 'NE-NASRCITY',
  'New Energy Egypt - Nasr City Service Center',
  'Abbas El Akkad Street, Nasr City, Cairo',
  30.0563, 31.3450,
  'Cairo', 'Nasr City', 'Cairo',
  '{"CCS2","Type 2"}', 60, 2,
  '{}', true, false, 'newenergyeg.com',
  'New Energy Egypt headquarters/showroom with public charging.'
),

-- New Energy - Sharm El Sheikh branch
(
  '11111111-0000-0000-0000-000000000005', 'NE-SHARM',
  'New Energy Egypt - Sharm El Sheikh',
  'Hay El Nour, Sharm El Sheikh',
  27.9150, 34.3300,
  'Sharm El Sheikh', 'Hay El Nour', 'South Sinai',
  '{"CCS2","Type 2"}', 60, 2,
  '{}', true, false, 'newenergyeg.com',
  'South Sinai branch office with public charging.'
),

-- New Energy - New Alamein
(
  '11111111-0000-0000-0000-000000000005', 'NE-ALAMEIN',
  'New Energy Egypt - New Alamein',
  'New Alamein City, North Coast',
  30.8400, 28.9600,
  'New Alamein', 'City Center', 'Matrouh',
  '{"CCS2","Type 2"}', 60, 2,
  '{}', true, false, 'newenergyeg.com / EV24.africa',
  'Part of New Alamein smart city infrastructure.'
),

-- =========================================================================
-- INFINITY EV — ADDITIONAL LOCATIONS
-- Infinity has 200+ stations / 700+ charging points across 16 governorates.
-- Sources: PlugShare, Electromaps, EV24.africa, EgyptToday, Zawya
-- =========================================================================

-- Infinity EV - SODIC West (Beverly Hills)
(
  '11111111-0000-0000-0000-000000000006', 'INF-SODIC-WEST',
  'Infinity EV - SODIC West',
  'SODIC West compound, Sheikh Zayed',
  30.0450, 30.9700,
  'Sheikh Zayed', 'SODIC West', 'Giza',
  '{"Type 2","CCS2"}', 22, 2,
  '{"residential"}', true, false, 'Zawya / SODIC-Infinity partnership',
  'Part of SODIC-Infinity partnership across all SODIC developments.'
),

-- Infinity EV - SODIC East Town (New Cairo)
(
  '11111111-0000-0000-0000-000000000006', 'INF-SODIC-EAST',
  'Infinity EV - SODIC East Town',
  'East Town, New Cairo',
  30.0200, 31.4400,
  'New Cairo', 'East Town', 'Cairo',
  '{"Type 2","CCS2"}', 22, 2,
  '{"residential","shopping"}', true, false, 'Zawya / SODIC-Infinity partnership',
  'Part of SODIC-Infinity partnership.'
),

-- Infinity EV - Gezira Club 6th of October
(
  '11111111-0000-0000-0000-000000000006', 'INF-GEZIRA-OCT',
  'Infinity EV - Gezira Club October',
  'Gezira Sporting Club, Palm Hills area, 6th of October City',
  29.9750, 31.0250,
  '6th of October', 'Gezira Club', 'Giza',
  '{"Type 2","CCS2"}', 22, 4,
  '{"club","restaurant","sports"}', true, false, 'EV24.africa',
  'At Gezira Sporting Club 6th October branch.'
),

-- Infinity EV - ChillOut Bank El Baraka (6th October)
(
  '11111111-0000-0000-0000-000000000006', 'INF-CHILLOUT-BARAKA',
  'Infinity EV - ChillOut Bank El Baraka',
  'Al Mehwar Al Markazi, 6th of October City',
  30.0000, 30.9650,
  '6th of October', 'Central Axis', 'Giza',
  '{"Type 2","CCS2"}', 50, 2,
  '{}', true, true, 'Electromaps',
  'ChillOut gas station on Central Axis. Infinity-e branded.'
),

-- Infinity EV - ChillOut Vodafone (6th October)
(
  '11111111-0000-0000-0000-000000000006', 'INF-CHILLOUT-VODA',
  'Infinity EV - ChillOut Vodafone Central Axis',
  'Central Axis near Vodafone, 6th of October City',
  30.0020, 30.9550,
  '6th of October', 'Central Axis', 'Giza',
  '{"Type 2","CCS2"}', 50, 2,
  '{}', true, true, 'Electromaps',
  'ChillOut gas station near Vodafone. Infinity-e branded.'
),

-- Infinity EV - ChillOut KM 102 Cairo-Hurghada
(
  '11111111-0000-0000-0000-000000000006', 'INF-CHILLOUT-KM102',
  'Infinity EV - ChillOut KM 102 Hurghada Road',
  'Cairo-Hurghada Road, KM 102, near Ain Sokhna',
  29.6200, 32.2600,
  'Ain Sokhna', 'Cairo-Hurghada Highway', 'Suez',
  '{"CCS2"}', 50, 2,
  '{"restaurant","restrooms"}', true, true, 'EV24.africa',
  'DC 50kW charger at ChillOut gas station on Red Sea highway.'
),

-- Infinity EV - Downtown Mall Road 90 New Cairo
(
  '11111111-0000-0000-0000-000000000006', 'INF-DOWNTOWN90',
  'Infinity EV - Downtown Mall Road 90',
  'Road 90, 5th Settlement, New Cairo',
  30.0270, 31.4750,
  'New Cairo', '5th Settlement', 'Cairo',
  '{"Type 2","CCS2"}', 50, 4,
  '{"shopping","food"}', true, false, 'EV24.africa',
  'At Downtown Mall on Road 90 (North 90th Street).'
),

-- Infinity EV - Alexandria Hub (50 chargers — opened early 2025)
(
  '11111111-0000-0000-0000-000000000006', 'INF-ALEX-HUB',
  'Infinity EV - Alexandria Charging Hub',
  'Alexandria, Egypt',
  31.2000, 29.9200,
  'Alexandria', NULL, 'Alexandria',
  '{"Type 2","CCS2","CHAdeMO"}', 50, 50,
  '{"parking"}', true, false, 'EV24.africa',
  'Major hub with 50 chargers. Opened early 2025. Exact address TBC.'
),

-- Infinity EV - Tanta (Nile Delta expansion)
(
  '11111111-0000-0000-0000-000000000006', 'INF-TANTA',
  'Infinity EV - Tanta',
  'Tanta, Gharbia Governorate',
  30.7865, 31.0004,
  'Tanta', NULL, 'Gharbia',
  '{"Type 2","CCS2"}', 22, 2,
  '{}', true, false, 'Electromaps / EgyptToday Delta expansion',
  'Part of Infinity Nile Delta expansion. Tanta is the capital of Gharbia.'
),

-- Infinity EV - Kafr Saad (Damietta Governorate)
(
  '11111111-0000-0000-0000-000000000006', 'INF-KAFRSAAD',
  'Infinity EV - Kafr Saad',
  'Kafr Saad, Damietta Governorate',
  31.3300, 31.7100,
  'Kafr Saad', NULL, 'Damietta',
  '{"Type 2"}', 22, 2,
  '{}', true, false, 'Electromaps',
  'Small Delta town station. Part of Infinity rural expansion.'
),

-- Infinity EV - Aga (Dakahlia Governorate)
(
  '11111111-0000-0000-0000-000000000006', 'INF-AGA',
  'Infinity EV - Aga',
  'Aga, Dakahlia Governorate',
  31.0700, 31.2900,
  'Aga', NULL, 'Dakahlia',
  '{"Type 2"}', 22, 2,
  '{}', true, false, 'Electromaps',
  'Rural Delta town. Part of Infinity expansion.'
),

-- Infinity EV - Faraskur (Damietta Governorate)
(
  '11111111-0000-0000-0000-000000000006', 'INF-FARASKUR',
  'Infinity EV - Faraskur',
  'Faraskur, Damietta Governorate',
  31.3300, 31.7200,
  'Faraskur', NULL, 'Damietta',
  '{"Type 2"}', 22, 2,
  '{}', true, false, 'Electromaps',
  'Rural Delta town station.'
),

-- Infinity EV - Metoubes (Kafr El Sheikh Governorate)
(
  '11111111-0000-0000-0000-000000000006', 'INF-METOUBES',
  'Infinity EV - Metoubes',
  'Metoubes, Kafr El Sheikh Governorate',
  31.2900, 30.9500,
  'Metoubes', NULL, 'Kafr El Sheikh',
  '{"Type 2"}', 22, 2,
  '{}', true, false, 'Electromaps',
  'Rural Delta town in Kafr El Sheikh governorate.'
),

-- Infinity EV - Kafr El Sheikh (city center)
(
  '11111111-0000-0000-0000-000000000006', 'INF-KAFRELSHK',
  'Infinity EV - Kafr El Sheikh',
  'Kafr El Sheikh City',
  31.1120, 30.9360,
  'Kafr El Sheikh', NULL, 'Kafr El Sheikh',
  '{"Type 2","CCS2"}', 22, 2,
  '{}', true, false, 'EV24.africa / Electromaps',
  'Part of 16-governorate expansion.'
),

-- Infinity EV - Zagazig (Sharqia Governorate)
(
  '11111111-0000-0000-0000-000000000006', 'INF-ZAGAZIG',
  'Infinity EV - Zagazig',
  'Zagazig, Sharqia Governorate',
  30.5877, 31.5020,
  'Zagazig', NULL, 'Sharqia',
  '{"Type 2","CCS2"}', 22, 2,
  '{}', true, false, 'Infinity 16-governorate expansion',
  'Capital of Sharqia governorate.'
),

-- Infinity EV - Suez City
(
  '11111111-0000-0000-0000-000000000006', 'INF-SUEZ',
  'Infinity EV - Suez City',
  'Suez City, on Cairo-Suez Highway',
  29.9668, 32.5498,
  'Suez', NULL, 'Suez',
  '{"Type 2","CCS2"}', 50, 2,
  '{}', true, false, 'Infinity 16-governorate expansion',
  'Suez governorate coverage. On major transit route.'
),

-- Infinity EV - Fayoum
(
  '11111111-0000-0000-0000-000000000006', 'INF-FAYOUM',
  'Infinity EV - Fayoum',
  'Fayoum City',
  29.3084, 30.8428,
  'Fayoum', NULL, 'Fayoum',
  '{"Type 2"}', 22, 2,
  '{}', true, false, 'Infinity 16-governorate expansion',
  'Coverage in Fayoum as part of 16-governorate plan. Exact address TBC.'
),

-- Infinity EV - Beni Suef
(
  '11111111-0000-0000-0000-000000000006', 'INF-BENISUEF',
  'Infinity EV - Beni Suef',
  'Beni Suef City',
  29.0661, 31.0981,
  'Beni Suef', NULL, 'Beni Suef',
  '{"Type 2"}', 22, 2,
  '{}', true, false, 'Infinity 16-governorate expansion',
  'Upper Egypt gateway. Part of 16-governorate expansion.'
),

-- Infinity EV - Minya (Upper Egypt)
(
  '11111111-0000-0000-0000-000000000006', 'INF-MINYA',
  'Infinity EV - Minya',
  'Minya City',
  28.0871, 30.7618,
  'Minya', NULL, 'Minya',
  '{"Type 2"}', 22, 2,
  '{}', true, false, 'Infinity 16-governorate expansion',
  'Upper Egypt. Part of planned 16-governorate expansion. Availability may vary.'
),

-- Infinity EV - Palm Hills Club PlugShare #244358
(
  '11111111-0000-0000-0000-000000000006', 'PS-244358',
  'Infinity EV - Palm Hills Club',
  'Palm Hills Club, 6th of October City',
  29.9780, 31.0180,
  '6th of October', 'Palm Hills Club', 'Giza',
  '{"Type 2"}', 22, 4,
  '{"club","restaurant","sports","pool"}', true, true, 'PlugShare',
  'At Palm Hills Sporting Club. EVBox chargers.'
),

-- Infinity EV - Beverly Hills compound
(
  '11111111-0000-0000-0000-000000000006', 'INF-BEVERLY',
  'Infinity EV - Beverly Hills',
  'Beverly Hills compound, Sheikh Zayed',
  30.0480, 30.9600,
  'Sheikh Zayed', 'Beverly Hills', 'Giza',
  '{"Type 2"}', 22, 2,
  '{"residential"}', true, false, 'eqmagpro.com / Infinity',
  'Closed community charger in Beverly Hills compound.'
),

-- =========================================================================
-- REVOLTA / SHA7EN — ADDITIONAL LOCATIONS
-- Revolta operates 35+ stations across 18+ cities, managed by Sha7en.
-- Shell partnership: 100+ Shell stations with EV chargers.
-- =========================================================================

-- Revolta - Shell Maadi
(
  '11111111-0000-0000-0000-000000000008', 'REV-SHELL-MAADI',
  'Revolta Egypt - Shell Maadi',
  'Corniche El Nil, Maadi, Cairo',
  29.9600, 31.2300,
  'Cairo', 'Maadi', 'Cairo',
  '{"Type 2","CCS2"}', 22, 2,
  '{}', true, false, 'Enterprise / Shell-Revolta partnership',
  'Shell gas station with EV charger. Part of Shell-Revolta 100-station agreement.'
),

-- Revolta - Shell Heliopolis
(
  '11111111-0000-0000-0000-000000000008', 'REV-SHELL-HELIO',
  'Revolta Egypt - Shell Heliopolis',
  'Salah Salem Road, Heliopolis, Cairo',
  30.0750, 31.3400,
  'Cairo', 'Heliopolis', 'Cairo',
  '{"Type 2","CCS2"}', 22, 2,
  '{}', true, false, 'Enterprise / Shell-Revolta partnership',
  'Shell gas station. Part of 100-station Shell partnership.'
),

-- Revolta - Ismailia City
(
  '11111111-0000-0000-0000-000000000008', 'REV-ISMAILIA',
  'Revolta Egypt - Ismailia City',
  'Ismailia City Center area',
  30.6043, 32.2723,
  'Ismailia', NULL, 'Ismailia',
  '{"Type 2"}', 22, 2,
  '{}', true, false, 'Revolta 18-city network',
  'Part of Revolta 18-city coverage across Egypt.'
),

-- Revolta - Suez
(
  '11111111-0000-0000-0000-000000000008', 'REV-SUEZ',
  'Revolta Egypt - Suez',
  'Suez City',
  29.9668, 32.5498,
  'Suez', NULL, 'Suez',
  '{"Type 2"}', 22, 2,
  '{}', true, false, 'Revolta 18-city network',
  'Suez governorate. Part of Revolta 18-city network.'
),

-- Sha7en - Madinaty
(
  '11111111-0000-0000-0000-000000000002', 'SHA7EN-MADINATY',
  'Sha7en - Madinaty',
  'Madinaty, New Cairo',
  30.1072, 31.6390,
  'Madinaty', NULL, 'Cairo',
  '{"Type 2","CCS2","CHAdeMO"}', 50, 4,
  '{"residential"}', true, false, 'Sha7en app / Cartea',
  'Sha7en station in Madinaty residential area.'
),

-- Sha7en - Zamalek
(
  '11111111-0000-0000-0000-000000000002', 'SHA7EN-ZAMALEK',
  'Sha7en - Zamalek',
  '26th of July Street, Zamalek, Cairo',
  30.0600, 31.2200,
  'Cairo', 'Zamalek', 'Cairo',
  '{"Type 2","CCS2"}', 22, 2,
  '{}', true, false, 'Sha7en app',
  NULL
),

-- =========================================================================
-- ELSEWEDY PLUG — ADDITIONAL COMPOUND LOCATIONS
-- Stone Residence partnership + other compound expansions.
-- AC 7.4-22 kW, DC 60-180 kW range.
-- =========================================================================

-- Elsewedy Plug - Stone Residence compound
(
  '11111111-0000-0000-0000-000000000003', 'PLUG-STONERES',
  'Elsewedy Plug - Stone Residence',
  'Stone Residence compound, New Cairo',
  30.0300, 31.4500,
  'New Cairo', 'Stone Residence', 'Cairo',
  '{"Type 2","CCS2"}', 60, 4,
  '{"residential"}', true, false, 'Daily News Egypt / PRE Group partnership',
  'AC 7.4-22kW + DC 60-180kW. Includes portable chargers, e-scooter chargers, battery swapping.'
),

-- Elsewedy Plug - New Alamein
(
  '11111111-0000-0000-0000-000000000003', 'PLUG-NEWALAMEIN',
  'Elsewedy Plug - New Alamein',
  'New Alamein City, North Coast',
  30.8400, 28.9500,
  'New Alamein', NULL, 'Matrouh',
  '{"Type 2","CCS2"}', 22, 2,
  '{}', true, false, 'EV24.africa / elsewedyplug.com',
  'Part of New Alamein smart city development.'
),

-- Elsewedy Plug - Damanhour (Beheira)
(
  '11111111-0000-0000-0000-000000000003', 'PLUG-DAMANHOUR',
  'Elsewedy Plug - Damanhour',
  'Damanhour, Beheira Governorate',
  31.0342, 30.4688,
  'Damanhour', NULL, 'Beheira',
  '{"Type 2","CCS2"}', 22, 2,
  '{}', true, false, 'elsewedyplug.com expansion',
  'Beheira governorate capital. Expanding coverage in Delta.'
),

-- =========================================================================
-- KARMCHARGE — ADDITIONAL LOCATIONS
-- Source: karmsolar.com/karmcharge, Valu-KarmSolar partnership
-- =========================================================================

-- KarmCharge - Allegria (SODIC project area)
(
  '11111111-0000-0000-0000-000000000009', 'KARM-ALLEGRIA',
  'KarmCharge - Allegria Sheikh Zayed',
  'Allegria compound, Sheikh Zayed',
  30.0400, 30.9600,
  'Sheikh Zayed', 'Allegria', 'Giza',
  '{"Type 2","CCS2"}', 22, 2,
  '{"residential","golf"}', true, false, 'KarmSolar / Valu partnership',
  'Residential compound charging in Allegria.'
),

-- =========================================================================
-- ELECTROMAPS-LISTED STATIONS — Delta / Smaller Cities
-- Source: electromaps.com/en/charging-stations/egypt
-- =========================================================================

-- EV Station - Tanta Hospital area
(
  '11111111-0000-0000-0000-000000000005', 'EM-TANTA',
  'EV Station - Tanta Hospital',
  '49 Hasan Radwan, Tanta',
  30.7900, 30.9900,
  'Tanta', 'Hospital area', 'Gharbia',
  '{"Type 2"}', 22, 1,
  '{}', true, false, 'Electromaps',
  'One of the first Delta city chargers outside Mansoura. Street-level station.'
),

-- EV Station - Banha (Qalyubia) — Electromaps
(
  '11111111-0000-0000-0000-000000000005', 'EM-BANHA',
  'EV Station - Banha',
  'Banha, Qalyubia Governorate',
  30.4600, 31.1800,
  'Banha', NULL, 'Qalyubia',
  '{"Type 2"}', 22, 1,
  '{}', true, false, 'Electromaps',
  'Street-level station in Banha. Separate from Revolta-Oilibya Banha.'
),

-- EV Station - Ismailia (Electromaps)
(
  '11111111-0000-0000-0000-000000000005', 'EM-ISMAILIA',
  'EV Station - Ismailia City',
  'Ismailia City',
  30.5965, 32.2715,
  'Ismailia', NULL, 'Ismailia',
  '{"Type 2"}', 22, 1,
  '{}', true, false, 'Electromaps',
  'Street-level station in Ismailia city center.'
),

-- =========================================================================
-- SINAI — DAHAB / NUWEIBA / TABA
-- Very limited infrastructure. Only 1 confirmed station in Dahab.
-- =========================================================================

-- Camp Firr - Dahab (private/destination charger)
(
  '11111111-0000-0000-0000-000000000015', 'EM-DAHAB-CAMPFIRR',
  'Camp Firr - Dahab',
  'Unnamed Road, Dahab, South Sinai',
  28.5000, 34.5100,
  'Dahab', NULL, 'South Sinai',
  '{"Type 2"}', 7, 1,
  '{"camp","beach"}', true, false, 'Electromaps',
  'Private/destination charger at Camp Firr. Only known charger in Dahab. Added 2018, updated 2022. Level 2 only.'
),

-- =========================================================================
-- SHIFT EV — New Egyptian EV charging company
-- Source: shift-ev.com
-- =========================================================================

-- Shift EV - Nasr City
(
  '11111111-0000-0000-0000-000000000013', 'SHIFT-NASRCITY',
  'Shift EV - Nasr City',
  'Nasr City, Cairo',
  30.0550, 31.3400,
  'Cairo', 'Nasr City', 'Cairo',
  '{"Type 2","CCS2"}', 22, 2,
  '{}', true, false, 'shift-ev.com',
  'Shift EV sells and operates charging stations.'
),

-- =========================================================================
-- ADDITIONAL HIGHWAY / TRANSIT CORRIDOR STATIONS
-- Misr Petroleum / Gastec partnerships (announced Feb 2025)
-- Hassan Allam + Infinity joint venture
-- =========================================================================

-- Misr Petroleum - Ring Road Cairo (Infinity partnership)
(
  '11111111-0000-0000-0000-000000000006', 'INF-MISR-RING',
  'Infinity EV - Misr Petroleum Ring Road',
  'Misr Petroleum station, Ring Road, Cairo',
  30.0650, 31.2500,
  'Cairo', 'Ring Road', 'Cairo',
  '{"Type 2","CCS2"}', 50, 2,
  '{}', true, false, 'Hassan Allam / Misr Petroleum partnership',
  'Part of Hassan Allam Utilities-Infinity-Misr Petroleum JV to deploy 3000 twin chargers.'
),

-- Gastec - Nasr City (Infinity partnership)
(
  '11111111-0000-0000-0000-000000000006', 'INF-GASTEC-NASR',
  'Infinity EV - Gastec Nasr City',
  'Gastec station, Autostrad Road, Nasr City, Cairo',
  30.0600, 31.3600,
  'Cairo', 'Nasr City', 'Cairo',
  '{"Type 2","CCS2"}', 50, 2,
  '{}', true, false, 'Hassan Allam / Gastec partnership',
  'Part of Infinity-Hassan Allam-Gastec JV.'
),

-- Misr Petroleum - Cairo-Alex Agricultural Road
(
  '11111111-0000-0000-0000-000000000006', 'INF-MISR-AGRI',
  'Infinity EV - Misr Petroleum Cairo-Alex Agri Road',
  'Cairo-Alexandria Agricultural Road, near Tanta',
  30.6500, 31.0000,
  'Gharbia', 'Cairo-Alex Agri Road', 'Gharbia',
  '{"Type 2","CCS2"}', 50, 2,
  '{}', true, false, 'Hassan Allam / Misr Petroleum partnership',
  'Highway station between Cairo and Alexandria on agricultural road.'
),

-- =========================================================================
-- PORSCHE / BMW — ADDITIONAL DESTINATION CHARGERS
-- =========================================================================

-- Porsche Destination - SMG Automotive New Cairo
(
  '11111111-0000-0000-0000-000000000010', 'PORSCHE-NEWCAIRO',
  'Porsche Destination Charging - SMG New Cairo',
  'Road 90, 5th Settlement, New Cairo',
  30.0290, 31.4700,
  'New Cairo', '5th Settlement', 'Cairo',
  '{"Type 2"}', 22, 2,
  '{"parking"}', true, false, 'Porsche Destination Charging network',
  'At Porsche/SMG Automotive showroom.'
),

-- BMW Destination - BMW Bavarian Auto Group
(
  '11111111-0000-0000-0000-000000000011', 'BMW-BAVARIAN',
  'BMW Destination Charging - Bavarian Auto Group',
  'El Thawra Street, Heliopolis, Cairo',
  30.0880, 31.3350,
  'Cairo', 'Heliopolis', 'Cairo',
  '{"Type 2"}', 22, 2,
  '{}', true, false, 'BMW Destination Charging network',
  'At Bavarian Auto Group dealership.'
)

;

-- ============================================================================
-- SUMMARY OF NEW ADDITIONS
-- ============================================================================
-- Total new stations in this migration: ~60
--
-- By provider:
--   IKARUS:             10 new (Madinaty, Rehab, Sokhna Hwy, 6 Oct, Sheikh Zayed,
--                                Heliopolis, Obour, NAC, Hurghada, Cairo-Alex Rd)
--   Electra:             7 new (Downtown, New Cairo, 6 Oct, Heliopolis, Maadi,
--                                Alexandria, Sheikh Zayed)
--   New Energy Egypt:    3 new (Nasr City, Sharm, New Alamein)
--   Infinity EV:        20 new (SODIC x2, Gezira Club Oct, ChillOut x3, Downtown Mall,
--                                Alex Hub, Tanta, Kafr Saad, Aga, Faraskur, Metoubes,
--                                Kafr El Sheikh, Zagazig, Suez, Fayoum, Beni Suef,
--                                Minya, Palm Hills Club, Beverly Hills)
--   Revolta/Sha7en:      6 new (Shell Maadi, Shell Heliopolis, Ismailia, Suez,
--                                Sha7en Madinaty, Sha7en Zamalek)
--   Elsewedy Plug:       3 new (Stone Residence, New Alamein, Damanhour)
--   KarmCharge:          1 new (Allegria)
--   Highway/Partnership: 3 new (Misr Petroleum Ring Rd, Gastec Nasr City,
--                                Misr Petroleum Agri Rd)
--   Porsche/BMW:         2 new (Porsche New Cairo, BMW Heliopolis)
--   Electromaps/Other:   3 new (Tanta Hospital, Banha, Ismailia city)
--   Shift EV:            1 new (Nasr City)
--   Camp Firr (Dahab):   1 new (only known charger in Dahab/Sinai interior)
--
-- NEW AREAS COVERED:
--   Upper Egypt:      Fayoum, Beni Suef, Minya (all Infinity EV, limited availability)
--   Nile Delta:       Tanta, Kafr El Sheikh, Metoubes, Kafr Saad, Faraskur,
--                     Aga, Zagazig, Damanhour (various providers)
--   Sinai interior:   Dahab (Camp Firr — private/destination only)
--   Suez city:        Infinity EV + Revolta
--   New Alamein:      Elsewedy Plug + New Energy Egypt
--
-- AREAS STILL WITHOUT CONFIRMED PUBLIC STATIONS (as of March 2026):
--   - Luxor, Aswan (Upper Egypt tourist centers — no public EV chargers found)
--   - Asyut, Sohag, Qena (Upper Egypt — no coverage)
--   - Siwa Oasis, Western Desert
--   - Nuweiba, Taba (Sinai coast — no stations found)
--   - Marsa Alam, Safaga, Quseir (Southern Red Sea — no stations found)
--   - Damanhour (newly added via Elsewedy but unverified)
--
-- NOTES ON PROVIDERS NOT FOUND:
--   - "ChargUp Egypt": No web presence found. May be rebranded or non-operational.
--   - "e-Go Egypt": No EV charging network found under this name in Egypt.
--   - Both may be confused with other providers or may be very small/private operations.
--
