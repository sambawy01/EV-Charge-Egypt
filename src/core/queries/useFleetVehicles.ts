import { useQuery } from '@tanstack/react-query';
import { fleetService } from '../services/fleetService';
import { useFleetStore } from '../stores/fleetStore';

export function useFleetVehicles() {
  const fleetId = useFleetStore((s) => s.fleet?.id);
  return useQuery({
    queryKey: ['fleetVehicles', fleetId],
    queryFn: () => fleetService.getFleetVehicles(fleetId!),
    enabled: !!fleetId,
  });
}
