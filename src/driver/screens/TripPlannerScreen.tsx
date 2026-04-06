import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polyline, Line, Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/core/theme';
import { typography } from '@/core/theme/typography';
import { useVehicles } from '@/core/queries/useVehicles';
import { evDatabase, EVModel } from '@/core/data/evDatabase';
import { googleMapsService, ElevationProfile } from '@/core/services/googleMapsService';
import { stationService } from '@/core/services/stationService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChargingStop {
  stationName: string;
  stationId?: string;
  location: string;
  distanceFromStart: number;
  arrivalBattery: number;
  chargeToPercent: number;
  chargeDuration: number;
  chargeCost: number;
  chargerType: string;
  attractions: { name: string; type: string; distance: string; icon: string }[];
}

interface WaypointInfo {
  name: string;
  distanceFromStart: number;
  segmentDistanceKm: number;
  segmentDurationMin: number;
}

interface TripPlan {
  from: string;
  to: string;
  waypoints?: WaypointInfo[];
  totalDistance: number;
  totalTime: string;
  totalChargeCost: number;
  arrivalBattery: number;
  stops: ChargingStop[];
  elevationProfile?: ElevationProfile | null;
  elevationRangeAdjustment?: number; // percentage adjustment to range (negative = reduced)
  speedRangeAdjustment?: number; // percentage adjustment from speed
}

type ChargingStrategy = 'quick' | 'fewer';
type Step = 1 | 2 | 3;

// ---------------------------------------------------------------------------
// Popular routes
// ---------------------------------------------------------------------------

const POPULAR_ROUTES = [
  { label: 'To Hurghada', from: '', to: 'Hurghada' },
  { label: 'To Alexandria', from: '', to: 'Alexandria' },
  { label: 'To Sharm El Sheikh', from: '', to: 'Sharm El Sheikh' },
  { label: 'To Ain Sokhna', from: '', to: 'Ain Sokhna' },
  { label: 'To North Coast', from: '', to: 'El Alamein' },
  { label: 'To El Gouna', from: '', to: 'El Gouna' },
];

