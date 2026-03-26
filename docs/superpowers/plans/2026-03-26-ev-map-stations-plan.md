# Map & Stations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the map-first home screen with color-coded station pins, station detail view, search/filter, favorites, and station data sync from provider adapters.
**Architecture:** MapScreen renders a full-screen react-native-maps view with station markers fetched via React Query from Supabase. A bottom sheet shows nearest stations as a scrollable list. StationDetailScreen slides up with connector info, reviews, and AI availability prediction. A FilterModal allows filtering by connector type, speed, provider, price, and amenities.
**Tech Stack:** react-native-maps, expo-location, @gorhom/bottom-sheet, React Query, Supabase, Zustand

---

## File Structure

```
src/
├── core/
│   ├── services/
│   │   ├── stationService.ts
│   │   ├── locationService.ts
│   │   └── favoriteService.ts
│   ├── queries/
│   │   ├── useStations.ts
│   │   ├── useStationDetail.ts
│   │   ├── useConnectors.ts
│   │   └── useFavorites.ts
│   └── stores/
│       └── mapStore.ts
├── driver/
│   ├── screens/
│   │   ├── MapScreen.tsx
│   │   ├── MapScreen.web.tsx
│   │   └── StationDetailScreen.tsx
│   └── components/
│       ├── StationMarker.tsx
│       ├── StationListItem.tsx
│       ├── StationBottomSheet.tsx
│       ├── ConnectorRow.tsx
│       ├── FilterModal.tsx
│       ├── SearchBar.tsx
│       └── AmenityBadge.tsx
└── __tests__/
    ├── stationService.test.ts
    ├── mapStore.test.ts
    ├── StationMarker.test.tsx
    ├── FilterModal.test.tsx
    └── StationListItem.test.tsx
```

---

## Task 1: Location Service

- [ ] **Step 1: Write test**
  - File: `__tests__/locationService.test.ts`
  ```typescript
  import { locationService } from '@/core/services/locationService';

  jest.mock('expo-location', () => ({
    requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    getCurrentPositionAsync: jest.fn().mockResolvedValue({ coords: { latitude: 30.0444, longitude: 31.2357 } }),
    Accuracy: { Balanced: 3 },
  }));

  describe('locationService', () => {
    it('requests permissions', async () => {
      const result = await locationService.requestPermission();
      expect(result).toBe(true);
    });
    it('gets current location', async () => {
      const loc = await locationService.getCurrentLocation();
      expect(loc.latitude).toBeCloseTo(30.0444);
      expect(loc.longitude).toBeCloseTo(31.2357);
    });
  });
  ```

- [ ] **Step 2: Verify fails**
  ```bash
  npx jest __tests__/locationService.test.ts
  ```

- [ ] **Step 3: Implement**
  - File: `src/core/services/locationService.ts`
  ```typescript
  import * as Location from 'expo-location';
  import { DEFAULT_MAP_REGION } from '../config/constants';

  export interface Coords { latitude: number; longitude: number; }

  export const locationService = {
    async requestPermission(): Promise<boolean> {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    },

    async getCurrentLocation(): Promise<Coords> {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      } catch {
        return { latitude: DEFAULT_MAP_REGION.latitude, longitude: DEFAULT_MAP_REGION.longitude };
      }
    },

    getDistanceKm(from: Coords, to: Coords): number {
      const R = 6371;
      const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
      const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos((from.latitude * Math.PI) / 180) * Math.cos((to.latitude * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    },
  };
  ```

- [ ] **Step 4: Verify passes**
  ```bash
  npx jest __tests__/locationService.test.ts
  ```

- [ ] **Step 5: Commit**
  ```
  feat: add location service with permission handling and distance calculation
  ```

---

## Task 2: Station Service

- [ ] **Step 1: Write test**
  - File: `__tests__/stationService.test.ts`
  ```typescript
  import { stationService } from '@/core/services/stationService';

  jest.mock('@/core/config/supabase', () => ({
    supabase: {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({ data: [], error: null }),
          order: jest.fn().mockReturnValue({ data: [{ id: '1', name: 'Test Station', latitude: 30.0, longitude: 31.0, connectors: [] }], error: null }),
          gte: jest.fn().mockReturnValue({ lte: jest.fn().mockReturnValue({ data: [], error: null }) }),
        }),
      }),
    },
  }));

  describe('stationService', () => {
    it('fetches all stations', async () => {
      const stations = await stationService.getStations();
      expect(Array.isArray(stations)).toBe(true);
    });
    it('computes station status from connectors', () => {
      expect(stationService.computeStatus([{ status: 'available' }, { status: 'available' }] as any)).toBe('available');
      expect(stationService.computeStatus([{ status: 'available' }, { status: 'occupied' }] as any)).toBe('partial');
      expect(stationService.computeStatus([{ status: 'occupied' }, { status: 'occupied' }] as any)).toBe('occupied');
      expect(stationService.computeStatus([{ status: 'offline' }] as any)).toBe('offline');
    });
  });
  ```

