import { chargingService } from '@/core/services/chargingService';

jest.mock('@/core/config/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 's1', kwh_delivered: 0 },
            error: null,
          }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: { id: 's1', kwh_delivered: 25.5, cost_total: 11.275 },
          error: null,
        }),
      }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          is: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 's1' },
              error: null,
            }),
          }),
        }),
      }),
    }),
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnValue({
        subscribe: jest.fn(),
      }),
      unsubscribe: jest.fn(),
    }),
  },
}));

describe('chargingService', () => {
  it('starts a charging session', async () => {
    const session = await chargingService.startSession({
      bookingId: 'b1',
      userId: 'u1',
      connectorId: 'c1',
    });
    expect(session).toHaveProperty('id');
  });

  it('returns unsubscribe function from subscribeToSession', () => {
    const unsubscribe = chargingService.subscribeToSession('s1', jest.fn());
    expect(typeof unsubscribe).toBe('function');
  });
});
