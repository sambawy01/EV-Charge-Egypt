import React from 'react';
import { render } from '@testing-library/react-native';
import { LoginScreen } from '@screens/auth/LoginScreen';

jest.mock('@/core/auth/useAuth', () => ({
  useAuth: () => ({ signIn: jest.fn(), isLoading: false }),
}));

describe('LoginScreen', () => {
  it('renders email input', () => {
    const { getByPlaceholderText } = render(<LoginScreen navigation={{ goBack: jest.fn() }} />);
    expect(getByPlaceholderText('your@email.com')).toBeTruthy();
  });
});