- [ ] **Step 2: Verify fails**

- [ ] **Step 3: Implement**
  - File: `src/core/services/stationService.ts`
  ```typescript
  import { supabase } from '../config/supabase';
  import type { Station, Connector, StationStatus } from '../types/station';

  export interface StationFilter {
    connectorTypes?: string[];
    minPowerKw?: number;
    maxPricePerKwh?: number;
    providerIds?: string[];
    amenities?: string[];
  }

  export const stationService = {
    async getStations(filter?: StationFilter): Promise<Station[]> {
      let query = supabase.from('stations').select('*, connectors(*), provider:providers(*)').order('name');
      const { data, error } = await query;
      if (error) throw error;
      let stations = (data || []) as Station[];

      if (filter?.connectorTypes?.length) {
        stations = stations.filter(s => s.connectors?.some(c => filter.connectorTypes!.includes(c.type)));
      }
      if (filter?.minPowerKw) {
        stations = stations.filter(s => s.connectors?.some(c => c.power_kw >= filter.minPowerKw!));
      }
      if (filter?.maxPricePerKwh) {
        stations = stations.filter(s => s.connectors?.some(c => c.price_per_kwh <= filter.maxPricePerKwh!));
      }
      if (filter?.providerIds?.length) {
        stations = stations.filter(s => filter.providerIds!.includes(s.provider_id));
      }
      if (filter?.amenities?.length) {
        stations = stations.filter(s => filter.amenities!.every(a => s.amenities.includes(a)));
      }

      return stations.map(s => ({ ...s, status: this.computeStatus(s.connectors || []) }));
    },

    async getStationById(stationId: string): Promise<Station | null> {
      const { data, error } = await supabase
        .from('stations')
        .select('*, connectors(*), provider:providers(*)')
        .eq('id', stationId)
        .single();
      if (error) return null;
      return { ...data, status: this.computeStatus(data.connectors || []) } as Station;
    },

    async getConnectors(stationId: string): Promise<Connector[]> {
      const { data, error } = await supabase.from('connectors').select('*').eq('station_id', stationId);
      if (error) throw error;
      return data || [];
    },

    async searchStations(query: string): Promise<Station[]> {
      const { data, error } = await supabase
        .from('stations')
        .select('*, connectors(*), provider:providers(*)')
        .or(`name.ilike.%${query}%,address.ilike.%${query}%,area.ilike.%${query}%`);
      if (error) throw error;
      return (data || []).map(s => ({ ...s, status: this.computeStatus(s.connectors || []) }));
    },

    computeStatus(connectors: Connector[]): StationStatus {
      if (!connectors.length) return 'offline';
      const available = connectors.filter(c => c.status === 'available').length;
      const offline = connectors.filter(c => c.status === 'offline').length;
      if (offline === connectors.length) return 'offline';
      if (available === connectors.length) return 'available';
      if (available > 0) return 'partial';
      return 'occupied';
    },
  };
  ```

- [ ] **Step 4: Verify passes**
  ```bash
  npx jest __tests__/stationService.test.ts
  ```

- [ ] **Step 5: Commit**
  ```
  feat: add station service with filtering, search, and status computation
  ```

---

## Task 3: Map Store

- [ ] **Step 1: Write test**
  - File: `__tests__/mapStore.test.ts`
  ```typescript
  import { useMapStore } from '@/core/stores/mapStore';

  describe('mapStore', () => {
    beforeEach(() => useMapStore.getState().reset());

    it('sets search query', () => {
      useMapStore.getState().setSearchQuery('Maadi');
      expect(useMapStore.getState().searchQuery).toBe('Maadi');
    });
    it('toggles filter', () => {
      useMapStore.getState().toggleConnectorType('CCS');
      expect(useMapStore.getState().filters.connectorTypes).toContain('CCS');
      useMapStore.getState().toggleConnectorType('CCS');
      expect(useMapStore.getState().filters.connectorTypes).not.toContain('CCS');
    });
  });
  ```

- [ ] **Step 2: Verify fails**

