import { fleetService } from '@/core/services/fleetService';

jest.mock('@/core/config/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'f1', company_name: 'Test Fleet', plan: 'business', credit_balance: 5000 },
            error: null,
          }),
          order: jest.fn().mockReturnValue({ data: [], error: null }),
        }),
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: 'f1' }, error: null }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
  },
}));

describe('fleetService', () => {
  it('gets fleet by owner', async () => {
    const fleet = await fleetService.getFleetByOwner('u1');
    expect(fleet).toHaveProperty('company_name');
  });

  it('gets fleet vehicles', async () => {
    const vehicles = await fleetService.getFleetVehicles('f1');
    expect(Array.isArray(vehicles)).toBe(true);
  });

  it('gets fleet members', async () => {
    const members = await fleetService.getFleetMembers('f1');
    expect(Array.isArray(members)).toBe(true);
  });
});
