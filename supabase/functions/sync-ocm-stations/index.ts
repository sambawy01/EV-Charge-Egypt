/**
 * Supabase Edge Function: sync-ocm-stations
 *
 * Fetches real Egypt EV charging stations from multiple sources:
 *  1. OpenStreetMap Overpass API (free, no key)
 *  2. OpenChargeMap API (if OCM_API_KEY is set)
 *
 * Upserts results into the stations/connectors tables.
 * Can be invoked on a cron schedule or manually.
 *
 * Environment variables:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-provided)
 *   OCM_API_KEY (optional, for OpenChargeMap source)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';
const OCM_API = 'https://api.openchargemap.io/v3/poi/';
const REAL_DATA_PROVIDER_ID = '11111111-0000-0000-0000-00000000000a';

const CONN_TYPE_MAP: Record<number, string> = {
  1: 'Type2', 2: 'CHAdeMO', 25: 'Type2', 33: 'CCS', 32: 'CCS', 30: 'CCS',
};

interface StationData {
  source: string;
  externalId: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  city: string | null;
  area: string | null;
  isActive: boolean;
  connectors: Array<{
    externalId: string;
    type: string;
    powerKw: number;
    status: string;
  }>;
}

// ---------------------------------------------------------------------------
// Source: Overpass (OSM)
// ---------------------------------------------------------------------------

async function fetchOverpass(): Promise<StationData[]> {
  const query = `[out:json][timeout:25];area["ISO3166-1"="EG"]->.a;(node["amenity"="charging_station"](area.a);way["amenity"="charging_station"](area.a););out center body;`;

  const resp = await fetch(OVERPASS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: query,
  });
  if (!resp.ok) throw new Error(`Overpass ${resp.status}`);

  const data = await resp.json();
  const elements: any[] = data.elements || [];

  return elements.map((el: any) => {
    const tags = el.tags || {};
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (!lat || !lon) return null;

    const socketTypes = [
      { prefix: 'socket:type2', type: 'Type2' },
      { prefix: 'socket:ccs2', type: 'CCS' },
      { prefix: 'socket:ccs', type: 'CCS' },
      { prefix: 'socket:chademo', type: 'CHAdeMO' },
    ];

    const connectors: StationData['connectors'] = [];
    let connIdx = 0;

    for (const { prefix, type } of socketTypes) {
      if (tags[prefix] !== undefined) {
        const qty = parseInt(tags[prefix] || '1', 10) || 1;
        const outputTag = tags[`${prefix}:output`] || '';
        const pwMatch = outputTag.match(/([\d.]+)\s*kW/i);
        const pw = pwMatch ? parseFloat(pwMatch[1]) : (type === 'CCS' ? 50 : 22);
        for (let i = 0; i < qty; i++) {
          connectors.push({
            externalId: `OSM-${el.id}-${type}-${connIdx}`,
            type,
            powerKw: pw,
            status: 'available',
          });
          connIdx++;
        }
      }
    }

    if (connectors.length === 0) {
      const cap = parseInt(tags['capacity'] || tags['capacity:motorcar'] || '1', 10);
      for (let i = 0; i < Math.min(cap, 4); i++) {
        connectors.push({
          externalId: `OSM-${el.id}-generic-${i}`,
          type: 'Type2',
          powerKw: 22,
          status: 'available',
        });
      }
    }

    return {
      source: 'osm',
      externalId: `OSM-${el.id}`,
      name: tags['name'] || tags['operator'] || tags['network'] || `EV Station (OSM ${el.id})`,
      address: [tags['addr:street'], tags['addr:city'], tags['addr:state'], tags['location']]
        .filter(Boolean).join(', ') || tags['location'] || null,
      latitude: lat,
      longitude: lon,
      city: tags['addr:city'] || null,
      area: tags['addr:state'] || tags['addr:city'] || null,
      isActive: true,
      connectors,
    } as StationData;
  }).filter(Boolean) as StationData[];
}

// ---------------------------------------------------------------------------
// Source: OpenChargeMap
// ---------------------------------------------------------------------------

async function fetchOCM(apiKey: string): Promise<StationData[]> {
  const params = new URLSearchParams({
    output: 'json', countrycode: 'EG', maxresults: '1000',
    compact: 'true', verbose: 'false', key: apiKey,
  });

  const resp = await fetch(`${OCM_API}?${params}`, {
    headers: { 'User-Agent': 'EVChargeEgypt-Sync/1.0', Accept: 'application/json' },
  });
  if (!resp.ok) throw new Error(`OCM ${resp.status}`);

  const ocmStations: any[] = await resp.json();

  return ocmStations.map((ocm: any) => {
    const addr = ocm.AddressInfo || {};
    const conns = (ocm.Connections || []).map((c: any) => ({
      externalId: `OCM-CONN-${c.ID}`,
      type: CONN_TYPE_MAP[c.ConnectionTypeID] || 'Type2',
      powerKw: c.PowerKW || 22,
      status: c.StatusType?.IsOperational !== false ? 'available' : 'offline',
    }));
    return {
      source: 'ocm',
      externalId: `OCM-${ocm.ID}`,
      name: addr.Title || `Station OCM-${ocm.ID}`,
      address: [addr.AddressLine1, addr.Town, addr.StateOrProvince].filter(Boolean).join(', ') || null,
      latitude: addr.Latitude,
      longitude: addr.Longitude,
      city: addr.Town || null,
      area: addr.StateOrProvince || addr.Town || null,
      isActive: ocm.StatusType?.IsOperational !== false,
      connectors: conns.length ? conns : [{ externalId: `OCM-GEN-${ocm.ID}`, type: 'Type2', powerKw: 22, status: 'available' }],
    } as StationData;
  });
}

// ---------------------------------------------------------------------------
// Edge function handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ocmKey = Deno.env.get('OCM_API_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Ensure provider row exists
    await supabase.from('providers').upsert(
      { id: REAL_DATA_PROVIDER_ID, name: 'Real Data (OSM+OCM)', slug: 'real-data', adapter_type: 'aggregated', is_active: true },
      { onConflict: 'slug' }
    );

    // Fetch from all sources
    const allStations: StationData[] = [];

    try {
      const osmData = await fetchOverpass();
      allStations.push(...osmData);
      console.log(`Overpass: ${osmData.length} stations`);
    } catch (e) {
      console.error('Overpass failed:', e);
    }

    if (ocmKey) {
      try {
        const ocmData = await fetchOCM(ocmKey);
        allStations.push(...ocmData);
        console.log(`OCM: ${ocmData.length} stations`);
      } catch (e) {
        console.error('OCM failed:', e);
      }
    }

    // Deduplicate by proximity (~100m)
    const unique: StationData[] = [];
    for (const s of allStations) {
      const dup = unique.some(
        (u) => Math.abs(u.latitude - s.latitude) < 0.001 && Math.abs(u.longitude - s.longitude) < 0.001
      );
      if (!dup) unique.push(s);
    }

    // Upsert into database
    let upsertedStations = 0;
    let upsertedConnectors = 0;

    for (const s of unique) {
      const { data: station, error: stationErr } = await supabase
        .from('stations')
        .upsert({
          provider_id: REAL_DATA_PROVIDER_ID,
          external_station_id: s.externalId,
          name: s.name,
          address: s.address,
          latitude: s.latitude,
          longitude: s.longitude,
          city: s.city,
          area: s.area,
          is_active: s.isActive,
          last_synced_at: new Date().toISOString(),
        }, { onConflict: 'provider_id,external_station_id' })
        .select('id')
        .single();

      if (stationErr || !station) {
        console.error(`Failed to upsert ${s.externalId}:`, stationErr);
        continue;
      }
      upsertedStations++;

      for (const c of s.connectors) {
        const { error: connErr } = await supabase
          .from('connectors')
          .upsert({
            station_id: station.id,
            external_connector_id: c.externalId,
            type: c.type,
            power_kw: c.powerKw,
            price_per_kwh: 0,
            status: c.status,
            last_status_check: new Date().toISOString(),
          }, { onConflict: 'station_id,external_connector_id' });
        if (!connErr) upsertedConnectors++;
      }
    }

    // Deactivate old seeded stations that were never synced from a real source
    await supabase
      .from('stations')
      .update({ is_active: false })
      .neq('provider_id', REAL_DATA_PROVIDER_ID)
      .is('last_synced_at', null);

    const summary = {
      sources_tried: ocmKey ? ['overpass', 'ocm'] : ['overpass'],
      total_fetched: allStations.length,
      deduplicated: unique.length,
      stations_upserted: upsertedStations,
      connectors_upserted: upsertedConnectors,
      synced_at: new Date().toISOString(),
    };

    console.log('Sync complete:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('sync-ocm-stations error:', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
