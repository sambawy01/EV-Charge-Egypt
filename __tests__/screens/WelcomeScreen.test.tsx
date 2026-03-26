import React from 'react';
import { render } from '@testing-library/react-native';
import { WelcomeScreen } from '@screens/auth/WelcomeScreen';

const mockNavigation = { navigate: jest.fn() };

describe('WelcomeScreen', () => {
  it('renders app name', () => {
    const { getByText } = render(<WelcomeScreen navigation={mockNavigation} />);
    expect(getByText('EV Charge Egypt')).toBeTruthy();
  });

  it('has Get Started button', () => {
    const { getByText } = render(<WelcomeScreen navigation={mockNavigation} />);
    expect(getByText('Get Started')).toBeTruthy();
  });
});
