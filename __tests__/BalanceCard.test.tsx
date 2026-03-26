import React from 'react';
import { render } from '@testing-library/react-native';
import { BalanceCard } from '@/driver/components/BalanceCard';

describe('BalanceCard', () => {
  it('renders balance', () => {
    const { getByText } = render(
      <BalanceCard balance={500} currency="EGP" onTopUp={() => {}} />,
    );
    expect(getByText('500.00 EGP')).toBeTruthy();
  });

  it('shows top up button', () => {
    const { getByText } = render(
      <BalanceCard balance={0} currency="EGP" onTopUp={() => {}} />,
    );
    expect(getByText('Top Up')).toBeTruthy();
  });
});
