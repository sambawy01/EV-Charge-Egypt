#!/usr/bin/env bash
# Geocode all 'geocoded' stations via Nominatim and update if result is better

SUPABASE_URL="https://plpwojwnzueigukmjidw.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBscHdvanduenVlaWd1a21qaWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTM3NjMsImV4cCI6MjA5MDEyOTc2M30.EL5xCe0Xp2CEUAoyLfawkllgBcc5V8gNsbISiXACV-g"

echo "Stations with geocoded source — querying Nominatim..."
echo ""

UPDATED=0
SKIPPED=0

# Each station: id|name|city|lat|lon
# Passed in via heredoc below
process_station() {
  local ID="$1"
  local NAME="$2"
  local CITY="$3"
  local ORIG_LAT="$4"
  local ORIG_LON="$5"

  # URL-encode query
  QUERY="${NAME} ${CITY} Egypt"
  ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$QUERY'))" 2>/dev/null || \
            python -c "import urllib, sys; print urllib.quote(sys.argv[1])" "$QUERY" 2>/dev/null || \
            echo "${QUERY// /+}")

  RESULT=$(curl -s \
    -H "User-Agent: EVChargeEgyptApp/1.0 (contact@evchargeegypt.com)" \
    "https://nominatim.openstreetmap.org/search?q=${ENCODED}&format=json&limit=1&countrycodes=eg")

  # Extract lat/lon
  NEW_LAT=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['lat'] if d else '')" 2>/dev/null)
  NEW_LON=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['lon'] if d else '')" 2>/dev/null)

  if [ -z "$NEW_LAT" ] || [ -z "$NEW_LON" ]; then
    echo "  SKIP (no result): $NAME"
    SKIPPED=$((SKIPPED+1))
    return
  fi

  # Check it's in Egypt bounding box: lat 22-31.7, lon 25-37
  LAT_OK=$(python3 -c "print('1' if 22.0 <= float('$NEW_LAT') <= 31.7 else '0')" 2>/dev/null)
  LON_OK=$(python3 -c "print('1' if 25.0 <= float('$NEW_LON') <= 37.0 else '0')" 2>/dev/null)
  if [ "$LAT_OK" != "1" ] || [ "$LON_OK" != "1" ]; then
    echo "  SKIP (outside Egypt): $NAME -> $NEW_LAT,$NEW_LON"
    SKIPPED=$((SKIPPED+1))
    return
  fi

  # Calculate distance in km (Haversine approx)
  DIST=$(python3 -c "
import math
lat1,lon1,lat2,lon2 = float('$ORIG_LAT'),float('$ORIG_LON'),float('$NEW_LAT'),float('$NEW_LON')
R=6371
dlat=math.radians(lat2-lat1); dlon=math.radians(lon2-lon1)
a=math.sin(dlat/2)**2+math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(dlon/2)**2
print(round(R*2*math.asin(math.sqrt(a)),3))
" 2>/dev/null)

  if [ -z "$DIST" ]; then
    echo "  SKIP (distance calc failed): $NAME"
    SKIPPED=$((SKIPPED+1))
    return
  fi

  # Only update if difference > 1km
  NEEDS_UPDATE=$(python3 -c "print('1' if float('$DIST') > 1.0 else '0')" 2>/dev/null)
  if [ "$NEEDS_UPDATE" != "1" ]; then
    echo "  OK   (diff ${DIST}km, within 1km): $NAME"
    SKIPPED=$((SKIPPED+1))
    return
  fi

  echo "  UPDATE (diff ${DIST}km): $NAME"
  echo "         old: $ORIG_LAT,$ORIG_LON  new: $NEW_LAT,$NEW_LON"

  # Update via Supabase REST API
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X PATCH \
    "${SUPABASE_URL}/rest/v1/stations?id=eq.${ID}" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d "{\"latitude\": ${NEW_LAT}, \"longitude\": ${NEW_LON}, \"coordinates_source\": \"nominatim\"}")

  if [ "$HTTP_STATUS" = "204" ]; then
    echo "         -> saved OK"
    UPDATED=$((UPDATED+1))
  else
    echo "         -> ERROR HTTP $HTTP_STATUS"
  fi
}

