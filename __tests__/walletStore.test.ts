import { useWalletStore } from '@/core/stores/walletStore';

describe('walletStore', () => {
  beforeEach(() => useWalletStore.getState().reset());

  it('sets balance', () => {
    useWalletStore.getState().setBalance(500);
    expect(useWalletStore.getState().balance).toBe(500);
  });

  it('sets wallet id', () => {
    useWalletStore.getState().setWalletId('w1');
    expect(useWalletStore.getState().walletId).toBe('w1');
  });

  it('resets to initial state', () => {
    useWalletStore.getState().setBalance(999);
    useWalletStore.getState().setWalletId('w1');
    useWalletStore.getState().reset();
    expect(useWalletStore.getState().balance).toBe(0);
    expect(useWalletStore.getState().walletId).toBeNull();
  });
});