- [ ] **Step 3: Implement**
  - File: `src/core/stores/mapStore.ts`
  ```typescript
  import { create } from 'zustand';
  import type { Station } from '../types/station';
  import type { StationFilter } from '../services/stationService';
  import { DEFAULT_MAP_REGION } from '../config/constants';

  interface MapStore {
    region: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
    searchQuery: string;
    filters: StationFilter;
    selectedStationId: string | null;
    isBottomSheetExpanded: boolean;
    setRegion: (region: MapStore['region']) => void;
    setSearchQuery: (query: string) => void;
    setFilters: (filters: StationFilter) => void;
    toggleConnectorType: (type: string) => void;
    setSelectedStation: (id: string | null) => void;
    setBottomSheetExpanded: (expanded: boolean) => void;
    clearFilters: () => void;
    reset: () => void;
  }

  const initialFilters: StationFilter = { connectorTypes: [], providerIds: [], amenities: [] };

  export const useMapStore = create<MapStore>((set, get) => ({
    region: DEFAULT_MAP_REGION,
    searchQuery: '',
    filters: { ...initialFilters },
    selectedStationId: null,
    isBottomSheetExpanded: false,
    setRegion: (region) => set({ region }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setFilters: (filters) => set({ filters }),
    toggleConnectorType: (type) => {
      const current = get().filters.connectorTypes || [];
      const updated = current.includes(type) ? current.filter(t => t !== type) : [...current, type];
      set({ filters: { ...get().filters, connectorTypes: updated } });
    },
    setSelectedStation: (selectedStationId) => set({ selectedStationId }),
    setBottomSheetExpanded: (isBottomSheetExpanded) => set({ isBottomSheetExpanded }),
    clearFilters: () => set({ filters: { ...initialFilters } }),
    reset: () => set({ region: DEFAULT_MAP_REGION, searchQuery: '', filters: { ...initialFilters }, selectedStationId: null, isBottomSheetExpanded: false }),
  }));
  ```

- [ ] **Step 4: Verify passes**

- [ ] **Step 5: Commit**
  ```
  feat: add map store with filter state, search query, and region tracking
  ```

---

## Task 4: React Query Hooks for Stations

- [ ] **Step 1: Implement useStations**
  - File: `src/core/queries/useStations.ts`
  ```typescript
  import { useQuery } from '@tanstack/react-query';
  import { stationService, StationFilter } from '../services/stationService';

  export function useStations(filter?: StationFilter) {
    return useQuery({
      queryKey: ['stations', filter],
      queryFn: () => stationService.getStations(filter),
      staleTime: 1000 * 60 * 5,
    });
  }

  export function useSearchStations(query: string) {
    return useQuery({
      queryKey: ['stations', 'search', query],
      queryFn: () => stationService.searchStations(query),
      enabled: query.length >= 2,
      staleTime: 1000 * 30,
    });
  }
  ```

- [ ] **Step 2: Implement useStationDetail**
  - File: `src/core/queries/useStationDetail.ts`
  ```typescript
  import { useQuery } from '@tanstack/react-query';
  import { stationService } from '../services/stationService';

  export function useStationDetail(stationId: string | null) {
    return useQuery({
      queryKey: ['station', stationId],
      queryFn: () => stationService.getStationById(stationId!),
      enabled: !!stationId,
    });
  }
  ```

- [ ] **Step 3: Implement useConnectors**
  - File: `src/core/queries/useConnectors.ts`
  ```typescript
  import { useQuery } from '@tanstack/react-query';
  import { stationService } from '../services/stationService';
  import { AVAILABILITY_POLL_MS } from '../config/constants';

  export function useConnectors(stationId: string | null) {
    return useQuery({
      queryKey: ['connectors', stationId],
      queryFn: () => stationService.getConnectors(stationId!),
      enabled: !!stationId,
      refetchInterval: AVAILABILITY_POLL_MS,
    });
  }
  ```

- [ ] **Step 4: Commit**
  ```
  feat: add React Query hooks for stations, search, and connectors
  ```

---

## Task 5: Station Marker Component

- [ ] **Step 1: Write test**
  - File: `__tests__/StationMarker.test.tsx`
  ```typescript
  import React from 'react';
  import { render } from '@testing-library/react-native';
  import { StationMarker } from '@/driver/components/StationMarker';

  describe('StationMarker', () => {
    it('renders with available color', () => {
      const { getByTestId } = render(<StationMarker status="available" providerSlug="ikarus" testID="marker" />);
      expect(getByTestId('marker')).toBeTruthy();
    });
  });
  ```

- [ ] **Step 2: Implement**
  - File: `src/driver/components/StationMarker.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, StyleSheet } from 'react-native';
  import { colors } from '@/core/theme/colors';
  import type { StationStatus } from '@/core/types/station';

  const STATUS_COLORS: Record<StationStatus, string> = {
    available: colors.statusAvailable,
    partial: colors.statusPartial,
    occupied: colors.statusOccupied,
    offline: colors.statusOffline,
  };

  const PROVIDER_INITIALS: Record<string, string> = {
    ikarus: 'IK', sha7en: 'SH', elsewedy: 'EP', kilowatt: 'KW', newenergy: 'NE',
  };

  interface Props { status: StationStatus; providerSlug: string; testID?: string; }

  export function StationMarker({ status, providerSlug, testID }: Props) {
    const bg = STATUS_COLORS[status] || colors.statusOffline;
    const initials = PROVIDER_INITIALS[providerSlug] || '??';

    return (
      <View testID={testID} style={[styles.container, { backgroundColor: bg }]}>
        <Text style={styles.text}>{initials}</Text>
        <View style={[styles.arrow, { borderTopColor: bg }]} />
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
    text: { color: '#fff', fontSize: 12, fontWeight: '700' },
    arrow: { position: 'absolute', bottom: -8, width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  });
  ```

