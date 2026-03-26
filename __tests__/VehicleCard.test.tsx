import React from 'react';
import { render } from '@testing-library/react-native';
import { VehicleCard } from '@/driver/components/VehicleCard';
import type { Vehicle } from '@/core/types/fleet';

const mockVehicle: Vehicle = {
  id: 'v1',
  user_id: 'u1',
  fleet_id: null,
  make: 'BYD',
  model: 'Atto 3',
  year: 2024,
  battery_capacity_kwh: 60.48,
  connector_types: ['CCS', 'Type2'],
  license_plate: 'ABC-1234',
  created_at: new Date().toISOString(),
};

describe('VehicleCard', () => {
  it('renders make and model', () => {
    const { getByText } = render(<VehicleCard vehicle={mockVehicle} />);
    expect(getByText('BYD Atto 3')).toBeTruthy();
  });

  it('renders battery capacity', () => {
    const { getByText } = render(<VehicleCard vehicle={mockVehicle} />);
    expect(getByText(/60\.48 kWh/)).toBeTruthy();
  });

  it('renders license plate when provided', () => {
    const { getByText } = render(<VehicleCard vehicle={mockVehicle} />);
    expect(getByText('ABC-1234')).toBeTruthy();
  });

  it('renders year badge', () => {
    const { getByText } = render(<VehicleCard vehicle={mockVehicle} />);
    expect(getByText('2024')).toBeTruthy();
  });

  it('renders Remove button when onDelete provided', () => {
    const { getByText } = render(
      <VehicleCard vehicle={mockVehicle} onDelete={jest.fn()} />,
    );
    expect(getByText('Remove')).toBeTruthy();
  });

  it('does not render Remove button without onDelete', () => {
    const { queryByText } = render(<VehicleCard vehicle={mockVehicle} />);
    expect(queryByText('Remove')).toBeNull();
  });
});