# Station data: id|name|city|lat|lon
stations=(
"73a80beb-c673-408a-81e3-5f269c50447f|Elsewedy Plug - Ezz Star Mercedes-Benz|6th of October|29.9600|30.9300"
"4653b5a7-32c5-4a5b-ac09-0b1d25a6fa92|Elsewedy Plug - Fuel Up 6th of October|6th of October|29.9800|30.9500"
"374c719c-13e8-4892-b6a2-4c7b47463fcd|Elsewedy Plug - Mall of Arabia|6th of October|30.0062|30.9730"
"cc672b9e-1d9e-436e-aae5-f3e3b5d196ac|Infinity EV - The Lane|6th of October|30.0350|30.9900"
"332eceff-90b5-457f-abaa-5c608d5917af|Revolta Egypt - Mall of Arabia|6th of October|30.0062|30.9730"
"be76858a-af37-4460-bf62-9d00bc4cecfc|Revolta Egypt - Smart Village|6th of October|30.0767|31.0189"
"bd2f237a-1f3f-4165-a41c-107d835aaf6c|Sha7en - 6th of October|6th of October|30.0000|30.9700"
"f01f83ac-7ad6-4255-af3c-e2c06dd7b154|Sha7en Water Park Walkway|6th of October|30.001667|30.987472"
"643a3850-b060-4054-8266-62e2e6468f04|Elsewedy Plug - Il Monte Galala|Ain Sokhna|29.4994|32.4120"
"ab574293-55f2-4a40-96cb-db7a81e7c1c2|Elsewedy Plug - Wataniya Sokhna Road|Ain Sokhna|29.686874|32.189142"
"5686d18c-4ad1-4631-969d-1ac0ebe87d21|Infinity EV - Blue Blue Ain Sokhna|Ain Sokhna|29.6200|32.3400"
"16e56fa2-adfe-4a8e-8709-51cecaaeccec|IKARUS Al Alamein|Alamein|30.86554|28.92738"
"81af2b76-fd14-4d6d-8ace-98a0ee817f85|Elsewedy Plug - Hilton Alexandria Corniche|Alexandria|31.2616|29.9836"
"fe2975ef-a552-4f13-887a-c61d782915d1|Elsewedy Plug - OLA Abis Alexandria|Alexandria|31.1500|29.9800"
"737731b1-a231-4ef5-b03b-4cd95ca81c4b|IKARUS Green Plaza Alexandria|Alexandria|31.2064|29.9653"
"87658c9a-885e-4349-94e5-e2492a6768ca|Infinity EV - Orouba Mall|Alexandria|31.00639|29.63828"
"78f3f84d-f7cb-44cb-8ded-f86c53a09ed3|Revolta Egypt - Kings Ranch Alexandria|Alexandria|31.1200|29.8900"
"fd92f479-6bf2-45d8-a6ec-9ba178d946d9|Sha7en - Green Plaza Mall Alexandria|Alexandria|31.2064|29.9653"
"6e8a52c3-0d5e-41f6-90d6-8d47faefb195|Revolta Egypt - Oilibya Banha|Banha|30.4600|31.1800"
"88a0d009-bded-45c8-ba66-bd212451a7bc|Revolta Egypt - Watania Cairo-Alex Desert Road|Beheira|30.5400|30.2500"
"5d0f4019-1705-4109-bf27-c9509f573ae6|Elsewedy Plug - Agora Mall|Cairo|30.0600|31.3500"
"ca8bb0cf-21da-414e-a175-90fb11e612c5|Elsewedy Plug - City Stars|Cairo|30.0737|31.3455"
"79195f6c-d063-43a5-8d86-116fc1c8fe41|Elsewedy Plug - Fuel Up Mehwar El Taameer|Cairo|30.0400|31.2100"
"53d9c36e-5065-4de5-b485-9ccb6ed74a0b|Elsewedy Plug - Smash Sporting Club|Cairo|30.1060|31.3800"
"a66b52de-340a-4dc1-88ee-efb9fcafc372|Elsewedy Plug - Watanya Ghaba Shagareya|Cairo|30.0850|31.3100"
"e90023a2-9301-4eb9-b560-0ac2e42d5085|Elsewedy Plug - Zahraa Maadi Hub 50|Cairo|29.9700|31.3200"
"4e9567f8-6b83-43eb-8d72-ddc205b8d7bc|IKARUS Mokattam El Naser Housing|Cairo|30.016173|31.293934"
"50f6483a-3200-4492-8b46-76ed084b387a|Infinity EV - El Nozha Sheraton|Cairo|30.1100|31.3700"
"eac9b641-785e-4d31-b0c2-fda13fc9389d|Infinity EV - Gezira Club Area|Cairo|30.0530|31.2238"
"55aa6434-9f2a-4b16-90df-9e9983c31939|Infinity EV - Lavida New Heliopolis|Cairo|30.1500|31.4100"
"5db9ec1f-b175-4b70-a283-31ac3da50ed8|Infinity EV - Nasr City|Cairo|30.0500|31.3600"
"80a3044d-f407-4bb1-a70c-57ef410d6527|Porsche Destination Charging - Bab Al Louq|Cairo|30.0505|31.2333"
"0b0f6c72-319e-4cbd-a09e-90982c1908f0|Revolta Egypt - Cairo Complex|Cairo|30.0900|31.3600"
"2917d856-be58-4620-acc7-0badf065834a|Revolta Egypt - Cairo-Suez Road|Cairo|29.9800|31.3300"
"b8d8f9f8-6539-4ad8-8e3d-8ef9f6f4431d|Revolta Egypt - El Basatin DC Fast|Cairo|29.9700|31.2800"
"3694160b-710d-40f5-bbb2-1e2264cc5c75|Revolta Egypt - Nasr City|Cairo|30.0500|31.3500"
"04243155-0fc0-4a72-99a9-c8a23e7da306|Revolta Egypt - Sheraton Al Matar|Cairo|30.1070|31.3650"
"8c04f273-1f84-4547-90fc-9104e5f246c3|EV Station - Amro Al Abbassi Mansoura|El Mansoura|31.0500|31.3800"
"51a0a89c-b3b6-4e54-97f1-fb5499f6abfc|EV Station - Saad El Sherbiny Mansoura|El Mansoura|31.0409|31.3785"
"a6a3ce28-7647-410b-b79f-817875db5cbb|Revolta Egypt - Watania Sharm Road El Tor|El Tor|28.2400|33.6200"
"aff51206-0821-4457-84f4-fc13afdde7b9|Elsewedy Plug - Four Seasons First Residence|Giza|30.0117|31.2117"
"141d4b34-004e-42cc-b766-def25f095e0b|Infinity EV - Kerdasah Al Haram|Giza|30.0300|31.1100"
"efb5c00c-d975-41f9-9643-13c68f5879bd|KarmCharge - Master Rest House Cairo-Alexandria Highway|Giza|30.3000|30.7000"
"da29ac1d-333e-4913-b0a8-e45d2c49ec32|Revolta Egypt - Kerdasa KM 28|Giza|30.0200|31.1000"
"802e56cb-5063-4549-9edb-ff9a2a6321c8|Elsewedy Plug - City Center Hurghada|Hurghada|27.2574|33.8129"
"027b3ca9-b344-4d54-af26-682e5de3a4f3|Elsewedy Plug - Hilton Hurghada Plaza|Hurghada|27.2581|33.8306"
"f907267c-7e4d-4e03-9bf5-d9775510e840|Elsewedy Plug - Watanya Hurghada|Hurghada|27.2500|33.8300"
"01f1d17d-1c30-46ee-a4fb-5834006863c2|Elsewedy Plug - SUT Ismailia Desert Road|Ismailia|30.3300|31.8500"
"1eab9175-0d65-4cf6-9f59-e91d2fa281df|Elsewedy Plug - ACUD New Capital|New Administrative Capital|30.0200|31.7600"
"a2cca40d-e0f7-4d6e-af86-2f5b0a31911b|Elsewedy Plug - Coventry University NAC|New Administrative Capital|30.0275|31.7650"
"4f08972c-823c-4446-993b-1f8056264656|Elsewedy Plug - Cairo Festival City Podium|New Cairo|30.0270|31.4091"
"08fe0ebc-1948-4adc-a5a2-7418359e2129|Elsewedy Plug - Concord Plaza|New Cairo|30.0080|31.4350"
"c1dd3dbd-9128-4462-a7ae-87c05cdad631|Elsewedy Plug - Maxim Mall|New Cairo|30.0200|31.4400"
"d93d0a22-3422-4f0c-a239-b9b3cc1b1234|Elsewedy Plug - Mivida Compound|New Cairo|30.0123|31.5397"
"1b4075b7-2d32-492f-a0a6-133e80327dcf|Elsewedy Plug - OLA Energy Mohamed Naguib Axis|New Cairo|29.975567|31.471748"
"7071e1ea-e130-4063-ba38-d3150beea332|Elsewedy Plug - The Square Compound Zone H|New Cairo|30.0150|31.4600"
"540930d6-a2dc-4159-901d-0e47d961ab9c|Elsewedy Plug - The Square Compound Zone M|New Cairo|30.0160|31.4620"
"f459a0df-a9b9-472d-869e-733d5ee02fd6|Elsewedy Plug - The Yard Mall|New Cairo|30.0250|31.4500"
"25832be6-ecf9-416d-8fd6-a0ba85ecb31b|Elsewedy Plug - Uvenues New Cairo|New Cairo|30.0300|31.4700"
"840be58c-d12b-4d3c-89c9-8c8225c09326|Elsewedy Plug - Watanya El Rehab|New Cairo|30.0580|31.4900"
"0359313a-7bb8-47ec-8b38-5e103f8e5fd8|EV Mega Station - Akhnaton New Cairo|New Cairo|30.0100|31.4200"
"d08e45f5-95d6-4174-87b9-e479614411b1|Fuel Up EV Charger - Wataneya Mostafa Kamel|New Cairo|30.0496|31.4416"
"f8029cf1-4c08-477d-99f2-19a80aebc980|IKARUS New Cairo - Street 53|New Cairo|30.0180|31.4750"
"65de5d7e-ac0a-47cb-9aa7-ec098c79e152|Infinity EV - HQ Mall|New Cairo|30.0100|31.4650"
"2814f6e2-57de-4a26-a4f5-1a75bd939832|KarmCharge - District 5 Marakez|New Cairo|30.0000|31.4800"
"2ae1bdb6-4699-454c-b5b7-5e87b634a767|Revolta Egypt - IKEA Cairo Festival City|New Cairo|30.0270|31.4091"
"96bc05dd-3d38-4da5-af97-c3f7d24b479c|Revolta Egypt - New Cairo 1|New Cairo|30.0200|31.4700"
"bcab95f7-7daf-4334-98e8-4bfd61c86dfe|Sha7en - FUEL UP Police Academy|New Cairo|30.049583|31.441611"
"6452dec4-9923-4f97-b7ba-6290c59c7cf2|Elsewedy Plug - Watanya Port Said|Port Said|31.2800|32.3000"
"8543d71f-440b-4b78-ad84-ce4726903406|Revolta Egypt - Watania Port Said|Port Said|31.2600|32.3000"
"2b11c2d8-282d-42ab-9481-1c534f73b4f4|Elsewedy Plug - Americana Plaza|Sheikh Zayed|30.0272|31.0134"
"ec3316e9-8b06-4200-a94e-5a5f390cb79e|Infinity EV - Sheikh Zayed|Sheikh Zayed|30.0400|30.9800"
"d593c2a6-5752-48ae-af2e-1017d36d7ade|KarmCharge - Arkan Plaza|Sheikh Zayed|30.0450|31.0050"
"9080ab9e-9dc6-4115-875b-cfd2417ba62e|Revolta Egypt - 26th of July Corridor|Sheikh Zayed|30.0500|31.0000"
"f2716729-f00d-4c27-a1e2-8dc9f6e49619|Revolta Egypt - Arkan Plaza|Sheikh Zayed|30.0450|31.0050"
"2765d8db-889d-4f91-a559-2218320c237d|Revolta Egypt - Capital Business Park|Sheikh Zayed|30.0560|30.9766"
"810b070e-f17f-4966-9393-bb2206f13428|Revolta Egypt - Sheikh Zayed El-Bostan|Sheikh Zayed|30.0400|31.0100"
"ae6119c5-ff8c-4725-b670-d25155bfcf3b|BMW Destination Charging - Ring Road|Shubra El Kheima|30.1300|31.2400"
"91297a72-98c4-44d6-94d5-1b128eff634f|Sha7en - Shubra El Kheima|Shubra El Kheima|30.1200|31.2500"
"2f663a5f-73b5-405b-bed6-c359fe6a4a7b|Sha7en - Stella Walk North Coast|Sidi Abdel Rahman|30.955379|28.768108"
"58c62652-6256-45b7-a0e2-08d2015af844|Revolta Egypt - Watania South Sinai|South Sinai|28.5000|33.8500"
)

total=${#stations[@]}
echo "Processing $total stations..."
echo ""

for entry in "${stations[@]}"; do
  IFS='|' read -r ID NAME CITY LAT LON <<< "$entry"
  process_station "$ID" "$NAME" "$CITY" "$LAT" "$LON"
  sleep 1
done

echo ""
echo "Done. Updated: $UPDATED, Skipped/unchanged: $SKIPPED"
