import { vehicleService } from '@/core/services/vehicleService';

jest.mock('@/core/config/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [{ id: 'v1', make: 'BYD', model: 'Atto 3' }],
            error: null,
          }),
        }),
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: 'v1' }, error: null }),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    }),
  },
}));

describe('vehicleService', () => {
  it('gets user vehicles', async () => {
    const vehicles = await vehicleService.getUserVehicles('u1');
    expect(vehicles.length).toBeGreaterThan(0);
  });

  it('adds a vehicle', async () => {
    const vehicle = await vehicleService.addVehicle({
      userId: 'u1',
      make: 'BYD',
      model: 'Atto 3',
      batteryCapacityKwh: 60.48,
      connectorTypes: ['CCS', 'Type2'],
    });
    expect(vehicle).toHaveProperty('id');
  });

  it('has delete method', () => expect(vehicleService.deleteVehicle).toBeDefined());
  it('has update method', () => expect(vehicleService.updateVehicle).toBeDefined());
});
