import { useQuery } from '@tanstack/react-query';
import { stationService } from '../services/stationService';

export function useStationDetail(stationId: string | null) {
  return useQuery({
    queryKey: ['station', stationId],
    queryFn: () => stationService.getStationById(stationId!),
    enabled: !!stationId,
  });
}
