import React from 'react';
import { render } from '@testing-library/react-native';
import { StationListItem } from '@/driver/components/StationListItem';

const mockStation = {
  id: '1',
  name: 'IKARUS Maadi',
  address: 'Road 9, Maadi',
  provider: { name: 'IKARUS', slug: 'ikarus', id: 'p1', logo_url: null, is_active: true },
  connectors: [{ id: 'c1', type: 'CCS', power_kw: 60, price_per_kwh: 0.05, status: 'available', station_id: '1', external_connector_id: null, currency: 'EGP', last_status_check: null }],
  rating_avg: 4.5,
  distance_km: 2.3,
  status: 'available',
  provider_id: 'p1',
  external_station_id: 'ext1',
  latitude: 30.0,
  longitude: 31.0,
  city: 'Cairo',
  area: 'Maadi',
  amenities: [],
  photos: [],
  review_count: 10,
  is_active: true,
  last_synced_at: null,
} as any;

describe('StationListItem', () => {
  it('renders station name', () => {
    const { getByText } = render(<StationListItem station={mockStation} onPress={() => {}} />);
    expect(getByText('IKARUS Maadi')).toBeTruthy();
  });
  it('shows distance', () => {
    const { getByText } = render(<StationListItem station={mockStation} onPress={() => {}} />);
    expect(getByText('2.3 km')).toBeTruthy();
  });
});
