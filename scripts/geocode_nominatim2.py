#!/usr/bin/env python3
"""
Geocode EV stations via Nominatim using landmark/address queries.
Updates stations where Nominatim returns a significantly better location (>1km diff).
"""

import json
import math
import time
import urllib.parse
import urllib.request
import sys

SUPABASE_URL = "https://plpwojwnzueigukmjidw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBscHdvanduenVlaWd1a21qaWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTM3NjMsImV4cCI6MjA5MDEyOTc2M30.EL5xCe0Xp2CEUAoyLfawkllgBcc5V8gNsbISiXACV-g"

# Egypt bounding box
EG_LAT_MIN, EG_LAT_MAX = 22.0, 31.7
EG_LON_MIN, EG_LON_MAX = 25.0, 37.0

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))

def nominatim_search(query, countrycodes="eg"):
    encoded = urllib.parse.quote(query)
    url = f"https://nominatim.openstreetmap.org/search?q={encoded}&format=json&limit=1&countrycodes={countrycodes}"
    req = urllib.request.Request(url, headers={
        "User-Agent": "EVChargeEgyptApp/1.0 geocoding-fix (contact@evchargeegypt.com)"
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            if data:
                return float(data[0]["lat"]), float(data[0]["lon"]), data[0].get("display_name","")
    except Exception as e:
        print(f"    Nominatim error: {e}", flush=True)
    return None, None, None

def supabase_update(station_id, lat, lon):
    url = f"{SUPABASE_URL}/rest/v1/stations?id=eq.{station_id}"
    payload = json.dumps({
        "latitude": lat,
        "longitude": lon,
        "coordinates_source": "nominatim"
    }).encode()
    req = urllib.request.Request(url, data=payload, method="PATCH", headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status == 204
    except Exception as e:
        print(f"    Supabase update error: {e}", flush=True)
        return False

# Each entry: (id, name, address, city, orig_lat, orig_lon)
# Query strategy: extract the landmark from the name (after the dash), then try with address
def make_queries(name, address, city):
    """Generate a prioritized list of search queries."""
    queries = []
    # Extract landmark part (after " - " or the whole name)
    if " - " in name:
        landmark = name.split(" - ", 1)[1]
        queries.append(f"{landmark} {city} Egypt")
        queries.append(f"{landmark} Egypt")
    # Also try with address
    if address and address != city:
        queries.append(f"{address} Egypt")
        queries.append(f"{address} {city} Egypt")
    # Fallback: city + name
    queries.append(f"{name} Egypt")
    return queries

stations = [
    ("73a80beb-c673-408a-81e3-5f269c50447f","Elsewedy Plug - Ezz Star Mercedes-Benz","Gamal Abdel Naser Axis, 6th of October","6th of October",29.9600,30.9300),
    ("4653b5a7-32c5-4a5b-ac09-0b1d25a6fa92","Elsewedy Plug - Fuel Up 6th of October","Ring Road, 6th of October","6th of October",29.9800,30.9500),
    ("374c719c-13e8-4892-b6a2-4c7b47463fcd","Elsewedy Plug - Mall of Arabia","Sameh Gado Street, Tourist Village 6, 6th of October","6th of October",30.0062,30.9730),
    ("cc672b9e-1d9e-436e-aae5-f3e3b5d196ac","Infinity EV - The Lane","F9, The Lane, 26th of July Corridor, 6th of October","6th of October",30.0350,30.9900),
    ("332eceff-90b5-457f-abaa-5c608d5917af","Revolta Egypt - Mall of Arabia","Mall of Arabia, 6th of October City","6th of October",30.0062,30.9730),
    ("be76858a-af37-4460-bf62-9d00bc4cecfc","Revolta Egypt - Smart Village","Smart Village, Cairo-Alex Desert Road, 6th of October","6th of October",30.0767,31.0189),
    ("bd2f237a-1f3f-4165-a41c-107d835aaf6c","Sha7en - 6th of October","6th of October City","6th of October",30.0000,30.9700),
    ("f01f83ac-7ad6-4255-af3c-e2c06dd7b154","Sha7en Water Park Walkway","Dahshur Link Road, Greenland, 6th of October City","6th of October",30.001667,30.987472),
    ("643a3850-b060-4054-8266-62e2e6468f04","Elsewedy Plug - Il Monte Galala","Ain Sokhna - Zaafarana Road","Ain Sokhna",29.4994,32.4120),
    ("ab574293-55f2-4a40-96cb-db7a81e7c1c2","Elsewedy Plug - Wataniya Sokhna Road","Al-Qattamiya Road, Ain Sokhna","Ain Sokhna",29.686874,32.189142),
    ("5686d18c-4ad1-4631-969d-1ac0ebe87d21","Infinity EV - Blue Blue Ain Sokhna","Blue Blue Resort, Ain Sokhna","Ain Sokhna",29.6200,32.3400),
    ("16e56fa2-adfe-4a8e-8709-51cecaaeccec","IKARUS Al Alamein","International Coastal Road, Alamein","Alamein",30.86554,28.92738),
    ("81af2b76-fd14-4d6d-8ace-98a0ee817f85","Elsewedy Plug - Hilton Alexandria Corniche","El Geish Avenue, Alexandria","Alexandria",31.2616,29.9836),
    ("fe2975ef-a552-4f13-887a-c61d782915d1","Elsewedy Plug - OLA Abis Alexandria","Alex Cairo Agricultural Road, Abis, Alexandria","Alexandria",31.1500,29.9800),
    ("737731b1-a231-4ef5-b03b-4cd95ca81c4b","IKARUS Green Plaza Alexandria","Inside Green Plaza Commercial Complex, Sidi Gaber, Alexandria","Alexandria",31.2064,29.9653),
    ("87658c9a-885e-4349-94e5-e2492a6768ca","Infinity EV - Orouba Mall","Borg El Arab Airport Road, North Coast","Alexandria",31.00639,29.63828),
    ("78f3f84d-f7cb-44cb-8ded-f86c53a09ed3","Revolta Egypt - Kings Ranch Alexandria","10.5 KM Borg El Arab Road, King Mariout, Alexandria","Alexandria",31.1200,29.8900),
    ("fd92f479-6bf2-45d8-a6ec-9ba178d946d9","Sha7en - Green Plaza Mall Alexandria","Behind El Astrouz, Sidi Gaber, Alexandria","Alexandria",31.2064,29.9653),
    ("6e8a52c3-0d5e-41f6-90d6-8d47faefb195","Revolta Egypt - Oilibya Banha","23 July Street, Banha, Qalyubia","Banha",30.4600,31.1800),
    ("88a0d009-bded-45c8-ba66-bd212451a7bc","Revolta Egypt - Watania Cairo-Alex Desert Road","Cairo - Alexandria Desert Road, South Beheira","Beheira",30.5400,30.2500),
    ("5d0f4019-1705-4109-bf27-c9509f573ae6","Elsewedy Plug - Agora Mall","El Nasr Road, Cairo","Cairo",30.0600,31.3500),
    ("ca8bb0cf-21da-414e-a175-90fb11e612c5","Elsewedy Plug - City Stars","Omar Ibn El Khattab, Nasr City","Cairo",30.0737,31.3455),
    ("79195f6c-d063-43a5-8d86-116fc1c8fe41","Elsewedy Plug - Fuel Up Mehwar El Taameer","Mehwar El Taameer, Cairo","Cairo",30.0400,31.2100),
    ("53d9c36e-5065-4de5-b485-9ccb6ed74a0b","Elsewedy Plug - Smash Sporting Club","104 Cairo Airport Road, Sheraton Al Matar, El Nozha","Cairo",30.1060,31.3800),
    ("a66b52de-340a-4dc1-88ee-efb9fcafc372","Elsewedy Plug - Watanya Ghaba Shagareya","El Mosheer Mohamed Aly Fahmy, Cairo","Cairo",30.0850,31.3100),
    ("e90023a2-9301-4eb9-b560-0ac2e42d5085","Elsewedy Plug - Zahraa Maadi (Hub 50)","Cairo Suez Road, Beside Hub 50 Mall, Zahraa El Maadi","Cairo",29.9700,31.3200),
    ("4e9567f8-6b83-43eb-8d72-ddc205b8d7bc","IKARUS Mokattam - El Naser Housing","Abdel Mageed Mahmoud Axis, Mokattam","Cairo",30.016173,31.293934),
    ("50f6483a-3200-4492-8b46-76ed084b387a","Infinity EV - El Nozha Sheraton","Sheraton Al Matar, El Nozha, Cairo","Cairo",30.1100,31.3700),
    ("eac9b641-785e-4d31-b0c2-fda13fc9389d","Infinity EV - Gezira Club Area","Saray El Gezira Street, Zamalek, Cairo","Cairo",30.0530,31.2238),
    ("55aa6434-9f2a-4b16-90df-9e9983c31939","Infinity EV - Lavida New Heliopolis","Lavida Compound, New Heliopolis","Cairo",30.1500,31.4100),
    ("5db9ec1f-b175-4b70-a283-31ac3da50ed8","Infinity EV - Nasr City","Al Hay Al Asher, Nasr City, Cairo","Cairo",30.0500,31.3600),
    ("80a3044d-f407-4bb1-a70c-57ef410d6527","Porsche Destination Charging - Bab Al Louq","7 Al Bustan Street, Bab Al Louq, Qasr El Nil, Cairo","Cairo",30.0505,31.2333),
    ("0b0f6c72-319e-4cbd-a09e-90982c1908f0","Revolta Egypt - Cairo Complex","Anqara, Al Nozha, Cairo","Cairo",30.0900,31.3600),
    ("2917d856-be58-4620-acc7-0badf065834a","Revolta Egypt - Cairo-Suez Road","Cairo-Suez Road, El Basatin","Cairo",29.9800,31.3300),
    ("b8d8f9f8-6539-4ad8-8e3d-8ef9f6f4431d","Revolta Egypt - El Basatin DC Fast","El Basatin, Cairo","Cairo",29.9700,31.2800),
    ("3694160b-710d-40f5-bbb2-1e2264cc5c75","Revolta Egypt - Nasr City","18 Kelani Mohammed Kelani, Masaken Al Mohandesin, Nasr City","Cairo",30.0500,31.3500),
    ("04243155-0fc0-4a72-99a9-c8a23e7da306","Revolta Egypt - Sheraton Al Matar","Sheraton Al Matar, El Nozha, Cairo","Cairo",30.1070,31.3650),
    ("8c04f273-1f84-4547-90fc-9104e5f246c3","EV Station - Amro Al Abbassi Mansoura","Al Abbassi, El Mansoura","El Mansoura",31.0500,31.3800),
    ("51a0a89c-b3b6-4e54-97f1-fb5499f6abfc","EV Station - Saad El Sherbiny Mansoura","Saad El-Sherbiny, El Mansoura","El Mansoura",31.0409,31.3785),
    ("a6a3ce28-7647-410b-b79f-817875db5cbb","Revolta Egypt - Watania Sharm Road (El Tor)","Suez-Sharm El Sheikh Road, El Tor, South Sinai","El Tor",28.2400,33.6200),
    ("aff51206-0821-4457-84f4-fc13afdde7b9","Elsewedy Plug - Four Seasons at The First Residence","35 Giza Street, Giza","Giza",30.0117,31.2117),
    ("141d4b34-004e-42cc-b766-def25f095e0b","Infinity EV - Kerdasah Al Haram","Kerdasah, Al Haram, Giza","Giza",30.0300,31.1100),
    ("efb5c00c-d975-41f9-9643-13c68f5879bd","KarmCharge - Master Rest House","Cairo-Alexandria Highway Rest House","Giza",30.3000,30.7000),
    ("da29ac1d-333e-4913-b0a8-e45d2c49ec32","Revolta Egypt - Kerdasa KM 28","KM 28, Kerdasa, Giza","Giza",30.0200,31.1000),
    ("802e56cb-5063-4549-9edb-ff9a2a6321c8","Elsewedy Plug - City Center Hurghada","Arabia Cornish Road, Hurghada","Hurghada",27.2574,33.8129),
    ("027b3ca9-b344-4d54-af26-682e5de3a4f3","Elsewedy Plug - Hilton Hurghada Plaza","Gabal El Hareem Street, Hurghada","Hurghada",27.2581,33.8306),
    ("f907267c-7e4d-4e03-9bf5-d9775510e840","Elsewedy Plug - Watanya Hurghada","El-Nasr Road, Hurghada","Hurghada",27.2500,33.8300),
    ("01f1d17d-1c30-46ee-a4fb-5834006863c2","Elsewedy Plug - SUT Ismailia Desert Road","Ismailia Desert Road","Ismailia",30.3300,31.8500),
    ("1eab9175-0d65-4cf6-9f59-e91d2fa281df","Elsewedy Plug - ACUD New Capital","New Administrative Capital","New Administrative Capital",30.0200,31.7600),
    ("a2cca40d-e0f7-4d6e-af86-2f5b0a31911b","Elsewedy Plug - Coventry University NAC","Diplomatic Area, New Administrative Capital","New Administrative Capital",30.0275,31.7650),
    ("4f08972c-823c-4446-993b-1f8056264656","Elsewedy Plug - Cairo Festival City Podium","South Teseen, Cairo Festival City, New Cairo","New Cairo",30.0270,31.4091),
    ("08fe0ebc-1948-4adc-a5a2-7418359e2129","Elsewedy Plug - Concord Plaza","South Teseen (90th St South), New Cairo","New Cairo",30.0080,31.4350),
    ("c1dd3dbd-9128-4462-a7ae-87c05cdad631","Elsewedy Plug - Maxim Mall","90th Street North, New Cairo","New Cairo",30.0200,31.4400),
    ("d93d0a22-3422-4f0c-a239-b9b3cc1b1234","Elsewedy Plug - Mivida Compound","Mivida Residential, New Cairo","New Cairo",30.0123,31.5397),
    ("1b4075b7-2d32-492f-a0a6-133e80327dcf","Elsewedy Plug - OLA Energy Mohamed Naguib Axis","Mohammed Nagib Axis, New Cairo","New Cairo",29.975567,31.471748),
    ("7071e1ea-e130-4063-ba38-d3150beea332","Elsewedy Plug - The Square Compound Zone H","Zone H, The Square, New Cairo","New Cairo",30.0150,31.4600),
    ("540930d6-a2dc-4159-901d-0e47d961ab9c","Elsewedy Plug - The Square Compound Zone M","Zone M, The Square, New Cairo","New Cairo",30.0160,31.4620),
    ("f459a0df-a9b9-472d-869e-733d5ee02fd6","Elsewedy Plug - The Yard Mall","Al Sadat Axis, New Cairo","New Cairo",30.0250,31.4500),
    ("25832be6-ecf9-416d-8fd6-a0ba85ecb31b","Elsewedy Plug - Uvenues New Cairo","New Cairo 1","New Cairo",30.0300,31.4700),
    ("840be58c-d12b-4d3c-89c9-8c8225c09326","Elsewedy Plug - Watanya El Rehab","Al Tahrir Axis, El Rehab, New Cairo","New Cairo",30.0580,31.4900),
    ("0359313a-7bb8-47ec-8b38-5e103f8e5fd8","EV Mega Station - Akhnaton New Cairo","120 Akhnaton, New Cairo 1","New Cairo",30.0100,31.4200),
    ("d08e45f5-95d6-4174-87b9-e479614411b1","Fuel Up EV Charger - Wataneya Mostafa Kamel","Wataneya Gas Station, Mostafa Kamel Axis, New Cairo 1","New Cairo",30.0496,31.4416),
    ("f8029cf1-4c08-477d-99f2-19a80aebc980","IKARUS New Cairo - Street 53","142 Street 53, New Cairo 1","New Cairo",30.0180,31.4750),
    ("65de5d7e-ac0a-47cb-9aa7-ec098c79e152","Infinity EV - HQ Mall","HQ Mall, 5th Settlement, New Cairo","New Cairo",30.0100,31.4650),
    ("2814f6e2-57de-4a26-a4f5-1a75bd939832","KarmCharge - District 5 Marakez","District 5, New Katameya, New Cairo","New Cairo",30.0000,31.4800),
    ("2ae1bdb6-4699-454c-b5b7-5e87b634a767","Revolta Egypt - IKEA Cairo Festival City","IKEA Parking, Cairo Festival City, South Teseen, New Cairo","New Cairo",30.0270,31.4091),
    ("96bc05dd-3d38-4da5-af97-c3f7d24b479c","Revolta Egypt - New Cairo 1","New Cairo 1, Cairo","New Cairo",30.0200,31.4700),
    ("bcab95f7-7daf-4334-98e8-4bfd61c86dfe","Sha7en - FUEL UP Police Academy","Mostafa Kamel Axis, New Cairo","New Cairo",30.049583,31.441611),
    ("6452dec4-9923-4f97-b7ba-6290c59c7cf2","Elsewedy Plug - Watanya Port Said","Ismailia - Port Said Road, Port Said","Port Said",31.2800,32.3000),
    ("8543d71f-440b-4b78-ad84-ce4726903406","Revolta Egypt - Watania Port Said","El Shohdaa, Port Said","Port Said",31.2600,32.3000),
    ("2b11c2d8-282d-42ab-9481-1c534f73b4f4","Elsewedy Plug - Americana Plaza","26th of July Corridor, Sheikh Zayed, 6th of October","Sheikh Zayed",30.0272,31.0134),
    ("ec3316e9-8b06-4200-a94e-5a5f390cb79e","Infinity EV - Sheikh Zayed","6th of October City, Sheikh Zayed","Sheikh Zayed",30.0400,30.9800),
    ("d593c2a6-5752-48ae-af2e-1017d36d7ade","KarmCharge - Arkan Plaza","Arkan Plaza, 26th of July Corridor, Sheikh Zayed","Sheikh Zayed",30.0450,31.0050),
    ("9080ab9e-9dc6-4115-875b-cfd2417ba62e","Revolta Egypt - 26th of July Corridor","26th of July Corridor, Sheikh Zayed","Sheikh Zayed",30.0500,31.0000),
    ("f2716729-f00d-4c27-a1e2-8dc9f6e49619","Revolta Egypt - Arkan Plaza","Plot 29, 26th of July Corridor, Sheikh Zayed","Sheikh Zayed",30.0450,31.0050),
    ("2765d8db-889d-4f91-a559-2218320c237d","Revolta Egypt - Capital Business Park","26th of July Corridor, Sheikh Zayed, 6th of October","Sheikh Zayed",30.0560,30.9766),
    ("810b070e-f17f-4966-9393-bb2206f13428","Revolta Egypt - Sheikh Zayed El-Bostan","El-Bostan, Sheikh Zayed, 6th of October","Sheikh Zayed",30.0400,31.0100),
    ("ae6119c5-ff8c-4725-b670-d25155bfcf3b","BMW Destination Charging - Ring Road","Ring Road, Shubra El Kheima","Shubra El Kheima",30.1300,31.2400),
    ("91297a72-98c4-44d6-94d5-1b128eff634f","Sha7en - Shubra El Kheima","Second New Cairo, Shubra El Kheima","Shubra El Kheima",30.1200,31.2500),
    ("2f663a5f-73b5-405b-bed6-c359fe6a4a7b","Sha7en - Stella Walk North Coast","International Coastal Road, Sidi Abdel Rahman, Matrouh","Sidi Abdel Rahman",30.955379,28.768108),
    ("58c62652-6256-45b7-a0e2-08d2015af844","Revolta Egypt - Watania South Sinai","South Sinai","South Sinai",28.5000,33.8500),
]

updated = 0
skipped = 0

print(f"Processing {len(stations)} geocoded stations via Nominatim...\n", flush=True)

for station_id, name, address, city, orig_lat, orig_lon in stations:
    queries = make_queries(name, address, city)
    found_lat, found_lon, display = None, None, None

    for q in queries:
        time.sleep(1.1)  # Respect Nominatim 1 req/sec limit
        found_lat, found_lon, display = nominatim_search(q)
        if found_lat is not None:
            break

    if found_lat is None:
        print(f"  SKIP (no result): {name}", flush=True)
        skipped += 1
        continue

    # Validate it's in Egypt
    if not (EG_LAT_MIN <= found_lat <= EG_LAT_MAX and EG_LON_MIN <= found_lon <= EG_LON_MAX):
        print(f"  SKIP (outside Egypt {found_lat:.4f},{found_lon:.4f}): {name}", flush=True)
        skipped += 1
        continue

    dist = haversine_km(orig_lat, orig_lon, found_lat, found_lon)

    if dist <= 1.0:
        print(f"  OK   (diff {dist:.2f}km, within 1km): {name}", flush=True)
        skipped += 1
        continue

    print(f"  UPDATE (diff {dist:.2f}km): {name}", flush=True)
    print(f"         old: {orig_lat},{orig_lon}  new: {found_lat:.6f},{found_lon:.6f}", flush=True)
    print(f"         match: {display[:80] if display else 'N/A'}", flush=True)

    ok = supabase_update(station_id, round(found_lat, 6), round(found_lon, 6))
    if ok:
        print(f"         -> saved OK", flush=True)
        updated += 1
    else:
        print(f"         -> ERROR saving", flush=True)
        skipped += 1

print(f"\nDone. Updated: {updated}, Skipped/unchanged: {skipped}", flush=True)
