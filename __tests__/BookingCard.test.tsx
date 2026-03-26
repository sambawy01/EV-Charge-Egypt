import React from 'react';
import { render } from '@testing-library/react-native';
import { BookingCard } from '@/driver/components/BookingCard';

const mockBooking = {
  id: 'b1',
  status: 'confirmed' as const,
  scheduled_start: '2026-03-26T10:00:00Z',
  scheduled_end: '2026-03-26T11:00:00Z',
  station: {
    name: 'IKARUS Maadi',
    provider: { name: 'IKARUS' },
  },
  connector: { type: 'CCS', power_kw: 60 },
} as any;

describe('BookingCard', () => {
  it('renders station name', () => {
    const { getByText } = render(
      <BookingCard booking={mockBooking} onPress={() => {}} />,
    );
    expect(getByText('IKARUS Maadi')).toBeTruthy();
  });

  it('shows status', () => {
    const { getByText } = render(
      <BookingCard booking={mockBooking} onPress={() => {}} />,
    );
    expect(getByText('Confirmed')).toBeTruthy();
  });
});
