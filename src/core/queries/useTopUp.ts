import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '../services/paymentService';
import { useWalletStore } from '../stores/walletStore';
import { useAuthStore } from '../stores/authStore';
import type { PaymentMethod } from '../types/wallet';

export function useTopUp() {
  const walletId = useWalletStore((s) => s.walletId);
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const setBalance = useWalletStore((s) => s.setBalance);

  return useMutation({
    mutationFn: (input: { amount: number; method: PaymentMethod }) =>
      paymentService.topUp({
        walletId: walletId!,
        amount: input.amount,
        method: input.method,
      }),
    onSuccess: (result) => {
      setBalance(result.newBalance);
      queryClient.invalidateQueries({ queryKey: ['wallet', userId] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
