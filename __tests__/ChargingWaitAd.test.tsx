import React from 'react';
import { render } from '@testing-library/react-native';
import { ChargingWaitAd } from '@/driver/components/ChargingWaitAd';

jest.mock('@/core/services/adService', () => ({
  adService: {
    trackImpression: jest.fn().mockResolvedValue(undefined),
    trackClick: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock Card component
jest.mock('@/core/components', () => ({
  Card: ({ children, style }: any) => {
    const { View } = require('react-native');
    return <View style={style}>{children}</View>;
  },
}));

const mockAd = {
  id: 'ad1',
  advertiser_name: 'Starbucks Egypt',
  title: 'Starbucks 50m away',
  description: '10% off your next order',
  image_url: null,
  action_url: 'https://starbucks.eg',
  placement: 'charging_wait' as const,
  target_area: null,
};

describe('ChargingWaitAd', () => {
  it('renders ad title', () => {
    const { getByText } = render(<ChargingWaitAd ad={mockAd} />);
    expect(getByText('Starbucks 50m away')).toBeTruthy();
  });

  it('renders ad description', () => {
    const { getByText } = render(<ChargingWaitAd ad={mockAd} />);
    expect(getByText('10% off your next order')).toBeTruthy();
  });

  it('renders advertiser name', () => {
    const { getByText } = render(<ChargingWaitAd ad={mockAd} />);
    expect(getByText('Starbucks Egypt')).toBeTruthy();
  });

  it('renders sponsored label', () => {
    const { getByText } = render(<ChargingWaitAd ad={mockAd} />);
    expect(getByText('Sponsored')).toBeTruthy();
  });
});
