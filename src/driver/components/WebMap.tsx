import React, { useEffect, useId, useMemo } from 'react';
import { Platform } from 'react-native';
import type { Station } from '@/core/types/station';

interface Props {
  stations: Station[];
  onStationPress?: (station: Station) => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

const STATUS_COLOR: Record<string, string> = {
  available: '#10B981',
  partial: '#F59E0B',
  occupied: '#EF4444',
  offline: '#9CA3AF',
};

function buildMapHtml(stations: Station[]): string {
  const markersJson = JSON.stringify(
    stations.map((s) => ({
      id: s.id,
      name: s.name,
      address: s.address ?? '',
      provider: (s as any).provider?.name ?? '',
      latitude: s.latitude,
      longitude: s.longitude,
      status: s.status ?? 'offline',
      color: STATUS_COLOR[s.status ?? 'offline'] ?? '#9CA3AF',
    }))
  );

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
.popup-provider{font-size:12px;color:#6B7280;margin-bottom:2px}
.popup-address{font-size:11px;color:#9CA3AF;margin-bottom:6px}
.popup-status{display:inline-block;font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;color:#fff}
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<script>
var stations=${markersJson};
var map=L.map('map').setView([30.0444,31.2357],11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);

// Plot stations
stations.forEach(function(s){
  L.circleMarker([s.latitude,s.longitude],{
    radius:10,fillColor:s.color,color:'#fff',weight:2,fillOpacity:0.9
  }).addTo(map).bindPopup(
    '<div class="popup-name">'+s.name+'</div>'+
    '<div class="popup-provider">'+s.provider+'</div>'+
    (s.address?'<div class="popup-address">'+s.address+'</div>':'')+
    '<span class="popup-status" style="background:'+s.color+'">'+s.status+'</span>'
  );
});

// Get user location and center map on it
if(navigator.geolocation){
  navigator.geolocation.getCurrentPosition(function(pos){
    var lat=pos.coords.latitude,lng=pos.coords.longitude;
    map.setView([lat,lng],13);
    L.circleMarker([lat,lng],{radius:8,fillColor:'#3B82F6',color:'#fff',weight:3,fillOpacity:1}).addTo(map).bindPopup('<b>You are here</b>').openPopup();
    L.circle([lat,lng],{radius:200,fillColor:'#3B82F6',color:'#3B82F6',weight:1,fillOpacity:0.1}).addTo(map);
  },function(){},{ timeout:10000 });
}
<\/script>
</body>
</html>`;
}

export function WebMap({ stations, onStationPress, userLocation }: Props) {
  const containerId = 'ev-map-' + useId().replace(/:/g, '');

  const html = useMemo(() => buildMapHtml(stations), [stations]);

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