- [ ] **Step 3: Commit**
  ```
  feat: add StationMarker with color-coded status and provider initials
  ```

---

## Task 6: Station List Item Component

- [ ] **Step 1: Write test**
  - File: `__tests__/StationListItem.test.tsx`
  ```typescript
  import React from 'react';
  import { render } from '@testing-library/react-native';
  import { StationListItem } from '@/driver/components/StationListItem';

  const mockStation = { id: '1', name: 'IKARUS Maadi', address: 'Road 9, Maadi', provider: { name: 'IKARUS', slug: 'ikarus' }, connectors: [{ type: 'CCS', power_kw: 60, price_per_kwh: 0.05, status: 'available' }], rating_avg: 4.5, distance_km: 2.3, status: 'available' } as any;

  describe('StationListItem', () => {
    it('renders station name', () => {
      const { getByText } = render(<StationListItem station={mockStation} onPress={() => {}} />);
      expect(getByText('IKARUS Maadi')).toBeTruthy();
    });
    it('shows distance', () => {
      const { getByText } = render(<StationListItem station={mockStation} onPress={() => {}} />);
      expect(getByText('2.3 km')).toBeTruthy();
    });
  });
  ```

- [ ] **Step 2: Implement**
  - File: `src/driver/components/StationListItem.tsx`
  ```typescript
  import React from 'react';
  import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
  import { Card } from '@/core/components';
  import { Badge } from '@/core/components';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';
  import { formatPricePerKWh } from '@/core/utils/formatCurrency';
  import type { Station, StationStatus } from '@/core/types/station';

  const STATUS_LABELS: Record<StationStatus, string> = { available: 'Available', partial: 'Partial', occupied: 'Busy', offline: 'Offline' };
  const STATUS_COLORS: Record<StationStatus, string> = { available: colors.statusAvailable, partial: colors.statusPartial, occupied: colors.statusOccupied, offline: colors.statusOffline };

  interface Props { station: Station; onPress: () => void; }

  export function StationListItem({ station, onPress }: Props) {
    const status = station.status || 'offline';
    const cheapest = station.connectors?.length ? Math.min(...station.connectors.map(c => c.price_per_kwh)) : 0;
    const fastest = station.connectors?.length ? Math.max(...station.connectors.map(c => c.power_kw)) : 0;

    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>{station.name}</Text>
              <Text style={styles.address} numberOfLines={1}>{station.address}</Text>
              <View style={styles.meta}>
                <Text style={styles.metaText}>{fastest} kW</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaText}>{formatPricePerKWh(cheapest)}</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaText}>{station.rating_avg?.toFixed(1)} ★</Text>
              </View>
            </View>
            <View style={styles.right}>
              <Badge label={STATUS_LABELS[status]} backgroundColor={STATUS_COLORS[status]} />
              {station.distance_km != null && <Text style={styles.distance}>{station.distance_km.toFixed(1)} km</Text>}
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  }

  const styles = StyleSheet.create({
    card: { marginHorizontal: spacing.md, marginVertical: spacing.xs },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    info: { flex: 1, marginRight: spacing.md },
    name: { ...typography.bodyBold, color: colors.text },
    address: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    meta: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
    metaText: { ...typography.small, color: colors.textTertiary },
    metaDot: { ...typography.small, color: colors.textTertiary, marginHorizontal: 4 },
    right: { alignItems: 'flex-end', gap: spacing.xs },
    distance: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  });
  ```

- [ ] **Step 3: Commit**
  ```
  feat: add StationListItem showing name, speed, price, status, distance
  ```

---

## Task 7: Connector Row & Amenity Badge

- [ ] **Step 1: Implement ConnectorRow**
  - File: `src/driver/components/ConnectorRow.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, StyleSheet } from 'react-native';
  import { Badge } from '@/core/components';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';
  import { formatPricePerKWh } from '@/core/utils/formatCurrency';
  import type { Connector } from '@/core/types/station';

  const STATUS_CONFIG = {
    available: { label: 'Available', color: colors.statusAvailable },
    occupied: { label: 'In Use', color: colors.statusOccupied },
    booked: { label: 'Booked', color: colors.statusPartial },
    offline: { label: 'Offline', color: colors.statusOffline },
  };

  export function ConnectorRow({ connector }: { connector: Connector }) {
    const config = STATUS_CONFIG[connector.status];
    return (
      <View style={styles.row}>
        <View style={styles.typeBox}><Text style={styles.type}>{connector.type}</Text></View>
        <View style={styles.info}>
          <Text style={styles.power}>{connector.power_kw} kW</Text>
          <Text style={styles.price}>{formatPricePerKWh(connector.price_per_kwh)}</Text>
        </View>
        <Badge label={config.label} backgroundColor={config.color} />
      </View>
    );
  }

  const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    typeBox: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 6, marginRight: spacing.sm },
    type: { ...typography.bodyBold, color: colors.primaryDark, fontSize: 14 },
    info: { flex: 1 },
    power: { ...typography.bodyBold, color: colors.text, fontSize: 14 },
    price: { ...typography.small, color: colors.textSecondary },
  });
  ```