const SPEED_OPTIONS = [100, 120, 140, 160];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function TripPlannerScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const { data: vehicles } = useVehicles();

  // Trip setup state
  const [step, setStep] = useState<Step>(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fromSuggestions, setFromSuggestions] = useState<{ description: string; placeId: string }[]>([]);
  const [toSuggestions, setToSuggestions] = useState<{ description: string; placeId: string }[]>([]);
  const [activeField, setActiveField] = useState<'from' | 'to' | `waypoint-${number}` | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Waypoints state (intermediate stops)
  const MAX_WAYPOINTS = 3;
  const [waypoints, setWaypoints] = useState<string[]>([]);
  const [waypointSuggestions, setWaypointSuggestions] = useState<{ [key: number]: { description: string; placeId: string }[] }>({});

  const [batteryLevel, setBatteryLevel] = useState(80);
  const [avgSpeed, setAvgSpeed] = useState(120);
  const [chargingStrategy, setChargingStrategy] = useState<ChargingStrategy>('quick');
  const [locatingFrom, setLocatingFrom] = useState(false);

  // Auto-detect user location for "From" on mount
  useEffect(() => {
    if (!from && navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const GMAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '';
            const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${pos.coords.latitude},${pos.coords.longitude}&key=${GMAPS_KEY}&result_type=sublocality|neighborhood|route`;
            const resp = await fetch(url);
            const data = await resp.json();
            if (data.status === 'OK' && data.results?.[0]) {
              // Get a specific neighborhood/area name, not just "Cairo"
              const components = data.results[0].address_components || [];
              const neighborhood = components.find((c: any) => c.types.includes('sublocality') || c.types.includes('neighborhood'));
              const locality = components.find((c: any) => c.types.includes('locality'));
              const specificName = neighborhood?.long_name || locality?.long_name || data.results[0].formatted_address.split(',')[0];
              setFrom(specificName);
            } else {
              setFrom('My Location');
            }
          } catch {
            setFrom('My Location');
          }
        },
        () => { setFrom(''); },
        { enableHighAccuracy: true }
      );
    }
  }, []);
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);

  // Vehicle
  const selectedVehicle = vehicles?.[0] || null;
  const spec: EVModel | undefined = selectedVehicle
    ? evDatabase.find(
        (ev) =>
          ev.make.toLowerCase() === selectedVehicle.make?.toLowerCase() &&
          ev.model.toLowerCase() === selectedVehicle.model?.toLowerCase(),
      )
    : undefined;

  // Step 2 animation state
  const [planningSteps, setPlanningSteps] = useState<number[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;


  // ---------------------------------------------------------------------------
  // Geocoding + corridor-based station finding (works for ANY route)
  // ---------------------------------------------------------------------------

  async function geocodeCity(name: string): Promise<{lat: number, lng: number} | null> {
    const GMAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '';
    if (!GMAPS_KEY) return null;
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(name + ', Egypt')}&key=${GMAPS_KEY}`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.status === 'OK' && data.results?.[0]) {
        const loc = data.results[0].geometry.location;
        return { lat: loc.lat, lng: loc.lng };
      }
    } catch {}
    return null;
  }

  function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function findStationsAlongLine(
    stations: any[],
    fromLat: number, fromLng: number,
    toLat: number, toLng: number,
    maxDeviationKm: number = 20,
  ): any[] {
    const totalDist = haversineKm(fromLat, fromLng, toLat, toLng);

    return stations
      .map(s => {
        const dx = toLng - fromLng;
        const dy = toLat - fromLat;
        const t = Math.max(0, Math.min(1,
          ((s.longitude - fromLng) * dx + (s.latitude - fromLat) * dy) / (dx * dx + dy * dy)
        ));

        const closestLat = fromLat + t * dy;
        const closestLng = fromLng + t * dx;
        const deviation = haversineKm(s.latitude, s.longitude, closestLat, closestLng);
        const distFromStart = t * totalDist;

        if (deviation <= maxDeviationKm && t > 0.05 && t < 0.95) {
          return { ...s, distanceFromStart: Math.round(distFromStart), deviationKm: deviation };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.distanceFromStart - b.distanceFromStart);
  }

  // Last resort plan when ALL APIs fail (no geocoding, no directions)
  function getLastResortPlan(): TripPlan {
    return {
      from,
      to,
      totalDistance: 400,
      totalTime: '5h 0m',
      totalChargeCost: 150,
      arrivalBattery: 30,
      stops: [{
        stationName: 'Charging Station (estimated)',
        location: 'Along the route',
        distanceFromStart: 200,
        arrivalBattery: 15,
        chargeToPercent: 80,
        chargeDuration: 35,
        chargeCost: 150,
        chargerType: 'CCS2 50kW',
        attractions: [],
      }],
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers for real-data trip planning
  // ---------------------------------------------------------------------------

  function selectOptimalStops(
    stations: any[],
    totalDistance: number,
    startBattery: number,
    kmPerPercent: number,
    strategy: string,
  ): any[] {
    if (!stations.length) return [];

    const minBatteryAtArrival = 15;
    const chargeTarget = strategy === 'quick' ? 65 : 85;

    const result: any[] = [];
    let currentBattery = startBattery;
    let currentPosition = 0;

    for (const station of stations) {
      const distToStation = station.distanceFromStart - currentPosition;
      const batteryNeeded = distToStation / kmPerPercent;

      const remainingToEnd = totalDistance - station.distanceFromStart;
      const batteryAfterReaching = currentBattery - batteryNeeded;
      const canReachEnd =
        batteryAfterReaching * kmPerPercent >= remainingToEnd + minBatteryAtArrival * kmPerPercent;

      if (!canReachEnd || batteryAfterReaching < 20) {
        result.push(station);
        currentBattery = chargeTarget;
        currentPosition = station.distanceFromStart;

        if (strategy === 'fewer' && result.length >= 2) break;
        if (strategy === 'quick' && result.length >= 3) break;
      }
    }

    // If no stops selected but we can't make it on current battery
    if (result.length === 0 && startBattery * kmPerPercent < totalDistance) {
      const midpoint = totalDistance / 2;
      const closest = stations.reduce((prev, curr) =>
        Math.abs(curr.distanceFromStart - midpoint) < Math.abs(prev.distanceFromStart - midpoint)
          ? curr
          : prev,
      );
      result.push(closest);
    }

    return result;
  }

  // Speed range multiplier: 100kph = +5%, 120kph = baseline, 140kph = -10%, 160kph = -20%
  function getSpeedRangeMultiplier(speed: number): number {
    if (speed <= 100) return 1.05;
    if (speed <= 120) return 1 + (120 - speed) * 0.0025;
    return 1 - (speed - 120) * 0.005;
  }

  // Elevation range multiplier: uphill costs ~1% per 100m gain, downhill recovers ~0.5% per 100m loss
  function getElevationRangeMultiplier(profile: ElevationProfile | null | undefined): number {
    if (!profile) return 1;
    const ascentPenalty = (profile.totalAscent / 100) * 0.01;
    const descentBonus = (profile.totalDescent / 100) * 0.005;
    return Math.max(0.5, 1 - ascentPenalty + descentBonus);
  }

  // Build a TripPlan from raw stop data and a total distance (shared by both real + fallback paths)
  function buildTripPlan(rawStops: any[], totalDistance: number, waypointInfos?: WaypointInfo[], elevationProfile?: ElevationProfile | null): TripPlan {
    const speedMultiplier = getSpeedRangeMultiplier(avgSpeed);
    const elevationMultiplier = getElevationRangeMultiplier(elevationProfile);
    const combinedFactor = (1 / speedMultiplier) * (1 / elevationMultiplier);
    const vehicleBatteryKwh = selectedVehicle?.battery_capacity_kwh || 60;
    const baseConsumption = (vehicleBatteryKwh / (spec?.rangeKm || 400)) * 100;
    const actualConsumption = baseConsumption * combinedFactor;

    let currentBattery = batteryLevel;
    const stops: ChargingStop[] = rawStops.map((stop: any, i: number) => {
      const prevDist = i === 0 ? 0 : rawStops[i - 1].distanceFromStart;
      const segmentDist = stop.distanceFromStart - prevDist;
      const energyUsed = (segmentDist / 100) * actualConsumption;
      const batteryUsed = (energyUsed / vehicleBatteryKwh) * 100;
      const arrivalBattery = Math.max(Math.round(currentBattery - batteryUsed), 5);

      const chargeToPercent = chargingStrategy === 'quick' ? 65 : 85;
      const chargeAmount = Math.max(chargeToPercent - arrivalBattery, 0);
      const chargeKwh = (chargeAmount / 100) * vehicleBatteryKwh;
      const chargerStr = stop.chargerType || 'CCS2 50kW';
      // Extract kW value — match number before "kW" or "kw", or last number in string
      const kwMatch = chargerStr.match(/(\d+)\s*kW/i);
      const chargeSpeed = kwMatch ? parseInt(kwMatch[1], 10) : 50;
      const chargeDuration = Math.min(Math.round((chargeKwh / Math.max(chargeSpeed, 10)) * 60), 90);
      const chargeCost = Math.round(chargeKwh * 3.5);

      currentBattery = chargeToPercent;

      return {
        stationName: stop.stationName || stop.name || 'Charging Station',
        stationId: stop.stationId || stop.id,
        location: stop.location || stop.address || stop.city || `KM ${stop.distanceFromStart}`,
        distanceFromStart: stop.distanceFromStart,
        arrivalBattery,
        chargeToPercent,
        chargeDuration: Math.max(chargeDuration, 5),
        chargeCost: Math.max(chargeCost, 10),
        chargerType: stop.chargerType || 'CCS2 50kW',
        attractions: stop.attractions || [],
      };
    });

    const lastStop = stops[stops.length - 1];
    const finalDist = totalDistance - (lastStop?.distanceFromStart || 0);
    const finalEnergy = (finalDist / 100) * actualConsumption;
    const finalBatteryUsed = (finalEnergy / vehicleBatteryKwh) * 100;
    const arrivalBattery = Math.max(Math.round(currentBattery - finalBatteryUsed), 5);

    const totalChargeTime = stops.reduce((sum, s) => sum + s.chargeDuration, 0);
    const driveTime = Math.round((totalDistance / avgSpeed) * 60);
    const totalMinutes = driveTime + totalChargeTime;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    return {
      from,
      to,
      waypoints: waypointInfos,
      totalDistance,
      totalTime: `${hours}h ${mins}m`,
      totalChargeCost: stops.reduce((sum, s) => sum + s.chargeCost, 0),
      arrivalBattery,
      stops,
      elevationProfile,
      elevationRangeAdjustment: elevationProfile ? Math.round((elevationMultiplier - 1) * 100) : 0,
      speedRangeAdjustment: Math.round((speedMultiplier - 1) * 100),
    };
  }

  // ---------------------------------------------------------------------------
  // Async trip plan generator (real APIs with graceful fallback)
  // ---------------------------------------------------------------------------

  const generateTripPlanAsync = useCallback(async (): Promise<TripPlan> => {
    const vehicleBatteryKwh = selectedVehicle?.battery_capacity_kwh || 60;
    const rangeKm = spec?.rangeKm || Math.round(vehicleBatteryKwh * 6.5);
    const speedMult = getSpeedRangeMultiplier(avgSpeed);
    const kmPerPercent = (rangeKm * speedMult) / 100;

    const validWaypoints = waypoints.filter(wp => wp.trim());

    try {
      // Step 1: Get real route from Google Directions (with waypoints if any)
      const directions = await googleMapsService.getDirections(from, to, validWaypoints.length > 0 ? validWaypoints : undefined);

      // Step 2: Get all stations from Supabase
      const allStations = await stationService.getStations();

      if (directions && directions.routePoints.length > 0) {
        // Step 3: Find stations along the real route
        const routeStations = googleMapsService.findStationsAlongRoute(
          allStations,
          directions.routePoints,
          15,
        );

        // Step 4: Select optimal stops based on energy math
        const stationsWithDist = routeStations.map((rs) => ({
          ...rs.station,
          distanceFromStart: rs.distanceFromStartKm,
          deviationKm: rs.deviationKm,
        }));

        const selectedStops = selectOptimalStops(
          stationsWithDist,
          directions.totalDistanceKm,
          batteryLevel,
          kmPerPercent,
          chargingStrategy,
        );

        // Step 5: Get nearby attractions for each stop (real Places API)
        const stopsWithAttractions = await Promise.all(
          selectedStops.map(async (stop: any) => {
            try {
              const nearbyPlaces = await googleMapsService.getNearbyPlaces(
                stop.latitude,
                stop.longitude,
                1000,
              );
              return {
                ...stop,
                stationName: stop.name || stop.stationName,
                stationId: stop.id,
                location: stop.address || stop.city || `KM ${stop.distanceFromStart}`,
                chargerType: stop.connectors?.[0]
                  ? `${stop.connectors[0].type} ${stop.connectors[0].power_kw}kW`
                  : 'CCS2 50kW',
                attractions:
                  nearbyPlaces.length > 0
                    ? nearbyPlaces.map((p) => ({
                        name: p.name,
                        type: p.type,
                        distance: p.distance,
                        icon: p.icon,
                      }))
                    : stop.attractions || [],
              };
            } catch {
              return {
                ...stop,
                stationName: stop.name || stop.stationName,
                stationId: stop.id,
                location: stop.address || stop.city || `KM ${stop.distanceFromStart}`,
                chargerType: 'CCS2 50kW',
                attractions: stop.attractions || [],
              };
            }
          }),
        );

        // Build waypoint info from direction legs (legs > 1 means waypoints exist)
        let waypointInfos: WaypointInfo[] | undefined;
        if (validWaypoints.length > 0 && directions.legs.length > 1) {
          let cumulativeDist = 0;
          waypointInfos = validWaypoints.map((wpName, i) => {
            cumulativeDist += directions.legs[i].distanceKm;
            return {
              name: wpName,
              distanceFromStart: cumulativeDist,
              segmentDistanceKm: directions.legs[i].distanceKm,
              segmentDurationMin: directions.legs[i].durationMin,
            };
          });
        }

        // Step 6: Fetch elevation profile along the route polyline
        let elevationProfile: ElevationProfile | null = null;
        try {
          elevationProfile = await googleMapsService.getElevationProfile(
            directions.polyline,
            directions.totalDistanceKm,
          );
        } catch (elevErr) {
          console.warn('[TripPlanner] Elevation API failed (non-blocking):', elevErr);
        }

        return buildTripPlan(stopsWithAttractions, directions.totalDistanceKm, waypointInfos, elevationProfile);
      }
    } catch (err) {
      console.warn('[TripPlanner] Directions API failed, trying geocode fallback:', err);
    }

    // Fallback: geocode both cities (and waypoints) and find stations along the corridor
    try {
      const allPoints = [from, ...validWaypoints, to];
      const allCoords = await Promise.all(allPoints.map(p => geocodeCity(p)));

      const fromCoords = allCoords[0];
      const toCoords = allCoords[allCoords.length - 1];

      if (fromCoords && toCoords) {
        // Build segments: from -> wp1 -> wp2 -> ... -> to
        let totalRoadDistance = 0;
        const segmentDistances: number[] = [];
        for (let i = 0; i < allCoords.length - 1; i++) {
          const c1 = allCoords[i] || fromCoords;
          const c2 = allCoords[i + 1] || toCoords;
          const segDist = Math.round(haversineKm(c1.lat, c1.lng, c2.lat, c2.lng) * 1.3);
          segmentDistances.push(segDist);
          totalRoadDistance += segDist;
        }

        const allStations = await stationService.getStations();
        // Find stations along full corridor (origin to destination)
        const routeStations = findStationsAlongLine(
          allStations, fromCoords.lat, fromCoords.lng, toCoords.lat, toCoords.lng, 25
        );

        // Adjust distanceFromStart to road-distance scale (stations found on straight line)
        const scaleFactor = totalRoadDistance / haversineKm(fromCoords.lat, fromCoords.lng, toCoords.lat, toCoords.lng);
        const scaledStations = routeStations.map((s: any) => ({
          ...s,
          distanceFromStart: Math.round(s.distanceFromStart * scaleFactor),
          stationName: s.name || s.stationName || 'Charging Station',
          stationId: s.id,
          location: s.address || s.city || `KM ${Math.round(s.distanceFromStart * scaleFactor)}`,
          chargerType: s.connectors?.[0]
            ? `${s.connectors[0].type} ${s.connectors[0].power_kw}kW`
            : 'CCS2 50kW',
        }));

        const selectedStops = selectOptimalStops(
          scaledStations, totalRoadDistance, batteryLevel, kmPerPercent, chargingStrategy
        );

        // Get nearby attractions for each stop
        const stopsWithAttractions = await Promise.all(
          selectedStops.map(async (stop: any) => {
            try {
              const nearby = await googleMapsService.getNearbyPlaces(stop.latitude, stop.longitude, 1000);
              return {
                ...stop,
                attractions: nearby.length > 0
                  ? nearby.map((p: any) => ({ name: p.name, type: p.type, distance: p.distance, icon: p.icon }))
                  : [],
              };
            } catch { return { ...stop, attractions: [] }; }
          })
        );

        // Build waypoint info for fallback path
        let fallbackWaypointInfos: WaypointInfo[] | undefined;
        if (validWaypoints.length > 0) {
          let cumulativeDist = 0;
          fallbackWaypointInfos = validWaypoints.map((wpName, i) => {
            cumulativeDist += segmentDistances[i];
            const segDurationMin = Math.round((segmentDistances[i] / avgSpeed) * 60);
            return {
              name: wpName,
              distanceFromStart: cumulativeDist,
              segmentDistanceKm: segmentDistances[i],
              segmentDurationMin: segDurationMin,
            };
          });
        }

        return buildTripPlan(stopsWithAttractions, totalRoadDistance, fallbackWaypointInfos);
      }
    } catch (err) {
      console.warn('[TripPlanner] Geocode fallback also failed:', err);
    }

    // Last resort: generic estimated plan when all APIs fail
    return getLastResortPlan();
  }, [from, to, waypoints, batteryLevel, avgSpeed, chargingStrategy, selectedVehicle, spec]);

  // ---------------------------------------------------------------------------
  // Step 2 animation logic
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (step !== 2) return;

    let cancelled = false;
    setPlanningSteps([]);

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    // Show step labels progressively while async work happens
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setPlanningSteps((p) => [...p, 0]), 400));
    timers.push(setTimeout(() => setPlanningSteps((p) => [...p, 1]), 900));
    timers.push(setTimeout(() => setPlanningSteps((p) => [...p, 2]), 1500));
    timers.push(setTimeout(() => setPlanningSteps((p) => [...p, 3]), 2100));
    timers.push(setTimeout(() => setPlanningSteps((p) => [...p, 4]), 2700));

    // Run the async trip planner (real APIs with fallback)
    const planPromise = generateTripPlanAsync();

    // Wait for both the minimum animation time AND the plan to resolve
    const minDelay = new Promise<void>((resolve) => {
      timers.push(setTimeout(resolve, 3500));
    });

    Promise.all([planPromise, minDelay]).then(([plan]) => {
      if (!cancelled) {
        setTripPlan(plan);
        setStep(3);
      }
    });

    return () => {
      cancelled = true;
      pulse.stop();
      timers.forEach(clearTimeout);
    };
  }, [step]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleFromChange = (text: string) => {
    setFrom(text);
    setActiveField('from');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const results = await googleMapsService.autocompletePlaces(text);
      setFromSuggestions(results);
    }, 200);
  };

  const handleToChange = (text: string) => {
    setTo(text);
    setActiveField('to');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const results = await googleMapsService.autocompletePlaces(text);
      setToSuggestions(results);
    }, 200);
  };

  const selectSuggestion = (field: 'from' | 'to' | `waypoint-${number}`, description: string) => {
    const city = description.split(',')[0].trim();
    if (field === 'from') {
      setFrom(city);
      setFromSuggestions([]);
    } else if (field === 'to') {
      setTo(city);
      setToSuggestions([]);
    } else if (field.startsWith('waypoint-')) {
      const idx = parseInt(field.split('-')[1], 10);
      setWaypoints(prev => { const n = [...prev]; n[idx] = city; return n; });
      setWaypointSuggestions(prev => { const n = { ...prev }; delete n[idx]; return n; });
    }
    setActiveField(null);
  };

  // Waypoint handlers
  const handleWaypointChange = (text: string, index: number) => {
    setWaypoints(prev => { const n = [...prev]; n[index] = text; return n; });
    setActiveField(`waypoint-${index}`);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const results = await googleMapsService.autocompletePlaces(text);
      setWaypointSuggestions(prev => ({ ...prev, [index]: results }));
    }, 200);
  };

  const addWaypoint = () => {
    if (waypoints.length >= MAX_WAYPOINTS) {
      Alert.alert('Limit Reached', 'Maximum 3 intermediate stops allowed.');
      return;
    }
    setWaypoints(prev => [...prev, '']);
  };

  const removeWaypoint = (index: number) => {
    setWaypoints(prev => prev.filter((_, i) => i !== index));
    setWaypointSuggestions(prev => {
      const n = { ...prev };
      delete n[index];
      return n;
    });
  };

  const moveWaypoint = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= waypoints.length) return;
    setWaypoints(prev => {
      const n = [...prev];
      [n[index], n[newIndex]] = [n[newIndex], n[index]];
      return n;
    });
  };

  const handlePlanTrip = () => {
    if (!from.trim()) {
      Alert.alert('Starting Point Required', 'Please enter your starting location or tap "Use my current location".');
      return;
    }
    if (!to.trim()) {
      Alert.alert('Destination Required', 'Please enter a destination to plan your trip.');
      return;
    }
    setStep(2);
  };

  const handlePopularRoute = (route: (typeof POPULAR_ROUTES)[number]) => {
    // Keep user's current "from" location if already set
    if (route.from) setFrom(route.from);
    setTo(route.to);
  };

  const adjustBattery = (delta: number) => {
    setBatteryLevel((prev) => Math.min(100, Math.max(5, prev + delta)));
  };

  // ---------------------------------------------------------------------------
  // Render Step 1: Trip Setup
  // ---------------------------------------------------------------------------

  const renderStep1 = () => (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 }}>
        <TouchableOpacity
          onPress={() => navigation?.goBack?.()}
          style={{ marginBottom: 16 }}
        >
          <Text style={{ ...typography.body, color: colors.textSecondary }}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={{ ...typography.h2, color: colors.primary }}>
          {'\u26A1'} AI Trip Planner
        </Text>
        <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: 6 }}>
          Plan your perfect EV road trip
        </Text>
      </View>

      {/* From / To */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
            padding: 16,
            gap: 12,
          }}
        >
          {/* From */}
          <View style={{ zIndex: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 18 }}>{'\uD83D\uDCCD'}</Text>
              <TextInput
                value={from}
                onChangeText={handleFromChange}
                onFocus={() => setActiveField('from')}
                onBlur={() => setTimeout(() => { if (activeField === 'from') setActiveField(null); }, 200)}
                placeholder="Your location (e.g. Maadi, Nasr City)"
                placeholderTextColor={colors.textTertiary}
                style={{
                  flex: 1,
                  ...typography.body,
                  color: colors.text,
                  backgroundColor: colors.surfaceSecondary,
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: activeField === 'from' ? colors.primary : colors.border,
                }}
              />
            </View>
            {activeField === 'from' && fromSuggestions.length > 0 && (
              <View style={{
                position: 'absolute',
                top: 52,
                left: 38,
                right: 0,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.primary,
                borderRadius: 10,
                overflow: 'hidden',
                shadowColor: colors.primary,
                shadowOpacity: 0.2,
                shadowRadius: 10,
                elevation: 10,
              }}>
                {fromSuggestions.map((s, i) => (
                  <TouchableOpacity
                    key={s.placeId + i}
                    onPress={() => selectSuggestion('from', s.description)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 11,
                      borderBottomWidth: i < fromSuggestions.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Text style={{ color: colors.primary, fontSize: 13 }}>{'\uD83D\uDCCD'}</Text>
                    <Text style={{ ...typography.caption, color: colors.text, flex: 1 }} numberOfLines={1}>{s.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          {/* Use my location button */}
          <TouchableOpacity
            onPress={() => {
              setLocatingFrom(true);
              if (navigator?.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  async (pos) => {
                    try {
                      const GMAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '';
                      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${pos.coords.latitude},${pos.coords.longitude}&key=${GMAPS_KEY}&result_type=sublocality|neighborhood|route`;
                      const resp = await fetch(url);
                      const data = await resp.json();
                      if (data.status === 'OK' && data.results?.[0]) {
                        const components = data.results[0].address_components || [];
                        const neighborhood = components.find((c: any) => c.types.includes('sublocality') || c.types.includes('neighborhood'));
                        const locality = components.find((c: any) => c.types.includes('locality'));
                        setFrom(neighborhood?.long_name || locality?.long_name || data.results[0].formatted_address.split(',')[0]);
                      }
                    } catch {}
                    setLocatingFrom(false);
                  },
                  () => setLocatingFrom(false),
                  { enableHighAccuracy: true }
                );
              }
            }}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
              paddingVertical: 8, marginLeft: 38,
              backgroundColor: colors.primaryLight, borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 12 }}>{'\uD83D\uDCCD'}</Text>
            <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>
              {locatingFrom ? 'Detecting location...' : 'Use my current location'}
            </Text>
          </TouchableOpacity>

          {/* Waypoints (intermediate stops) */}
          {waypoints.map((wp, idx) => (
            <React.Fragment key={`waypoint-${idx}`}>
              <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 38 }} />
              <View style={{ zIndex: 10 - idx }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      width: 24, height: 24, borderRadius: 12,
                      backgroundColor: colors.accent || colors.primaryLight,
                      justifyContent: 'center', alignItems: 'center',
                    }}
                  >
                    <Text style={{ ...typography.small, color: '#fff', fontWeight: '700', fontSize: 11 }}>
                      {idx + 1}
                    </Text>
                  </View>
                  <TextInput
                    value={wp}
                    onChangeText={(text) => handleWaypointChange(text, idx)}
                    onFocus={() => setActiveField(`waypoint-${idx}`)}
                    onBlur={() => setTimeout(() => { if (activeField === `waypoint-${idx}`) setActiveField(null); }, 200)}
                    placeholder={`Stop ${idx + 1} (e.g. Ain Sokhna)`}
                    placeholderTextColor={colors.textTertiary}
                    style={{
                      flex: 1, ...typography.body, color: colors.text,
                      backgroundColor: colors.surfaceSecondary, borderRadius: 10,
                      paddingHorizontal: 14, paddingVertical: 12,
                      borderWidth: 1, borderColor: activeField === `waypoint-${idx}` ? (colors.accent || colors.primary) : colors.border,
                    }}
                  />
                  <View style={{ gap: 2 }}>
                    {idx > 0 && (
                      <TouchableOpacity onPress={() => moveWaypoint(idx, 'up')} style={{ padding: 2 }}>
                        <Text style={{ fontSize: 10, color: colors.textTertiary }}>{'\u25B2'}</Text>
                      </TouchableOpacity>
                    )}
                    {idx < waypoints.length - 1 && (
                      <TouchableOpacity onPress={() => moveWaypoint(idx, 'down')} style={{ padding: 2 }}>
                        <Text style={{ fontSize: 10, color: colors.textTertiary }}>{'\u25BC'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => removeWaypoint(idx)}
                    style={{
                      width: 28, height: 28, borderRadius: 14,
                      backgroundColor: colors.surfaceSecondary,
                      justifyContent: 'center', alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: colors.textTertiary, fontSize: 16, fontWeight: '600', lineHeight: 18 }}>{'\u00D7'}</Text>
                  </TouchableOpacity>
                </View>
                {activeField === `waypoint-${idx}` && (waypointSuggestions[idx] || []).length > 0 && (
                  <View style={{
                    position: 'absolute', top: 52, left: 38, right: 0,
                    backgroundColor: colors.surface, borderWidth: 1,
                    borderColor: colors.accent || colors.primary, borderRadius: 10,
                    overflow: 'hidden', shadowColor: colors.primary,
                    shadowOpacity: 0.2, shadowRadius: 10, elevation: 10, zIndex: 100,
                  }}>
                    {waypointSuggestions[idx].map((s, i) => (
                      <TouchableOpacity
                        key={s.placeId + i}
                        onPress={() => selectSuggestion(`waypoint-${idx}`, s.description)}
                        style={{
                          paddingHorizontal: 14, paddingVertical: 11,
                          borderBottomWidth: i < waypointSuggestions[idx].length - 1 ? 1 : 0,
                          borderBottomColor: colors.border,
                          flexDirection: 'row', alignItems: 'center', gap: 8,
                        }}
                      >
                        <Text style={{ color: colors.accent || colors.primary, fontSize: 13 }}>{'\uD83D\uDCCD'}</Text>
                        <Text style={{ ...typography.caption, color: colors.text, flex: 1 }} numberOfLines={1}>{s.description}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </React.Fragment>
          ))}

          {/* Add Stop button */}
          {waypoints.length < MAX_WAYPOINTS && (
            <>
              <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 38 }} />
              <TouchableOpacity
                onPress={addWaypoint}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 8, paddingVertical: 12, marginLeft: 38,
                  borderWidth: 1.5, borderStyle: 'dashed',
                  borderColor: colors.textTertiary, borderRadius: 10,
                }}
              >
                <Text style={{ fontSize: 16, color: colors.textTertiary }}>+</Text>
                <Text style={{ ...typography.caption, color: colors.textTertiary }}>Add Stop</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Separator */}
          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginLeft: 38,
            }}
          />
          {/* To */}
          <View style={{ zIndex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 18 }}>{'\uD83C\uDFC1'}</Text>
              <TextInput
                value={to}
                onChangeText={handleToChange}
                onFocus={() => setActiveField('to')}
                onBlur={() => setTimeout(() => { if (activeField === 'to') setActiveField(null); }, 200)}
                placeholder="Destination"
                placeholderTextColor={colors.textTertiary}
                style={{
                  flex: 1,
                  ...typography.body,
                  color: colors.text,
                  backgroundColor: colors.surfaceSecondary,
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: activeField === 'to' ? colors.primary : colors.border,
                }}
              />
            </View>
            {activeField === 'to' && toSuggestions.length > 0 && (
              <View style={{
                position: 'absolute',
                top: 52,
                left: 38,
                right: 0,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.primary,
                borderRadius: 10,
                overflow: 'hidden',
                shadowColor: colors.primary,
                shadowOpacity: 0.2,
                shadowRadius: 10,
                elevation: 10,
              }}>
                {toSuggestions.map((s, i) => (
                  <TouchableOpacity
                    key={s.placeId + i}
                    onPress={() => selectSuggestion('to', s.description)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 11,
                      borderBottomWidth: i < toSuggestions.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Text style={{ color: colors.secondary, fontSize: 13 }}>{'\uD83C\uDFC1'}</Text>
                    <Text style={{ ...typography.caption, color: colors.text, flex: 1 }} numberOfLines={1}>{s.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Popular Routes */}
        <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 14, marginBottom: 8 }}>
          Popular Routes
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {POPULAR_ROUTES.map((route) => (
            <TouchableOpacity
              key={route.label}
              onPress={() => handlePopularRoute(route)}
              style={{
                backgroundColor:
                  from === route.from && to === route.to ? colors.primaryLight : colors.surfaceSecondary,
                borderWidth: 1,
                borderColor:
                  from === route.from && to === route.to ? colors.primary : colors.border,
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  ...typography.caption,
                  color: from === route.from && to === route.to ? colors.primary : colors.textSecondary,
                }}
              >
                {route.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Vehicle Card */}
      {selectedVehicle && (
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: 8 }}>
            Vehicle
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: colors.primaryLight,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 22 }}>{'\uD83D\uDD0B'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.bodyBold, color: colors.text }}>
                {selectedVehicle.make} {selectedVehicle.model}
              </Text>
              <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                {selectedVehicle.battery_capacity_kwh || 60} kWh
                {spec ? ` \u00B7 ${spec.rangeKm} km range` : ''}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: colors.secondaryGlow,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Text style={{ ...typography.small, color: colors.secondary }}>Selected</Text>
            </View>
          </View>
        </View>
      )}

      {/* Battery Level */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: 8 }}>
          Current Battery Level
        </Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => adjustBattery(-5)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: colors.surfaceSecondary,
                borderWidth: 1,
                borderColor: colors.border,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ ...typography.h3, color: colors.text }}>-</Text>
            </TouchableOpacity>
            <Text style={{ ...typography.mono, fontSize: 48, color: colors.primary, lineHeight: 56 }}>
              {batteryLevel}%
            </Text>
            <TouchableOpacity
              onPress={() => adjustBattery(5)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: colors.surfaceSecondary,
                borderWidth: 1,
                borderColor: colors.border,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ ...typography.h3, color: colors.text }}>+</Text>
            </TouchableOpacity>
          </View>
          {/* Slider track */}
          <View
            style={{
              height: 8,
              backgroundColor: colors.surfaceSecondary,
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: '100%',
                width: `${batteryLevel}%`,
                borderRadius: 4,
              }}
            />
          </View>
          {/* Quick set buttons */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            {[20, 40, 60, 80, 100].map((val) => (
              <TouchableOpacity
                key={val}
                onPress={() => setBatteryLevel(val)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: batteryLevel === val ? colors.primaryLight : 'transparent',
                }}
              >
                <Text
                  style={{
                    ...typography.small,
                    color: batteryLevel === val ? colors.primary : colors.textTertiary,
                  }}
                >
                  {val}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Average Speed */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: 8 }}>
          Average Speed
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {SPEED_OPTIONS.map((speed) => (
            <TouchableOpacity
              key={speed}
              onPress={() => setAvgSpeed(speed)}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: avgSpeed === speed ? colors.primaryLight : colors.surface,
                borderWidth: 1.5,
                borderColor: avgSpeed === speed ? colors.primary : colors.border,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  ...typography.mono,
                  fontSize: 16,
                  color: avgSpeed === speed ? colors.primary : colors.text,
                }}
              >
                {speed}
              </Text>
              <Text style={{ ...typography.small, color: colors.textTertiary, marginTop: 2 }}>
                km/h
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ ...typography.small, color: colors.textTertiary, marginTop: 8 }}>
          Higher speeds = more energy consumption
        </Text>
      </View>

      {/* Charging Strategy */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: 8 }}>
          Charging Strategy
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {/* Quick Stops */}
          <TouchableOpacity
            onPress={() => setChargingStrategy('quick')}
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderWidth: 1.5,
              borderColor: chargingStrategy === 'quick' ? colors.secondary : colors.border,
              borderRadius: 14,
              padding: 16,
            }}
          >
            <Text style={{ fontSize: 24, marginBottom: 8 }}>{'\u26A1'}</Text>
            <Text style={{ ...typography.bodyBold, color: colors.text, marginBottom: 4 }}>
              Quick Stops
            </Text>
            <Text style={{ ...typography.small, color: colors.textSecondary, lineHeight: 16 }}>
              2-3 short stops, 15-20 min each
            </Text>
          </TouchableOpacity>
          {/* Fewer Stops */}
          <TouchableOpacity
            onPress={() => setChargingStrategy('fewer')}
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderWidth: 1.5,
              borderColor: chargingStrategy === 'fewer' ? colors.secondary : colors.border,
              borderRadius: 14,
              padding: 16,
            }}
          >
            <Text style={{ fontSize: 24, marginBottom: 8 }}>{'\uD83D\uDD0B'}</Text>
            <Text style={{ ...typography.bodyBold, color: colors.text, marginBottom: 4 }}>
              Fewer Stops
            </Text>
            <Text style={{ ...typography.small, color: colors.textSecondary, lineHeight: 16 }}>
              1-2 longer stops, 30-45 min each
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Plan Button */}
      <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
        <TouchableOpacity onPress={handlePlanTrip} activeOpacity={0.85}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 14,
              paddingVertical: 18,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <Text
              style={{
                ...typography.button,
                fontSize: 17,
                color: colors.black,
                letterSpacing: 0.5,
              }}
            >
              Plan My Trip
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // ---------------------------------------------------------------------------
  // Render Step 2: AI Planning Animation
  // ---------------------------------------------------------------------------

  const PLANNING_LABELS = [
    'Calculating energy consumption...',
    'Analysing elevation profile...',
    'Finding charging stations along route...',
    'Optimizing stop duration...',
    'Checking nearby attractions...',
  ];

  const renderStep2 = () => (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
      }}
    >
      <Animated.Text
        style={{
          fontSize: 64,
          transform: [{ scale: pulseAnim }],
          marginBottom: 32,
        }}
      >
        {'\u26A1'}
      </Animated.Text>
      <Text style={{ ...typography.h3, color: colors.primary, textAlign: 'center', marginBottom: 32 }}>
        AI is planning your optimal route...
      </Text>
      <View style={{ gap: 16, width: '100%' }}>
        {PLANNING_LABELS.map((label, index) => {
          const visible = planningSteps.includes(index);
          return (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                opacity: visible ? 1 : 0.15,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: visible ? colors.secondary : colors.surfaceSecondary,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {visible && (
                  <Text style={{ color: colors.black, fontSize: 12, fontWeight: '700' }}>
                    {'\u2713'}
                  </Text>
                )}
              </View>
              <Text style={{ ...typography.body, color: visible ? colors.text : colors.textTertiary }}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  // ---------------------------------------------------------------------------
  // Render Step 3: Trip Plan Result
  // ---------------------------------------------------------------------------

  const renderStep3 = () => {
    if (!tripPlan) return null;

    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 }}>
          <TouchableOpacity onPress={() => setStep(1)} style={{ marginBottom: 16 }}>
            <Text style={{ ...typography.body, color: colors.textSecondary }}>{'\u2190'} Modify Trip</Text>
          </TouchableOpacity>
        </View>

        {/* Trip Summary Card */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <LinearGradient
            colors={[colors.surfaceTertiary, colors.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.primaryGlow,
              padding: 24,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.25 : 0.1,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            <Text style={{ ...typography.h2, color: colors.text, marginBottom: 20 }}>
              {tripPlan.from}
              {tripPlan.waypoints && tripPlan.waypoints.length > 0
                ? tripPlan.waypoints.map(wp => ` \u2192 ${wp.name}`).join('') + ` \u2192 ${tripPlan.to}`
                : ` \u2192 ${tripPlan.to}`
              }
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              <View style={{ minWidth: (SCREEN_WIDTH - 80) / 4 - 12 }}>
                <Text style={{ ...typography.mono, fontSize: 22, color: colors.primary }}>
                  {tripPlan.totalDistance}
                </Text>
                <Text style={{ ...typography.small, color: colors.textTertiary, marginTop: 2 }}>
                  km
                </Text>
              </View>
              <View style={{ minWidth: (SCREEN_WIDTH - 80) / 4 - 12 }}>
                <Text style={{ ...typography.mono, fontSize: 22, color: colors.primary }}>
                  {tripPlan.totalTime}
                </Text>
                <Text style={{ ...typography.small, color: colors.textTertiary, marginTop: 2 }}>
                  total time
                </Text>
              </View>
              <View style={{ minWidth: (SCREEN_WIDTH - 80) / 4 - 12 }}>
                <Text style={{ ...typography.mono, fontSize: 22, color: colors.secondary }}>
                  {tripPlan.totalChargeCost}
                </Text>
                <Text style={{ ...typography.small, color: colors.textTertiary, marginTop: 2 }}>
                  EGP charge
                </Text>
              </View>
              <View style={{ minWidth: (SCREEN_WIDTH - 80) / 4 - 12 }}>
                <Text style={{ ...typography.mono, fontSize: 22, color: colors.secondary }}>
                  {tripPlan.arrivalBattery}%
                </Text>
                <Text style={{ ...typography.small, color: colors.textTertiary, marginTop: 2 }}>
                  arrival
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Range Adjustments */}
        {(tripPlan.speedRangeAdjustment !== 0 || tripPlan.elevationRangeAdjustment !== 0) && (
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <View style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              padding: 14,
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 10,
            }}>
              {tripPlan.speedRangeAdjustment !== 0 && (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  backgroundColor: (tripPlan.speedRangeAdjustment ?? 0) > 0 ? colors.secondaryGlow : (colors.warningGlow || 'rgba(255,165,0,0.1)'),
                  paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                }}>
                  <Text style={{ fontSize: 14 }}>{'\uD83C\uDFCE\uFE0F'}</Text>
                  <Text style={{ ...typography.small, color: (tripPlan.speedRangeAdjustment ?? 0) > 0 ? colors.secondary : (colors.warning || '#FFA500') }}>
                    Speed: {(tripPlan.speedRangeAdjustment ?? 0) > 0 ? '+' : ''}{tripPlan.speedRangeAdjustment}% range
                  </Text>
                </View>
              )}
              {tripPlan.elevationRangeAdjustment !== 0 && tripPlan.elevationRangeAdjustment !== undefined && (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  backgroundColor: tripPlan.elevationRangeAdjustment > 0 ? colors.secondaryGlow : (colors.warningGlow || 'rgba(255,165,0,0.1)'),
                  paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                }}>
                  <Text style={{ fontSize: 14 }}>{'\u26F0\uFE0F'}</Text>
                  <Text style={{ ...typography.small, color: tripPlan.elevationRangeAdjustment > 0 ? colors.secondary : (colors.warning || '#FFA500') }}>
                    Elevation: {tripPlan.elevationRangeAdjustment > 0 ? '+' : ''}{tripPlan.elevationRangeAdjustment}% range
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Elevation Profile Chart */}
        {tripPlan.elevationProfile && tripPlan.elevationProfile.points.length > 2 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <View style={{
              backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
              borderRadius: 16, padding: 16, overflow: 'hidden',
            }}>
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                Elevation Profile
              </Text>
              <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 12, color: colors.secondary }}>{'\u25B2'}</Text>
                  <Text style={{ ...typography.mono, fontSize: 13, color: colors.secondary }}>{tripPlan.elevationProfile.totalAscent}m</Text>
                  <Text style={{ ...typography.small, color: colors.textTertiary }}>ascent</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 12, color: colors.primary }}>{'\u25BC'}</Text>
                  <Text style={{ ...typography.mono, fontSize: 13, color: colors.primary }}>{tripPlan.elevationProfile.totalDescent}m</Text>
                  <Text style={{ ...typography.small, color: colors.textTertiary }}>descent</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ ...typography.mono, fontSize: 13, color: colors.textSecondary }}>{tripPlan.elevationProfile.minElevation}-{tripPlan.elevationProfile.maxElevation}m</Text>
                </View>
              </View>
              {(() => {
                const ep = tripPlan.elevationProfile!;
                const cw = SCREEN_WIDTH - 72;
                const ch = 100;
                const pt = 8;
                const pb = 20;
                const dh = ch - pt - pb;
                const er = Math.max(ep.maxElevation - ep.minElevation, 10);
                const pts = ep.points.map((p, i) => {
                  const x = (i / (ep.points.length - 1)) * cw;
                  const y = pt + dh - ((p.elevation - ep.minElevation) / er) * dh;
                  return `${x},${y}`;
                }).join(' ');
                const by = pt + dh;
                const fp = `0,${by} ${pts} ${cw},${by}`;
                return (
                  <Svg width={cw} height={ch}>
                    <Defs>
                      <SvgLinearGradient id="elevFill" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.3" />
                        <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.02" />
                      </SvgLinearGradient>
                    </Defs>
                    <Line x1={0} y1={pt} x2={cw} y2={pt} stroke={colors.border} strokeWidth="0.5" />
                    <Line x1={0} y1={pt + dh / 2} x2={cw} y2={pt + dh / 2} stroke={colors.border} strokeWidth="0.5" strokeDasharray="4,4" />
                    <Line x1={0} y1={by} x2={cw} y2={by} stroke={colors.border} strokeWidth="0.5" />
                    <Polyline points={fp} fill="url(#elevFill)" stroke="none" />
                    <Polyline points={pts} fill="none" stroke={colors.primary} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                    <SvgText x={0} y={ch - 2} fill={colors.textTertiary} fontSize="9" textAnchor="start">0 km</SvgText>
                    <SvgText x={cw / 2} y={ch - 2} fill={colors.textTertiary} fontSize="9" textAnchor="middle">{Math.round(tripPlan.totalDistance / 2)} km</SvgText>
                    <SvgText x={cw} y={ch - 2} fill={colors.textTertiary} fontSize="9" textAnchor="end">{tripPlan.totalDistance} km</SvgText>
                  </Svg>
                );
              })()}
            </View>
          </View>
        )}

        {/* Route Timeline */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ ...typography.h3, color: colors.text, marginBottom: 16 }}>
            Charging Stops
          </Text>

          {/* Start marker */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginLeft: 5 }}>
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: colors.primary,
                marginRight: 14,
              }}
            />
            <Text style={{ ...typography.bodyBold, color: colors.text }}>
              {'\uD83D\uDCCD'} {tripPlan.from}
            </Text>
            <Text style={{ ...typography.caption, color: colors.textSecondary, marginLeft: 8 }}>
              {batteryLevel}% battery
            </Text>
          </View>

          {/* Waypoint segment info (if waypoints exist) */}
          {tripPlan.waypoints && tripPlan.waypoints.length > 0 && (
            <View style={{ marginLeft: 5, marginBottom: 8 }}>
              {/* Connecting line */}
              <View style={{ width: 2, height: 12, backgroundColor: colors.primary, marginLeft: 5 }} />
              {/* Segment badges */}
              <View style={{ marginLeft: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                {tripPlan.waypoints.map((wp, wi) => (
                  <View
                    key={`seg-${wi}`}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                      backgroundColor: colors.surfaceSecondary, borderRadius: 8,
                      borderWidth: 1, borderColor: colors.border,
                      paddingHorizontal: 10, paddingVertical: 6,
                    }}
                  >
                    <View
                      style={{
                        width: 20, height: 20, borderRadius: 10,
                        backgroundColor: colors.accent || colors.primaryLight,
                        justifyContent: 'center', alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{wi + 1}</Text>
                    </View>
                    <Text style={{ ...typography.small, color: colors.text, fontWeight: '600' }}>{wp.name}</Text>
                    <Text style={{ ...typography.small, color: colors.textTertiary }}>
                      {wp.segmentDistanceKm} km {'\u00B7'} {Math.floor(wp.segmentDurationMin / 60) > 0 ? `${Math.floor(wp.segmentDurationMin / 60)}h ` : ''}{wp.segmentDurationMin % 60}m
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {tripPlan.stops.map((stop, index) => (
            <View key={index} style={{ flexDirection: 'row' }}>
              {/* Timeline line + dot */}
              <View style={{ alignItems: 'center', width: 24, marginRight: 12 }}>
                <View
                  style={{
                    width: 2,
                    height: 20,
                    backgroundColor: colors.primary,
                  }}
                />
                <View
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: colors.primary,
                    borderWidth: 2,
                    borderColor: colors.background,
                  }}
                />
                <View
                  style={{
                    width: 2,
                    flex: 1,
                    backgroundColor:
                      index < tripPlan.stops.length - 1 ? colors.primary : 'transparent',
                  }}
                />
              </View>

              {/* Stop Card */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                {/* Header row */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 6,
                  }}
                >
                  <Text
                    style={{ ...typography.bodyBold, color: colors.text, flex: 1, marginRight: 8 }}
                    numberOfLines={2}
                  >
                    {stop.stationName}
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.primaryLight,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ ...typography.small, color: colors.primary }}>
                      {stop.chargerType}
                    </Text>
                  </View>
                </View>

                {/* Location */}
                <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: 12 }}>
                  {stop.location}
                </Text>

                {/* Battery bar */}
                <View style={{ marginBottom: 12 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <Text style={{ ...typography.mono, fontSize: 13, color: colors.text }}>
                      {stop.arrivalBattery}%
                    </Text>
                    <Text style={{ ...typography.small, color: colors.textTertiary }}>
                      {'\u2192'}
                    </Text>
                    <Text style={{ ...typography.mono, fontSize: 13, color: colors.secondary }}>
                      {stop.chargeToPercent}%
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 6,
                      backgroundColor: colors.surfaceSecondary,
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Arrival portion (dim) */}
                    <View
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${stop.arrivalBattery}%`,
                        backgroundColor: colors.textTertiary,
                        borderRadius: 3,
                        opacity: 0.4,
                      }}
                    />
                    {/* Charge portion (bright) */}
                    <View
                      style={{
                        position: 'absolute',
                        left: `${stop.arrivalBattery}%`,
                        top: 0,
                        bottom: 0,
                        width: `${stop.chargeToPercent - stop.arrivalBattery}%`,
                        backgroundColor: colors.primary,
                        borderRadius: 3,
                      }}
                    />
                  </View>
                </View>

                {/* Duration + Cost */}
                <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 13 }}>{'\u23F1'}</Text>
                    <Text style={{ ...typography.mono, fontSize: 13, color: colors.text }}>
                      {stop.chargeDuration} min
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 13 }}>{'\uD83D\uDCB0'}</Text>
                    <Text style={{ ...typography.mono, fontSize: 13, color: colors.secondary }}>
                      {stop.chargeCost} EGP
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 13 }}>{'\uD83D\uDCCF'}</Text>
                    <Text style={{ ...typography.mono, fontSize: 13, color: colors.textSecondary }}>
                      KM {stop.distanceFromStart}
                    </Text>
                  </View>
                </View>

                {/* Nearby Attractions */}
                {stop.attractions.length > 0 && (
                  <View>
                    <Text
                      style={{
                        ...typography.small,
                        color: colors.textTertiary,
                        marginBottom: 8,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                      }}
                    >
                      Nearby
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 8 }}
                    >
                      {stop.attractions.map((attr, ai) => (
                        <View
                          key={ai}
                          style={{
                            backgroundColor: colors.surfaceSecondary,
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: 10,
                            paddingHorizontal: 10,
                            paddingVertical: 7,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <Text style={{ fontSize: 14 }}>{attr.icon}</Text>
                          <Text style={{ ...typography.small, color: colors.text }}>
                            {attr.name}
                          </Text>
                          <Text style={{ ...typography.small, color: colors.textTertiary }}>
                            {'\u00B7'} {attr.distance}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          ))}

          {/* Destination marker */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 5, marginTop: 4 }}>
            {tripPlan.stops.length > 0 && (
              <View
                style={{
                  width: 2,
                  height: 20,
                  backgroundColor: colors.primary,
                  position: 'absolute',
                  left: 6,
                  top: -20,
                }}
              />
            )}
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: colors.secondary,
                marginRight: 14,
              }}
            />
            <Text style={{ ...typography.bodyBold, color: colors.text }}>
              {'\uD83C\uDFC1'} {tripPlan.to}
            </Text>
            <Text
              style={{
                ...typography.mono,
                fontSize: 13,
                color: tripPlan.arrivalBattery > 20 ? colors.secondary : colors.warning,
                marginLeft: 8,
              }}
            >
              {tripPlan.arrivalBattery}% battery
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ paddingHorizontal: 20, marginTop: 32, gap: 12 }}>
          {/* Save Trip */}
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Trip Saved! \u26A1',
                `Your ${tripPlan?.from || ''}${tripPlan?.waypoints?.length ? ` \u2192 ${tripPlan.waypoints.map(w => w.name).join(' \u2192 ')}` : ''} \u2192 ${tripPlan?.to || ''} trip with ${tripPlan?.stops.length || 0} charging stops has been saved.`,
              );
            }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 14,
                paddingVertical: 18,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Text style={{ ...typography.button, fontSize: 17, color: colors.black }}>
                Save Trip Plan
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Modify Trip */}
          <TouchableOpacity
            onPress={() => setStep(1)}
            style={{
              borderWidth: 1.5,
              borderColor: colors.primary,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ ...typography.button, color: colors.primary }}>Modify Trip</Text>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity
            onPress={() => Alert.alert('Share', 'Trip plan sharing will be available soon.')}
            style={{
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ ...typography.body, color: colors.textSecondary }}>Share Trip Plan</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  if (step === 1) return renderStep1();
  if (step === 2) return renderStep2();
  return renderStep3();
}
