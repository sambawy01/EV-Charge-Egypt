import React, { useEffect, useId, useMemo } from 'react';
import { Platform } from 'react-native';
import type { Station } from '@/core/types/station';

interface Props {
  stations: Station[];
  onStationPress?: (station: Station) => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

const STATUS_COLOR: Record<string, string> = {
  available: '#00FF88',
  partial: '#FFB020',
  occupied: '#FF4D6A',
  offline: '#5A6482',
};

/**
 * Compute a reasonable initial map center and zoom level.
 *
 * Priority:
 *  1. User location (if available)
 *  2. Center of the bounding box of all stations
 *  3. Cairo default
 */
function computeInitialView(
  stations: Station[],
  userLocation?: { latitude: number; longitude: number } | null
): { lat: number; lng: number; zoom: number } {
  // Default: Cairo
  let lat = 30.0444;
  let lng = 31.2357;
  let zoom = 7; // country-wide zoom for Egypt

  if (userLocation) {
    lat = userLocation.latitude;
    lng = userLocation.longitude;
    zoom = 11; // neighborhood-level zoom when we know the user's location
  } else if (stations.length > 0) {
    // Compute bounding box center
    let minLat = Infinity,
      maxLat = -Infinity,
      minLng = Infinity,
      maxLng = -Infinity;
    for (const s of stations) {
      if (s.latitude < minLat) minLat = s.latitude;
      if (s.latitude > maxLat) maxLat = s.latitude;
      if (s.longitude < minLng) minLng = s.longitude;
      if (s.longitude > maxLng) maxLng = s.longitude;
    }
    lat = (minLat + maxLat) / 2;
    lng = (minLng + maxLng) / 2;

    // Determine zoom from spread
    const spread = Math.max(maxLat - minLat, maxLng - minLng);
    if (spread < 0.05) zoom = 14;
    else if (spread < 0.2) zoom = 12;
    else if (spread < 1) zoom = 10;
    else if (spread < 3) zoom = 8;
    else zoom = 7;
  }

  return { lat, lng, zoom };
}

function buildMapHtml(
  stations: Station[],
  userLocation?: { latitude: number; longitude: number } | null
): string {
  const { lat, lng, zoom } = computeInitialView(stations, userLocation);

  const markersJson = JSON.stringify(
    stations.map((s) => ({
      id: s.id,
      name: s.name,
      address: s.address ?? '',
      provider: (s as any).provider?.name ?? '',
      latitude: s.latitude,
      longitude: s.longitude,
      status: s.status ?? 'offline',
      color: STATUS_COLOR[s.status ?? 'offline'] ?? '#5A6482',
      distance: s.distance_km != null ? s.distance_km.toFixed(1) + ' km' : '',
      connectors: (s.connectors || [])
        .map((c) => c.type + ' ' + c.power_kw + 'kW')
        .join(', '),
    }))
  );

  const userLocJson = userLocation
    ? JSON.stringify({ lat: userLocation.latitude, lng: userLocation.longitude })
    : 'null';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body,#map{width:100%;height:100%}
.popup-name{font-weight:700;font-size:14px;margin-bottom:4px}
.popup-provider{font-size:12px;color:#8892B0;margin-bottom:2px}
.popup-address{font-size:11px;color:#5A6482;margin-bottom:4px}
.popup-connectors{font-size:11px;color:#F0F4FF;margin-bottom:4px}
.popup-distance{font-size:11px;color:#00D4FF;font-weight:600;margin-bottom:6px}
.popup-status{display:inline-block;font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;color:#FFFFFF}
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<script>
var stations=${markersJson};
var userLoc=${userLocJson};
var map=L.map('map').setView([${lat},${lng}],${zoom});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'OpenStreetMap'}).addTo(map);

// Plot user location if known
if(userLoc){
  L.circleMarker([userLoc.lat,userLoc.lng],{radius:8,fillColor:'#00D4FF',color:'#FFFFFF',weight:3,fillOpacity:1}).addTo(map).bindPopup('<b>You are here</b>');
  L.circle([userLoc.lat,userLoc.lng],{radius:300,fillColor:'#00D4FF',color:'#00D4FF',weight:1,fillOpacity:0.1}).addTo(map);
}

// Plot stations
var bounds=[];
stations.forEach(function(s){
  bounds.push([s.latitude,s.longitude]);
  L.circleMarker([s.latitude,s.longitude],{
    radius:10,fillColor:s.color,color:'#FFFFFF',weight:2,fillOpacity:0.9
  }).addTo(map).bindPopup(
    '<div class="popup-name">'+s.name+'</div>'+
    '<div class="popup-provider">'+s.provider+'</div>'+
    (s.address?'<div class="popup-address">'+s.address+'</div>':'')+
    (s.connectors?'<div class="popup-connectors">'+s.connectors+'</div>':'')+
    (s.distance?'<div class="popup-distance">'+s.distance+' away</div>':'')+
    '<span class="popup-status" style="background:'+s.color+'">'+s.status+'</span>'
  );
});

// If we have both user location and stations, fit the map to show user + nearest stations
if(userLoc && bounds.length>0){
  bounds.push([userLoc.lat,userLoc.lng]);
  // Show at most the 5 nearest stations in the initial view
  var nearSorted=stations.slice().sort(function(a,b){
    var da=Math.abs(a.latitude-userLoc.lat)+Math.abs(a.longitude-userLoc.lng);
    var db=Math.abs(b.latitude-userLoc.lat)+Math.abs(b.longitude-userLoc.lng);
    return da-db;
  });
  var fitBounds=[[userLoc.lat,userLoc.lng]];
  nearSorted.slice(0,5).forEach(function(s){fitBounds.push([s.latitude,s.longitude]);});
  try{map.fitBounds(fitBounds,{padding:[40,40],maxZoom:13});}catch(e){}
} else if(!userLoc && bounds.length>1){
  try{map.fitBounds(bounds,{padding:[40,40],maxZoom:13});}catch(e){}
}
<\/script>
</body>
</html>`;
}

export function WebMap({ stations, onStationPress, userLocation }: Props) {
  const containerId = 'ev-map-' + useId().replace(/:/g, '');

  const html = useMemo(() => buildMapHtml(stations, userLocation), [stations, userLocation]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const container = document.getElementById(containerId);
    if (!container) return;

    // Remove old iframe
    const old = container.querySelector('iframe');
    if (old) old.remove();

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
    iframe.title = 'EV Stations Map';
    iframe.allow = 'geolocation';
    container.appendChild(iframe);

    // Write content
    const doc = iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    }
  }, [html, containerId]);

  if (Platform.OS !== 'web') return null;

  // Use dangerouslySetInnerHTML to create a real DOM div that we can target by ID
  return (
    <div
      id={containerId}
      style={{ width: '100%', height: '100%', minHeight: 400 }}
    />
  );
}