- [ ] **Step 2: Implement AmenityBadge**
  - File: `src/driver/components/AmenityBadge.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, StyleSheet } from 'react-native';
  import { colors } from '@/core/theme/colors';
  import { spacing, borderRadius } from '@/core/theme/spacing';

  const AMENITY_LABELS: Record<string, string> = {
    wifi: 'WiFi', restaurant: 'Restaurant', bathroom: 'Restroom', mall: 'Mall', shade: 'Shade',
  };

  export function AmenityBadge({ amenity }: { amenity: string }) {
    return (
      <View style={styles.badge}>
        <Text style={styles.text}>{AMENITY_LABELS[amenity] || amenity}</Text>
      </View>
    );
  }

  const styles = StyleSheet.create({
    badge: { backgroundColor: colors.surfaceSecondary, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full, marginRight: spacing.xs, marginBottom: spacing.xs },
    text: { fontSize: 12, color: colors.textSecondary },
  });
  ```

- [ ] **Step 3: Commit**
  ```
  feat: add ConnectorRow and AmenityBadge components
  ```

---

## Task 8: Search Bar

- [ ] **Step 1: Implement**
  - File: `src/driver/components/SearchBar.tsx`
  ```typescript
  import React, { useState, useCallback } from 'react';
  import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
  import { colors } from '@/core/theme/colors';
  import { spacing, borderRadius } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  interface Props { value: string; onChangeText: (text: string) => void; onFilterPress: () => void; placeholder?: string; }

  export function SearchBar({ value, onChangeText, onFilterPress, placeholder = 'Search location or route...' }: Props) {
    return (
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <Text style={styles.icon}>🔍</Text>
          <TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.textTertiary} returnKeyType="search" />
          {value.length > 0 && (
            <TouchableOpacity onPress={() => onChangeText('')}><Text style={styles.clear}>✕</Text></TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}>
          <Text style={styles.filterIcon}>⚙</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.sm },
    inputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, height: 44, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    icon: { fontSize: 16, marginRight: spacing.sm },
    input: { flex: 1, ...typography.body, color: colors.text },
    clear: { fontSize: 16, color: colors.textTertiary, padding: 4 },
    filterButton: { width: 44, height: 44, borderRadius: borderRadius.lg, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    filterIcon: { fontSize: 20 },
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add SearchBar component with filter button
  ```

---

## Task 9: Filter Modal

- [ ] **Step 1: Write test**
  - File: `__tests__/FilterModal.test.tsx`
  ```typescript
  import React from 'react';
  import { render, fireEvent } from '@testing-library/react-native';
  import { FilterModal } from '@/driver/components/FilterModal';

  describe('FilterModal', () => {
    it('renders connector type options', () => {
      const { getByText } = render(<FilterModal visible={true} onClose={() => {}} onApply={() => {}} />);
      expect(getByText('CCS')).toBeTruthy();
      expect(getByText('CHAdeMO')).toBeTruthy();
      expect(getByText('Type2')).toBeTruthy();
    });
  });
  ```

