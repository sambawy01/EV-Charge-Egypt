import { useQuery } from '@tanstack/react-query';
import { adService, AdPlacement } from '../services/adService';

export function useAds(placement: AdPlacement, area?: string) {
  return useQuery({
    queryKey: ['ads', placement, area],
    queryFn: () => adService.getAds(placement, area),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
