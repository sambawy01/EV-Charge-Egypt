import { useQuery } from '@tanstack/react-query';
import { stationService, StationFilter } from '../services/stationService';

export function useStations(filter?: StationFilter) {
  return useQuery({
    queryKey: ['stations', filter],
    queryFn: () => stationService.getStations(filter),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSearchStations(query: string) {
  return useQuery({
    queryKey: ['stations', 'search', query],
    queryFn: () => stationService.searchStations(query),
    enabled: query.length >= 2,
    staleTime: 1000 * 30,
  });
}
