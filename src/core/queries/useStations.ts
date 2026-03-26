import { useQuery } from '@tanstack/react-query';
import { stationService, StationFilter, StationQueryOptions } from '../services/stationService';

export function useStations(
  filter?: StationFilter,
  location?: { latitude: number; longitude: number } | null,
  radiusKm?: number
) {
  const options: StationQueryOptions = {
    filter,
    latitude: location?.latitude,
    longitude: location?.longitude,
    radiusKm,
  };

  return useQuery({
    queryKey: ['stations', filter, location?.latitude, location?.longitude, radiusKm],
    queryFn: () => stationService.getStations(options),
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