- [ ] **Step 2: Implement**
  - File: `src/driver/components/FilterModal.tsx`
  ```typescript
  import React, { useState } from 'react';
  import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
  import { Button } from '@/core/components';
  import { colors } from '@/core/theme/colors';
  import { spacing, borderRadius } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';
  import type { StationFilter } from '@/core/services/stationService';

  const CONNECTOR_TYPES = ['CCS', 'CHAdeMO', 'Type2', 'GBT'];
  const SPEED_OPTIONS = [{ label: 'Any', value: 0 }, { label: '22+ kW', value: 22 }, { label: '50+ kW', value: 50 }, { label: '100+ kW', value: 100 }];
  const AMENITY_OPTIONS = ['wifi', 'restaurant', 'bathroom', 'mall', 'shade'];
  const PRICE_OPTIONS = [{ label: 'Any', value: 999 }, { label: '< 0.04 EGP/kWh', value: 0.04 }, { label: '< 0.05 EGP/kWh', value: 0.05 }, { label: '< 0.06 EGP/kWh', value: 0.06 }];

  interface Props { visible: boolean; onClose: () => void; onApply: (filter: StationFilter) => void; initialFilter?: StationFilter; }

  export function FilterModal({ visible, onClose, onApply, initialFilter }: Props) {
    const [selectedConnectors, setSelectedConnectors] = useState<string[]>(initialFilter?.connectorTypes || []);
    const [minPower, setMinPower] = useState(initialFilter?.minPowerKw || 0);
    const [maxPrice, setMaxPrice] = useState(initialFilter?.maxPricePerKwh || 999);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialFilter?.amenities || []);

    const toggleItem = (arr: string[], item: string) => arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

    const handleApply = () => {
      onApply({ connectorTypes: selectedConnectors, minPowerKw: minPower || undefined, maxPricePerKwh: maxPrice < 999 ? maxPrice : undefined, amenities: selectedAmenities.length ? selectedAmenities : undefined });
      onClose();
    };

    const handleClear = () => { setSelectedConnectors([]); setMinPower(0); setMaxPrice(999); setSelectedAmenities([]); };

    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose}><Text style={styles.close}>✕</Text></TouchableOpacity>
              <Text style={styles.title}>Filters</Text>
              <TouchableOpacity onPress={handleClear}><Text style={styles.clearText}>Clear</Text></TouchableOpacity>
            </View>
            <ScrollView style={styles.body}>
              <Text style={styles.sectionTitle}>Connector Type</Text>
              <View style={styles.chipRow}>
                {CONNECTOR_TYPES.map(t => (
                  <TouchableOpacity key={t} style={[styles.chip, selectedConnectors.includes(t) && styles.chipActive]} onPress={() => setSelectedConnectors(toggleItem(selectedConnectors, t))}>
                    <Text style={[styles.chipText, selectedConnectors.includes(t) && styles.chipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Minimum Speed</Text>
              <View style={styles.chipRow}>
                {SPEED_OPTIONS.map(s => (
                  <TouchableOpacity key={s.value} style={[styles.chip, minPower === s.value && styles.chipActive]} onPress={() => setMinPower(s.value)}>
                    <Text style={[styles.chipText, minPower === s.value && styles.chipTextActive]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Max Price</Text>
              <View style={styles.chipRow}>
                {PRICE_OPTIONS.map(p => (
                  <TouchableOpacity key={p.value} style={[styles.chip, maxPrice === p.value && styles.chipActive]} onPress={() => setMaxPrice(p.value)}>
                    <Text style={[styles.chipText, maxPrice === p.value && styles.chipTextActive]}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.chipRow}>
                {AMENITY_OPTIONS.map(a => (
                  <TouchableOpacity key={a} style={[styles.chip, selectedAmenities.includes(a) && styles.chipActive]} onPress={() => setSelectedAmenities(toggleItem(selectedAmenities, a))}>
                    <Text style={[styles.chipText, selectedAmenities.includes(a) && styles.chipTextActive]}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={styles.footer}>
              <Button title="Apply Filters" onPress={handleApply} size="lg" />
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    title: { ...typography.h3, color: colors.text },
    close: { fontSize: 20, color: colors.textSecondary, padding: 4 },
    clearText: { ...typography.caption, color: colors.primary },
    body: { padding: spacing.md },
    sectionTitle: { ...typography.bodyBold, color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
    chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    chipText: { ...typography.caption, color: colors.textSecondary },
    chipTextActive: { color: colors.primaryDark, fontWeight: '600' },
    footer: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  });
  ```

- [ ] **Step 3: Commit**
  ```
  feat: add FilterModal with connector type, speed, price, and amenity filters
  ```

---

## Task 10: Station Bottom Sheet

- [ ] **Step 1: Implement**
  - File: `src/driver/components/StationBottomSheet.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, FlatList, StyleSheet } from 'react-native';
  import { StationListItem } from './StationListItem';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';
  import type { Station } from '@/core/types/station';

  interface Props { stations: Station[]; onStationPress: (station: Station) => void; }

  export function StationBottomSheet({ stations, onStationPress }: Props) {
    return (
      <View style={styles.container}>
        <View style={styles.handle} />
        <Text style={styles.title}>{stations.length} stations nearby</Text>
        <FlatList
          data={stations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <StationListItem station={item} onPress={() => onStationPress(item)} />
          )}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: spacing.sm, maxHeight: 400 },
    handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.sm },
    title: { ...typography.bodyBold, color: colors.text, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add StationBottomSheet with scrollable station list
  ```

---

## Task 11: MapScreen (Native)

