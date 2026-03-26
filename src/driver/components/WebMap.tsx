import React, { useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { Station } from '@/core/types/station';

interface Props {
  stations: Station[];
  onStationPress?: (station: Station) => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

// Status-to-hex colour mapping (matches app theme)
const STATUS_COLOR: Record<string, string> = {
  available: '#10B981',
  partial: '#F59E0B',
  occupied: '#EF4444',
  offline: '#9CA3AF',
};

function buildMapHtml(
  stations: Station[],
  userLocation: { latitude: number; longitude: number } | null
): string {
  const markersJson = JSON.stringify(
    stations.map((s) => ({
      id: s.id,
      name: s.name,
      address: s.address ?? '',
      provider: s.provider?.name ?? '',
      latitude: s.latitude,
      longitude: s.longitude,
      status: s.status ?? 'offline',
      color: STATUS_COLOR[s.status ?? 'offline'] ?? '#9CA3AF',
    }))
  );

  const userMarkerScript = userLocation
    ? `
    L.circleMarker([${userLocation.latitude}, ${userLocation.longitude}], {
      radius: 8,
      fillColor: '#3B82F6',
      color: '#fff',
      weight: 2,
      fillOpacity: 1,
    })
      .addTo(map)
      .bindPopup('<b>Your Location</b>');
    `
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; background: #f0fdf4; }
    #map { width: 100%; height: 100%; }
    .station-popup .leaflet-popup-content-wrapper {
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      padding: 0;
      overflow: hidden;
    }
    .station-popup .leaflet-popup-content { margin: 0; }
    .popup-inner {
      padding: 12px 16px;
      min-width: 180px;
    }
    .popup-name {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 4px;
    }
    .popup-provider {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 12px;
      color: #6B7280;
      margin-bottom: 2px;
    }
    .popup-address {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 12px;
      color: #9CA3AF;
      margin-bottom: 8px;
    }
    .popup-status {
      display: inline-block;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 999px;
      color: #fff;
      text-transform: capitalize;
    }
    .popup-btn {
      display: block;
      margin-top: 8px;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: #10B981;
      cursor: pointer;
      text-decoration: none;
    }
    .leaflet-attribution-flag { display: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var stations = ${markersJson};

    var map = L.map('map', {
      zoomControl: true,
      attributionControl: true,
    }).setView([30.0444, 31.2357], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    var STATUS_LABELS = {
      available: 'Available',
      partial: 'Partial',
      occupied: 'Busy',
      offline: 'Offline',
    };

    stations.forEach(function(station) {
      var statusLabel = STATUS_LABELS[station.status] || station.status;
      var popupHtml =
        '<div class="popup-inner">' +
          '<div class="popup-name">' + station.name + '</div>' +
          '<div class="popup-provider">' + station.provider + '</div>' +
          (station.address ? '<div class="popup-address">' + station.address + '</div>' : '') +
          '<span class="popup-status" style="background:' + station.color + '">' + statusLabel + '</span>' +
          '<a class="popup-btn" href="#" onclick="selectStation(' + JSON.stringify(station.id) + '); return false;">View Details &rarr;</a>' +
        '</div>';

      var marker = L.circleMarker([station.latitude, station.longitude], {
        radius: 11,
        fillColor: station.color,
        color: '#ffffff',
        weight: 2.5,
        fillOpacity: 0.92,
      }).addTo(map);

      marker.bindPopup(popupHtml, { className: 'station-popup', maxWidth: 240 });
      marker._stationId = station.id;

      marker.on('click', function() {
        marker.openPopup();
      });
    });

    ${userMarkerScript}

    function selectStation(id) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'stationPress', id: id }));
      } else if (window.parent !== window) {
        window.parent.postMessage(JSON.stringify({ type: 'stationPress', id: id }), '*');
      }
    }

    // Auto-fit map to show all markers if there are stations
    if (stations.length > 0) {
      var bounds = L.latLngBounds(stations.map(function(s) {
        return [s.latitude, s.longitude];
      }));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  </script>
</body>
</html>`;
}

export function WebMap({ stations, onStationPress, userLocation }: Props) {
  const containerRef = useRef<any>(null);

  const htmlContent = useMemo(
    () => buildMapHtml(stations, userLocation ?? null),
    [stations, userLocation]
  );

  // Listen for messages from the iframe (station press)
  useEffect(() => {
    if (!onStationPress) return;
    const handler = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.type === 'stationPress' && data?.id) {
          const station = stations.find((s) => s.id === data.id);
          if (station) onStationPress(station);
        }
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [stations, onStationPress]);

  // Directly inject iframe via DOM for maximum compatibility
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;
    const container = containerRef.current as HTMLElement;
    // Clear previous
    container.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.display = 'block';
    iframe.setAttribute('title', 'EV Charging Stations Map');
    iframe.setAttribute('allow', 'geolocation');
    container.appendChild(iframe);
    // Write HTML directly into iframe
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
    }
  }, [htmlContent]);

  if (typeof window === 'undefined') {
    return <View style={styles.placeholder} />;
  }

  return <View ref={containerRef} style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden' as any,
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
});
