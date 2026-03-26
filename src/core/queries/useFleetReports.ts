import { useQuery } from '@tanstack/react-query';
import { aiService } from '../services/aiService';
import { useAuthStore } from '../stores/authStore';

export function useFleetCostReport(period: string) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['fleetCostReport', userId, period],
    queryFn: () => aiService.optimizeCosts(userId!, period),
    enabled: !!userId,
    staleTime: 1000 * 60 * 60,
  });
}