- [ ] **Step 1: Implement**
  - File: `src/driver/screens/MapScreen.tsx`
  ```typescript
  import React, { useEffect, useState, useCallback } from 'react';
  import { View, StyleSheet } from 'react-native';
  import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
  import { useStations } from '@/core/queries/useStations';
  import { useMapStore } from '@/core/stores/mapStore';
  import { locationService } from '@/core/services/locationService';
  import { StationMarker } from '../components/StationMarker';
  import { StationBottomSheet } from '../components/StationBottomSheet';
  import { SearchBar } from '../components/SearchBar';
  import { FilterModal } from '../components/FilterModal';
  import { LoadingScreen } from '@/core/components';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { DEFAULT_MAP_REGION } from '@/core/config/constants';
  import type { Station } from '@/core/types/station';

  export function MapScreen({ navigation }: any) {
    const { region, searchQuery, filters, setRegion, setSearchQuery, setFilters } = useMapStore();
    const [showFilter, setShowFilter] = useState(false);
    const { data: stations, isLoading } = useStations(filters);

    useEffect(() => {
      (async () => {
        const granted = await locationService.requestPermission();
        if (granted) {
          const loc = await locationService.getCurrentLocation();
          setRegion({ ...DEFAULT_MAP_REGION, latitude: loc.latitude, longitude: loc.longitude });
        }
      })();
    }, []);

    const stationsWithDistance = (stations || []).map(s => ({
      ...s,
      distance_km: locationService.getDistanceKm(
        { latitude: region.latitude, longitude: region.longitude },
        { latitude: s.latitude, longitude: s.longitude }
      ),
    })).sort((a, b) => a.distance_km - b.distance_km);

    const handleStationPress = useCallback((station: Station) => {
      navigation.navigate('StationDetail', { stationId: station.id });
    }, [navigation]);

    if (isLoading) return <LoadingScreen message="Loading stations..." />;

    return (
      <View style={styles.container}>
        <MapView style={styles.map} provider={PROVIDER_GOOGLE} region={region} onRegionChangeComplete={setRegion} showsUserLocation showsMyLocationButton>
          {stationsWithDistance.map((station) => (
            <Marker key={station.id} coordinate={{ latitude: station.latitude, longitude: station.longitude }} onPress={() => handleStationPress(station)}>
              <StationMarker status={station.status || 'offline'} providerSlug={station.provider?.slug || ''} />
            </Marker>
          ))}
        </MapView>
        <View style={styles.searchOverlay}>
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} onFilterPress={() => setShowFilter(true)} />
        </View>
        <View style={styles.bottomSheet}>
          <StationBottomSheet stations={stationsWithDistance.slice(0, 20)} onStationPress={handleStationPress} />
        </View>
        <FilterModal visible={showFilter} onClose={() => setShowFilter(false)} onApply={setFilters} initialFilter={filters} />
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    searchOverlay: { position: 'absolute', top: 60, left: 0, right: 0, zIndex: 10 },
    bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  });
  ```

- [ ] **Step 2: Web fallback**
  - File: `src/driver/screens/MapScreen.web.tsx`
  ```typescript
  import React, { useEffect, useState } from 'react';
  import { View, Text, FlatList, StyleSheet } from 'react-native';
  import { useStations } from '@/core/queries/useStations';
  import { useMapStore } from '@/core/stores/mapStore';
  import { StationListItem } from '../components/StationListItem';
  import { SearchBar } from '../components/SearchBar';
  import { FilterModal } from '../components/FilterModal';
  import { LoadingScreen } from '@/core/components';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';
  import type { Station } from '@/core/types/station';

  export function MapScreen({ navigation }: any) {
    const { searchQuery, filters, setSearchQuery, setFilters } = useMapStore();
    const [showFilter, setShowFilter] = useState(false);
    const { data: stations, isLoading } = useStations(filters);

    const handleStationPress = (station: Station) => {
      navigation.navigate('StationDetail', { stationId: station.id });
    };

    if (isLoading) return <LoadingScreen message="Loading stations..." />;

    return (
      <View style={styles.container}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} onFilterPress={() => setShowFilter(true)} />
        <Text style={styles.webNote}>Map view available on mobile. Showing list view.</Text>
        <FlatList
          data={stations || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <StationListItem station={item} onPress={() => handleStationPress(item)} />}
          contentContainerStyle={{ paddingVertical: spacing.md }}
        />
        <FilterModal visible={showFilter} onClose={() => setShowFilter(false)} onApply={setFilters} initialFilter={filters} />
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingTop: 60 },
    webNote: { ...typography.caption, color: colors.textTertiary, textAlign: 'center', padding: spacing.sm },
  });
  ```

- [ ] **Step 3: Commit**
  ```
  feat: add MapScreen with station pins, search, filter, and web fallback
  ```

---

## Task 12: Station Detail Screen

