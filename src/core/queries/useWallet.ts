import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { walletService } from '../services/walletService';
import { useAuthStore } from '../stores/authStore';
import { useWalletStore } from '../stores/walletStore';

export function useWallet() {
  const userId = useAuthStore((s) => s.user?.id);
  const { setWalletId, setBalance } = useWalletStore();

  const query = useQuery({
    queryKey: ['wallet', userId],
    queryFn: () => walletService.getOrCreateWallet(userId!),
    enabled: !!userId,
  });

  useEffect(() => {
    if (query.data) {
      setWalletId(query.data.id);
      setBalance(query.data.balance);
    }
  }, [query.data]);

  return query;
}
