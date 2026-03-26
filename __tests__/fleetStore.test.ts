import { useFleetStore } from '@/core/stores/fleetStore';

describe('fleetStore', () => {
  beforeEach(() => useFleetStore.getState().reset());

  it('sets fleet', () => {
    useFleetStore.getState().setFleet({
      id: 'f1',
      company_name: 'Test Fleet',
      plan: 'business',
      credit_balance: 5000,
      owner_id: 'u1',
      auto_topup_threshold: null,
      auto_topup_amount: null,
      created_at: '',
    });
    expect(useFleetStore.getState().fleet?.company_name).toBe('Test Fleet');
  });

  it('sets credit balance', () => {
    useFleetStore.getState().setCreditBalance(5000);
    expect(useFleetStore.getState().creditBalance).toBe(5000);
  });

  it('sets vehicles', () => {
    useFleetStore.getState().setVehicles([{ id: 'v1' } as any]);
    expect(useFleetStore.getState().vehicles).toHaveLength(1);
  });

  it('resets state', () => {
    useFleetStore.getState().setCreditBalance(9999);
    useFleetStore.getState().reset();
    expect(useFleetStore.getState().creditBalance).toBe(0);
    expect(useFleetStore.getState().fleet).toBeNull();
  });
});