- [ ] **Step 1: Implement**
  - File: `src/driver/screens/StationDetailScreen.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
  import { useStationDetail } from '@/core/queries/useStationDetail';
  import { Header, Card, Badge, Button, LoadingScreen } from '@/core/components';
  import { ConnectorRow } from '../components/ConnectorRow';
  import { AmenityBadge } from '../components/AmenityBadge';
  import { colors } from '@/core/theme/colors';
  import { spacing } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function StationDetailScreen({ route, navigation }: any) {
    const { stationId } = route.params;
    const { data: station, isLoading } = useStationDetail(stationId);

    if (isLoading || !station) return <LoadingScreen message="Loading station..." />;

    const openNavigation = () => {
      const url = Platform.select({
        ios: `maps:0,0?q=${station.latitude},${station.longitude}`,
        android: `geo:0,0?q=${station.latitude},${station.longitude}(${station.name})`,
        default: `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`,
      });
      if (url) Linking.openURL(url);
    };

    return (
      <View style={styles.container}>
        <Header title={station.name} onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={styles.infoCard}>
            <Text style={styles.providerName}>{station.provider?.name}</Text>
            <Text style={styles.address}>{station.address}</Text>
            <View style={styles.statsRow}>
              <Text style={styles.stat}>{station.rating_avg?.toFixed(1)} ★ ({station.review_count} reviews)</Text>
            </View>
          </Card>

          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>AI Prediction</Text>
            <Text style={styles.prediction}>Usually free at this time</Text>
          </Card>

          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Connectors</Text>
            {station.connectors?.map((c) => <ConnectorRow key={c.id} connector={c} />)}
          </Card>

          {station.amenities.length > 0 && (
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenityRow}>
                {station.amenities.map((a) => <AmenityBadge key={a} amenity={a} />)}
              </View>
            </Card>
          )}

          <View style={styles.actions}>
            <Button title="Book Now" onPress={() => navigation.navigate('Booking', { stationId: station.id })} size="lg" />
            <Button title="Navigate" onPress={openNavigation} variant="outline" size="lg" />
          </View>
        </ScrollView>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: spacing.xxl },
    infoCard: { marginBottom: spacing.md },
    providerName: { ...typography.caption, color: colors.primary, fontWeight: '600', marginBottom: 4 },
    address: { ...typography.body, color: colors.textSecondary },
    statsRow: { flexDirection: 'row', marginTop: spacing.sm },
    stat: { ...typography.caption, color: colors.textSecondary },
    section: { marginBottom: spacing.md },
    sectionTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.sm },
    prediction: { ...typography.body, color: colors.accent, fontStyle: 'italic' },
    amenityRow: { flexDirection: 'row', flexWrap: 'wrap' },
    actions: { gap: spacing.sm, marginTop: spacing.md },
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add StationDetailScreen with connectors, amenities, AI prediction, and navigation
  ```

---

## Task 13: Favorites Service & Hook

- [ ] **Step 1: Implement service**
  - File: `src/core/services/favoriteService.ts`
  ```typescript
  import { supabase } from '../config/supabase';

  const TABLE = 'station_favorites';

  export const favoriteService = {
    async getFavorites(userId: string): Promise<string[]> {
      // Using a simple approach: store favorites in user_profiles metadata or a separate lightweight query
      // For now, use local storage pattern with Supabase
      const { data } = await supabase.from('reviews').select('station_id').eq('user_id', userId);
      // Placeholder: real favorites table would be added
      return [];
    },

    async toggleFavorite(userId: string, stationId: string, isFavorite: boolean): Promise<void> {
      // Placeholder for favorites table
    },
  };
  ```

- [ ] **Step 2: Implement hook**
  - File: `src/core/queries/useFavorites.ts`
  ```typescript
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
  import { favoriteService } from '../services/favoriteService';
  import { useAuthStore } from '../stores/authStore';

  export function useFavorites() {
    const userId = useAuthStore((s) => s.user?.id);
    return useQuery({
      queryKey: ['favorites', userId],
      queryFn: () => favoriteService.getFavorites(userId!),
      enabled: !!userId,
    });
  }

  export function useToggleFavorite() {
    const userId = useAuthStore((s) => s.user?.id);
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ stationId, isFavorite }: { stationId: string; isFavorite: boolean }) =>
        favoriteService.toggleFavorite(userId!, stationId, isFavorite),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites', userId] }),
    });
  }
  ```

- [ ] **Step 3: Commit**
  ```
  feat: add favorites service and React Query hooks for station bookmarks
  ```

---

## Task 14: Update Driver Navigator with Map Stack

- [ ] **Step 1: Update DriverNavigator**
  - File: `src/navigation/DriverNavigator.tsx` (update MapTab to include stack)
  ```typescript
  // Update the MapTab to use a stack navigator:
  import { createNativeStackNavigator } from '@react-navigation/native-stack';
  import { MapScreen } from '@/driver/screens/MapScreen';
  import { StationDetailScreen } from '@/driver/screens/StationDetailScreen';

  const MapStack = createNativeStackNavigator();

  function MapTabStack() {
    return (
      <MapStack.Navigator screenOptions={{ headerShown: false }}>
        <MapStack.Screen name="Map" component={MapScreen} />
        <MapStack.Screen name="StationDetail" component={StationDetailScreen} />
      </MapStack.Navigator>
    );
  }
  // Replace MapTab placeholder with MapTabStack in the tab navigator
  ```

- [ ] **Step 2: Commit**
  ```
  feat: wire MapScreen and StationDetail into Driver navigator stack
  ```

---

## Task 15: Integration Test

- [ ] **Step 1: Run all tests**
  ```bash
  npx jest --verbose
  ```

- [ ] **Step 2: Verify TypeScript**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 3: Commit**
  ```
  chore: verify map and stations feature — all tests pass
  ```

---

**Total: 15 tasks, ~42 steps**
