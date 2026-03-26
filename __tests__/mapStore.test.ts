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
  it('clears filters', () => {
    useMapStore.getState().toggleConnectorType('CCS');
    useMapStore.getState().clearFilters();
    expect(useMapStore.getState().filters.connectorTypes).toHaveLength(0);
  });
});
