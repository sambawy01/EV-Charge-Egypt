import { useQuery } from '@tanstack/react-query';
import { aiService } from '../services/aiService';

export function useAvailabilityPrediction(stationId: string | null) {
  return useQuery({
    queryKey: ['prediction', stationId],
    queryFn: () => aiService.predictAvailability(stationId!),
    enabled: !!stationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
