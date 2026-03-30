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

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '';

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
      verified: (s as any).is_verified || false,
    }))
  );

  const userLocJson = userLocation
    ? JSON.stringify({ lat: userLocation.latitude, lng: userLocation.longitude })
    : 'null';

  // If no API key, fall back to OpenStreetMap via Leaflet
  if (!GOOGLE_MAPS_KEY) {
    return buildFallbackHtml(markersJson, userLocJson, lat, lng, zoom);
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body,#map{width:100%;height:100%;background:#0A0E1A}
/* Dark-themed info window overrides */
.gm-style .gm-style-iw-c{background:#141B2D !important;border-radius:12px !important;padding:0 !important;box-shadow:0 4px 20px rgba(0,212,255,0.15) !important;border:1px solid #2A3350 !important}
.gm-style .gm-style-iw-d{overflow:auto !important;background:#141B2D !important}
.gm-style .gm-style-iw-tc{display:none !important}
.gm-style .gm-style-iw-t::after{background:#141B2D !important;box-shadow:none !important}
.gm-style .gm-ui-hover-effect{filter:invert(1) !important;opacity:0.7 !important}
.gm-style .gm-style-iw-chr{position:absolute !important;top:4px !important;right:4px !important}
.gm-style .gm-style-iw{background:#141B2D !important}
</style>
</head>
<body>
<div id="map"></div>
<script>
var stations=${markersJson};
var userLoc=${userLocJson};

var DARK_STYLE=[
  {elementType:'geometry',stylers:[{color:'#0A0E1A'}]},
  {elementType:'labels.text.stroke',stylers:[{color:'#0A0E1A'}]},
  {elementType:'labels.text.fill',stylers:[{color:'#5A6482'}]},
  {featureType:'road',elementType:'geometry',stylers:[{color:'#1C2438'}]},
  {featureType:'road',elementType:'geometry.stroke',stylers:[{color:'#2A3350'}]},
  {featureType:'road.highway',elementType:'geometry',stylers:[{color:'#232B42'}]},
  {featureType:'road.highway',elementType:'labels.text.fill',stylers:[{color:'#8892B0'}]},
  {featureType:'water',elementType:'geometry',stylers:[{color:'#0e1626'}]},
  {featureType:'water',elementType:'labels.text.fill',stylers:[{color:'#5A6482'}]},
  {featureType:'poi',stylers:[{visibility:'off'}]},
  {featureType:'poi.park',elementType:'geometry',stylers:[{color:'#111927'},{visibility:'on'}]},
  {featureType:'poi.park',elementType:'labels',stylers:[{visibility:'off'}]},
  {featureType:'transit',stylers:[{visibility:'off'}]},
  {featureType:'administrative',elementType:'geometry.stroke',stylers:[{color:'#2A3350'}]},
  {featureType:'administrative.locality',elementType:'labels.text.fill',stylers:[{color:'#8892B0'}]},
  {featureType:'administrative.country',elementType:'labels.text.fill',stylers:[{color:'#5A6482'}]}
];

function createMarkerIcon(color,isHighlighted){
  var size=isHighlighted?16:12;
  var svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+(size*2)+'" height="'+(size*2)+'" viewBox="0 0 '+(size*2)+' '+(size*2)+'">' +
    '<circle cx="'+size+'" cy="'+size+'" r="'+(size-1)+'" fill="'+color+'" stroke="#FFFFFF" stroke-width="2" opacity="0.9"/>' +
    '<circle cx="'+size+'" cy="'+size+'" r="'+(size/2)+'" fill="#FFFFFF" opacity="0.4"/>' +
    '</svg>';
  return {
    url:'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg),
    scaledSize:new google.maps.Size(size*2,size*2),
    anchor:new google.maps.Point(size,size)
  };
}

function createInfoContent(s){
  var navUrl='https://www.google.com/maps/dir/?api=1&destination='+s.latitude+','+s.longitude+'&travelmode=driving';
  return '<div style="background:#141B2D;color:#F0F4FF;padding:14px;border-radius:12px;min-width:280px;max-width:320px;font-family:system-ui,-apple-system,sans-serif;">' +
    // Clickable station name — posts message to parent for navigation
    '<div onclick="window.parent.postMessage({type:\\'stationClick\\',stationId:\\''+s.id+'\\'},\\'*\\')" style="cursor:pointer;">' +
      '<div style="font-weight:700;font-size:15px;margin-bottom:4px;color:#F0F4FF;">' + s.name + (s.verified ? ' <span style="color:#00D4FF;font-size:12px;">\u2713 Verified</span>' : '') + ' <span style="font-size:11px;color:#00D4FF;">\u2192</span></div>' +
      '<div style="font-size:12px;color:#8892B0;margin-bottom:2px;">' + s.provider + '</div>' +
      (s.address ? '<div style="font-size:11px;color:#5A6482;margin-bottom:4px;">' + s.address + '</div>' : '') +
    '</div>' +
    (s.connectors ? '<div style="font-size:11px;color:#F0F4FF;margin-bottom:4px;">' + s.connectors + '</div>' : '') +
    (s.distance ? '<div style="font-size:11px;color:#00D4FF;font-weight:600;margin-bottom:6px;">' + s.distance + ' away</div>' : '') +
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
      '<span style="display:inline-block;font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;color:#FFFFFF;background:' + s.color + ';">' + s.status + '</span>' +
    '</div>' +
    // Status report buttons — include lat/lng for proximity check
    '<div style="margin-bottom:10px;">' +
      '<div style="font-size:10px;color:#8892B0;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px;">Update Status:</div>' +
      '<div style="display:flex;gap:6px;">' +
        '<button onclick="window.parent.postMessage({type:\\'statusReport\\',stationId:\\''+s.id+'\\',status:\\'available\\',lat:'+s.latitude+',lng:'+s.longitude+'},\\'*\\')" style="flex:1;padding:6px 0;border-radius:8px;border:1px solid #00FF88;background:#00FF8815;color:#00FF88;font-size:10px;font-weight:700;cursor:pointer;">✅ Available</button>' +
        '<button onclick="window.parent.postMessage({type:\\'statusReport\\',stationId:\\''+s.id+'\\',status:\\'partially_available\\',lat:'+s.latitude+',lng:'+s.longitude+'},\\'*\\')" style="flex:1;padding:6px 0;border-radius:8px;border:1px solid #FFB020;background:#FFB02015;color:#FFB020;font-size:10px;font-weight:700;cursor:pointer;">🟡 Some</button>' +
        '<button onclick="window.parent.postMessage({type:\\'statusReport\\',stationId:\\''+s.id+'\\',status:\\'busy\\',lat:'+s.latitude+',lng:'+s.longitude+'},\\'*\\')" style="flex:1;padding:6px 0;border-radius:8px;border:1px solid #FF4D6A;background:#FF4D6A15;color:#FF4D6A;font-size:10px;font-weight:700;cursor:pointer;">🔴 Busy</button>' +
        '<button onclick="window.parent.postMessage({type:\\'statusReport\\',stationId:\\''+s.id+'\\',status:\\'out_of_service\\',lat:'+s.latitude+',lng:'+s.longitude+'},\\'*\\')" style="flex:1;padding:6px 0;border-radius:8px;border:1px solid #FF4D6A;background:#FF4D6A15;color:#FF4D6A;font-size:10px;font-weight:700;cursor:pointer;">⚠️</button>' +
      '</div>' +
    '</div>' +
    // Action buttons row
    '<div style="display:flex;gap:8px;">' +
      '<div onclick="window.parent.postMessage({type:\\'stationClick\\',stationId:\\''+s.id+'\\'},\\'*\\')" style="flex:1;text-align:center;padding:10px;background:#1C2438;border:1px solid #2A3350;color:#00D4FF;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">ℹ️ Details</div>' +
      '<a href="' + navUrl + '" target="_blank" style="flex:1;text-align:center;padding:10px;background:linear-gradient(135deg,#00D4FF,#8B5CF6,#D946EF);color:#FFFFFF;border-radius:8px;text-decoration:none;font-size:12px;font-weight:600;">📍 Navigate</a>' +
    '</div>' +
    '</div>';
}

function initMap(){
  var EGYPT_BOUNDS={north:31.8,south:22.0,west:24.5,east:37.0};
  var map=new google.maps.Map(document.getElementById('map'),{
    center:{lat:${lat},lng:${lng}},
    zoom:${zoom},
    styles:DARK_STYLE,
    disableDefaultUI:false,
    zoomControl:true,
    mapTypeControl:true,
    streetViewControl:true,
    fullscreenControl:false,
    gestureHandling:'greedy',
    clickableIcons:false,
    backgroundColor:'#0A0E1A',
    restriction:{latLngBounds:EGYPT_BOUNDS,strictBounds:false},
    minZoom:6
  });

  var openInfoWindow=null;

  // Close info window when clicking anywhere on the map
  map.addListener('click', function() {
    if (openInfoWindow) { openInfoWindow.close(); openInfoWindow = null; }
  });

  // User location marker — prominent pulsing blue dot with label
  if(userLoc){
    // Outer pulsing ring (CSS animation via SVG)
    var pulseIcon='<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">' +
      '<style>@keyframes pulse{0%{r:18;opacity:0.4}50%{r:22;opacity:0.1}100%{r:18;opacity:0.4}}.p{animation:pulse 2s infinite ease-in-out}</style>' +
      '<circle class="p" cx="24" cy="24" r="20" fill="#00D4FF" opacity="0.3"/>' +
      '<circle cx="24" cy="24" r="10" fill="#00D4FF" stroke="#FFFFFF" stroke-width="3"/>' +
      '<circle cx="24" cy="24" r="4" fill="#FFFFFF"/>' +
      '</svg>';
    new google.maps.Marker({
      position:userLoc,
      map:map,
      icon:{
        url:'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(pulseIcon),
        scaledSize:new google.maps.Size(48,48),
        anchor:new google.maps.Point(24,24)
      },
      title:'You are here',
      zIndex:999
    });

    // "You" label above the dot
    new google.maps.Marker({
      position:userLoc,
      map:map,
      icon:{
        url:'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="24"><rect x="0" y="0" width="40" height="20" rx="10" fill="#00D4FF"/><text x="20" y="14" text-anchor="middle" fill="#000" font-size="11" font-weight="bold" font-family="system-ui">You</text></svg>'
        ),
        scaledSize:new google.maps.Size(40,24),
        anchor:new google.maps.Point(20,40)
      },
      zIndex:1000
    });

    new google.maps.Circle({
      center:userLoc,
      radius:300,
      fillColor:'#00D4FF',
      fillOpacity:0.08,
      strokeColor:'#00D4FF',
      strokeWeight:1,
      strokeOpacity:0.3,
      map:map
    });
  }

  // Station markers
  stations.forEach(function(s){
    var marker=new google.maps.Marker({
      position:{lat:s.latitude,lng:s.longitude},
      map:map,
      icon:createMarkerIcon(s.color,false),
      title:s.name,
      zIndex:10
    });

    var infoWindow=new google.maps.InfoWindow({
      content:createInfoContent(s),
      maxWidth:300
    });

    marker.addListener('click',function(){
      if(openInfoWindow) openInfoWindow.close();
      infoWindow.open(map,marker);
      openInfoWindow=infoWindow;
      // Highlight this marker
      marker.setIcon(createMarkerIcon(s.color,true));
    });

    infoWindow.addListener('closeclick',function(){
      marker.setIcon(createMarkerIcon(s.color,false));
      openInfoWindow=null;
    });
  });

  // Fit bounds: user + nearest 5 stations
  if(userLoc && stations.length>0){
    var nearSorted=stations.slice().sort(function(a,b){
      var da=Math.abs(a.latitude-userLoc.lat)+Math.abs(a.longitude-userLoc.lng);
      var db=Math.abs(b.latitude-userLoc.lat)+Math.abs(b.longitude-userLoc.lng);
      return da-db;
    });
    var bounds=new google.maps.LatLngBounds();
    bounds.extend(new google.maps.LatLng(userLoc.lat,userLoc.lng));
    nearSorted.slice(0,5).forEach(function(s){
      bounds.extend(new google.maps.LatLng(s.latitude,s.longitude));
    });
    map.fitBounds(bounds,{top:40,right:40,bottom:40,left:40});
    // Cap zoom so we don't get too close
    var listener=google.maps.event.addListener(map,'idle',function(){
      if(map.getZoom()>13) map.setZoom(13);
      google.maps.event.removeListener(listener);
    });
  } else if(!userLoc && stations.length>1){
    var bounds=new google.maps.LatLngBounds();
    stations.forEach(function(s){
      bounds.extend(new google.maps.LatLng(s.latitude,s.longitude));
    });
    map.fitBounds(bounds,{top:40,right:40,bottom:40,left:40});
    var listener=google.maps.event.addListener(map,'idle',function(){
      if(map.getZoom()>13) map.setZoom(13);
      google.maps.event.removeListener(listener);
    });
  }
}
<\/script>
<script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&callback=initMap" async defer><\/script>
</body>
</html>`;
}

/**
 * Fallback to Leaflet/OpenStreetMap when no Google Maps API key is configured.
 */
function buildFallbackHtml(
  markersJson: string,
  userLocJson: string,
  lat: number,
  lng: number,
  zoom: number
): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body,#map{width:100%;height:100%}
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
if(userLoc){
  L.circleMarker([userLoc.lat,userLoc.lng],{radius:8,fillColor:'#00D4FF',color:'#FFFFFF',weight:3,fillOpacity:1}).addTo(map).bindPopup('<b>You are here</b>');
  L.circle([userLoc.lat,userLoc.lng],{radius:300,fillColor:'#00D4FF',color:'#00D4FF',weight:1,fillOpacity:0.1}).addTo(map);
}
var bounds=[];
stations.forEach(function(s){
  bounds.push([s.latitude,s.longitude]);
  L.circleMarker([s.latitude,s.longitude],{
    radius:10,fillColor:s.color,color:'#FFFFFF',weight:2,fillOpacity:0.9
  }).addTo(map).bindPopup(
    '<div style="font-weight:700;font-size:14px;margin-bottom:4px">'+s.name+'</div>'+
    '<div style="font-size:12px;color:#8892B0;margin-bottom:2px">'+s.provider+'</div>'+
    (s.address?'<div style="font-size:11px;color:#5A6482;margin-bottom:4px">'+s.address+'</div>':'')+
    (s.connectors?'<div style="font-size:11px;margin-bottom:4px">'+s.connectors+'</div>':'')+
    (s.distance?'<div style="font-size:11px;color:#00D4FF;font-weight:600;margin-bottom:6px">'+s.distance+' away</div>':'')+
    '<span style="display:inline-block;font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;color:#FFF;background:'+s.color+'">'+s.status+'</span>'
  );
});
if(userLoc&&bounds.length>0){
  bounds.push([userLoc.lat,userLoc.lng]);
  var nearSorted=stations.slice().sort(function(a,b){
    var da=Math.abs(a.latitude-userLoc.lat)+Math.abs(a.longitude-userLoc.lng);
    var db=Math.abs(b.latitude-userLoc.lat)+Math.abs(b.longitude-userLoc.lng);
    return da-db;
  });
  var fitBounds=[[userLoc.lat,userLoc.lng]];
  nearSorted.slice(0,5).forEach(function(s){fitBounds.push([s.latitude,s.longitude]);});
  try{map.fitBounds(fitBounds,{padding:[40,40],maxZoom:13});}catch(e){}
}else if(!userLoc&&bounds.length>1){
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
