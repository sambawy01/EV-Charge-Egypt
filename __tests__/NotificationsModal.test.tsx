import React from 'react';
import { render } from '@testing-library/react-native';
import { NotificationsModal } from '@/driver/components/NotificationsModal';

jest.mock('@/core/config/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'n1',
                  title: 'Booking Confirmed',
                  body: 'Your booking is confirmed',
                  read: false,
                  type: 'booking_reminder',
                  created_at: new Date().toISOString(),
                },
              ],
              error: null,
            }),
          }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    }),
  },
}));

jest.mock('@/core/stores/authStore', () => ({
  useAuthStore: jest.fn((selector: any) => selector({ user: { id: 'u1' } })),
}));

describe('NotificationsModal', () => {
  it('renders without crashing when visible', () => {
    expect(() => render(<NotificationsModal visible={true} onClose={() => {}} />)).not.toThrow();
  });

  it('renders without crashing when hidden', () => {
    expect(() => render(<NotificationsModal visible={false} onClose={() => {}} />)).not.toThrow();
  });
});
