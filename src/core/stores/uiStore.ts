import { create } from 'zustand';

interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface UIStore {
  isFilterModalVisible: boolean;
  isNotificationsVisible: boolean;
  selectedProviderId: string | null;
  mapRegion: MapRegion | null;
  toggleFilterModal: () => void;
  toggleNotifications: () => void;
  setSelectedProvider: (id: string | null) => void;
  setMapRegion: (region: MapRegion | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isFilterModalVisible: false,
  isNotificationsVisible: false,
  selectedProviderId: null,
  mapRegion: null,
  toggleFilterModal: () => set((s) => ({ isFilterModalVisible: !s.isFilterModalVisible })),
  toggleNotifications: () => set((s) => ({ isNotificationsVisible: !s.isNotificationsVisible })),
  setSelectedProvider: (id) => set({ selectedProviderId: id }),
  setMapRegion: (mapRegion) => set({ mapRegion }),
}));
