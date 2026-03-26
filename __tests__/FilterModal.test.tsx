import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FilterModal } from '@/driver/components/FilterModal';

describe('FilterModal', () => {
  it('renders connector type options', () => {
    const { getByText } = render(
      <FilterModal visible={true} onClose={() => {}} onApply={() => {}} />
    );
    expect(getByText('CCS')).toBeTruthy();
    expect(getByText('CHAdeMO')).toBeTruthy();
    expect(getByText('Type2')).toBeTruthy();
  });
  it('calls onClose when close button pressed', () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <FilterModal visible={true} onClose={onClose} onApply={() => {}} />
    );
    fireEvent.press(getByText('✕'));
    expect(onClose).toHaveBeenCalled();
  });
});
