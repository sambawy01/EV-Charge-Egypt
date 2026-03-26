import { walletService } from '@/core/services/walletService';

jest.mock('@/core/config/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest
            .fn()
            .mockResolvedValue({
              data: { id: 'w1', balance: 500, currency: 'EGP' },
              error: null,
            }),
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest
            .fn()
            .mockResolvedValue({
              data: { id: 'w1', balance: 500 },
              error: null,
            }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
    rpc: jest.fn().mockResolvedValue({ data: { balance: 600 }, error: null }),
  },
}));

describe('walletService', () => {
  it('gets wallet balance', async () => {
    const wallet = await walletService.getWallet('u1');
    expect(wallet).toHaveProperty('balance');
    expect(wallet?.balance).toBe(500);
  });

  it('checks sufficient balance — true when enough', () => {
    expect(walletService.hasSufficientBalance(500, 100)).toBe(true);
  });

  it('checks sufficient balance — false when not enough', () => {
    expect(walletService.hasSufficientBalance(50, 100)).toBe(false);
  });

  it('returns empty array when no transactions', async () => {
    const txs = await walletService.getTransactions('w1');
    expect(Array.isArray(txs)).toBe(true);
  });
});
