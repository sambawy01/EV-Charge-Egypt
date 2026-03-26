import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/core/components/Button';

describe('Button', () => {
  it('renders title', () => {
    const { getByText } = render(<Button title="Charge Now" onPress={() => {}} />);
    expect(getByText('Charge Now')).toBeTruthy();
  });

  it('calls onPress', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Tap" onPress={onPress} />);
    fireEvent.press(getByText('Tap'));
    expect(onPress).toHaveBeenCalled();
  });

  it('disables when loading', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Wait" onPress={onPress} loading />);
    fireEvent.press(getByText('Wait'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
