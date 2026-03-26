-- ============================================================================
-- New EV Stations — March 27, 2026
-- 20 new stations + 3 coordinate fixes + 1 metadata fix
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Fix IKARUS Mokattam coordinates (was pointing outside Cairo)
UPDATE stations SET latitude = 30.0133, longitude = 31.2833
WHERE name = 'IKARUS Mokattam - El Naser Housing';

-- Fix Four Seasons First Residence (was in New Cairo, should be Giza/Nile)
UPDATE stations SET latitude = 30.0240, longitude = 31.2176
WHERE name = 'Elsewedy Plug - Four Seasons at The First Residence';

-- Fix HQ Mall (was in New Capital, should be 5th Settlement)
UPDATE stations SET latitude = 30.0280, longitude = 31.4800
WHERE name = 'Infinity EV - HQ Mall';

-- Fix Agora Mall metadata (coords OK, but city/area was wrong)
UPDATE stations SET city = 'Sheikh Zayed', area = 'Agora Mall'
WHERE name = 'Elsewedy Plug - Agora Mall';

-- ============================================================================
-- INSERT NEW STATIONS
-- ============================================================================

INSERT INTO stations (name, address, latitude, longitude, city, area, is_active) VALUES

-- El Gouna / Red Sea
('Infinity EV - Gourmet Egypt El Gouna',
 '1 Tariaq Bedon Esm, El Gouna, Hurghada',
 27.399294, 33.663479, 'El Gouna', 'Downtown', true),

('IKARUS Zafarana',
 'Ras Al-Zafarana Rest Area, Cairo-Hurghada Road',
 29.1100, 32.6600, 'Zafarana', 'Cairo-Hurghada Highway', true),

('Revolta Egypt - Wataniya Ras Gharib',
 'Al Ismaileya Road, Ras Gharib, Red Sea',
 28.3600, 33.0800, 'Ras Gharib', 'Cairo-Hurghada Highway', true),

-- Sharm El Sheikh (COP27 Infinity EV installations)
('Infinity EV - Naama Bay Sharm El Sheikh',
 'Naama Bay, Sharm El Sheikh',
 27.9074, 34.3298, 'Sharm El Sheikh', 'Naama Bay', true),

('Infinity EV - Old Market Sharm El Sheikh',
 'Old Market area, Sharm El Sheikh',
 27.8600, 34.2900, 'Sharm El Sheikh', 'Old Market', true),

('Infinity EV - Sharm El Sheikh Airport',
 'Sharm El Sheikh International Airport area',
 27.9770, 34.3950, 'Sharm El Sheikh', 'Airport', true),

('Infinity EV - SOHO Square Sharm El Sheikh',
 'SOHO Square, Sharm El Sheikh',
 27.8856, 34.3100, 'Sharm El Sheikh', 'SOHO Square', true),

-- Cairo Malls & Compounds (Infinity EV)
('Infinity EV - The Nox',
 'Plot 341-345, North 90th St, 5th Settlement, New Cairo',
 30.0300, 31.4850, 'New Cairo', '5th Settlement', true),

('Infinity EV - City Center Almaza',
 'City Center Almaza Mall, Heliopolis, Cairo',
 30.0950, 31.3950, 'Cairo', 'Heliopolis', true),

('Infinity EV - Mall of Egypt',
 'El Wahat Road, 6th of October City',
 30.0142, 31.0169, '6th of October', 'Mall of Egypt', true),

('Infinity EV - Palm Hills',
 'Palm Hills compound, 6th of October City',
 29.9800, 31.0200, '6th of October', 'Palm Hills', true),

('Infinity EV - New Giza',
 'New Giza compound, Cairo-Alex Desert Road',
 30.0100, 31.0050, '6th of October', 'New Giza', true),

-- Nile Delta
('Infinity EV - Mansoura Circle K',
 'Abd El-Salam Aref, Circle K station, El Mansoura',
 31.0420, 31.3650, 'El Mansoura', NULL, true),

('Infinity EV - Shebin El Koum',
 'Shebin El Koum, Menoufia',
 30.5580, 31.0150, 'Shebin El Koum', NULL, true),

('Infinity EV - Damietta',
 'Damietta City',
 31.4175, 31.8144, 'Damietta', NULL, true),

-- New Elsewedy Plug locations
('Elsewedy Plug - 10th of Ramadan City',
 '10th of Ramadan City, Sharqia',
 30.2900, 31.7800, '10th of Ramadan', NULL, true),

('Elsewedy Plug - R7 New Capital',
 'R7 Neighborhood, New Administrative Capital',
 30.0180, 31.7700, 'New Administrative Capital', 'R7', true),

('Elsewedy Plug - Governmental District',
 'Governmental District, New Administrative Capital',
 30.0220, 31.7580, 'New Administrative Capital', 'Governmental District', true),

('Elsewedy Plug - Sidi Beshr',
 'Sidi Beshr, Alexandria',
 31.2450, 29.9900, 'Alexandria', 'Sidi Beshr', true),

-- El Shorouk
('smileyEV - El Shorouk',
 'El Shorouk City, Cairo',
 30.1150, 31.6100, 'El Shorouk', NULL, true)

;
