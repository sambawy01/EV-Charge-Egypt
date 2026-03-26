import { create } from 'zustand';
import type { StationFilter } from '../services/stationService';
import { DEFAULT_MAP_REGION } from '../config/constants';

interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface MapStore {
  region: MapRegion;
  searchQuery: string;
  filters: StationFilter;
  selectedStationId: string | null;
  isBottomSheetExpanded: boolean;
  setRegion: (region: MapRegion) => void;
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
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    set({ filters: { ...get().filters, connectorTypes: updated } });
  },
  setSelectedStation: (selectedStationId) => set({ selectedStationId }),
  setBottomSheetExpanded: (isBottomSheetExpanded) => set({ isBottomSheetExpanded }),
  clearFilters: () => set({ filters: { ...initialFilters } }),
  reset: () =>
    set({
      region: DEFAULT_MAP_REGION,
      searchQuery: '',
      filters: { ...initialFilters },
      selectedStationId: null,
      isBottomSheetExpanded: false,
    }),
}));
