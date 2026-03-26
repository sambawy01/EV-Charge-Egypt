import { useQuery } from '@tanstack/react-query';
import { stationService } from '../services/stationService';
import { AVAILABILITY_POLL_MS } from '../config/constants';

export function useConnectors(stationId: string | null) {
  return useQuery({
    queryKey: ['connectors', stationId],
    queryFn: () => stationService.getConnectors(stationId!),
    enabled: !!stationId,
    refetchInterval: AVAILABILITY_POLL_MS,
  });
}
