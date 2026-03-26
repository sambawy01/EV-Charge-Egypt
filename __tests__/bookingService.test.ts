import { bookingService } from '@/core/services/bookingService';

jest.mock('@/core/config/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest
            .fn()
            .mockResolvedValue({
              data: { id: 'b1', status: 'confirmed' },
              error: null,
            }),
        }),
      }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest
            .fn()
            .mockReturnValue({ data: [{ id: 'b1', status: 'confirmed' }], error: null }),
          single: jest
            .fn()
            .mockResolvedValue({
              data: { id: 'b1', status: 'confirmed' },
              error: null,
            }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
  },
}));

describe('bookingService', () => {
  it('creates a booking', async () => {
    const booking = await bookingService.createBooking({
      userId: 'u1',
      connectorId: 'c1',
      stationId: 's1',
      scheduledStart: new Date().toISOString(),
      scheduledEnd: new Date().toISOString(),
    });
    expect(booking).toHaveProperty('id');
  });

  it('fetches user bookings', async () => {
    const bookings = await bookingService.getUserBookings('u1');
    expect(Array.isArray(bookings)).toBe(true);
  });

  it('cancels a booking', async () => {
    await expect(
      bookingService.cancelBooking('b1'),
    ).resolves.not.toThrow();
  });

  it('estimates cost with service fee for driver', () => {
    const result = bookingService.estimateCost(0.5, 20, false);
    expect(result.providerCost).toBe(10);
    expect(result.serviceFee).toBe(10);
    expect(result.total).toBe(20);
  });

  it('estimates cost without service fee for fleet', () => {
    const result = bookingService.estimateCost(0.5, 20, true);
    expect(result.serviceFee).toBe(0);
  });
});
