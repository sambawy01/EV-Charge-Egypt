import { useQuery } from '@tanstack/react-query';
import { walletService } from '../services/walletService';
import { useWalletStore } from '../stores/walletStore';

export function useTransactions(limit = 50) {
  const walletId = useWalletStore((s) => s.walletId);

  return useQuery({
    queryKey: ['transactions', walletId, limit],
    queryFn: () => walletService.getTransactions(walletId!, limit),
    enabled: !!walletId,
  });
}
