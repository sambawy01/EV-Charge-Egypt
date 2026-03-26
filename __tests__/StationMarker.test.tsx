import React from 'react';
import { render } from '@testing-library/react-native';
import { StationMarker } from '@/driver/components/StationMarker';

describe('StationMarker', () => {
  it('renders with available color', () => {
    const { getByTestId } = render(
      <StationMarker status="available" providerSlug="ikarus" testID="marker" />
    );
    expect(getByTestId('marker')).toBeTruthy();
  });
  it('renders with occupied color', () => {
    const { getByTestId } = render(
      <StationMarker status="occupied" providerSlug="sha7en" testID="marker2" />
    );
    expect(getByTestId('marker2')).toBeTruthy();
  });
});
