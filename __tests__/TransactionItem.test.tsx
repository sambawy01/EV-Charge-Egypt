import React from 'react';
import { render } from '@testing-library/react-native';
import { TransactionItem } from '@/driver/components/TransactionItem';

const mockTx = {
  id: 't1',
  type: 'topup' as const,
  amount: 200,
  method: 'fawry' as const,
  status: 'completed' as const,
  wallet_id: 'w1',
  reference_id: null,
  created_at: '2026-03-26T10:00:00Z',
};

describe('TransactionItem', () => {
  it('renders credit amount with plus sign', () => {
    const { getByText } = render(<TransactionItem transaction={mockTx} />);
    expect(getByText('+200.00 EGP')).toBeTruthy();
  });

  it('renders type label', () => {
    const { getByText } = render(<TransactionItem transaction={mockTx} />);
    expect(getByText('Top Up')).toBeTruthy();
  });
});
