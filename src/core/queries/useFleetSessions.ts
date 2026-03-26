import { useQuery } from '@tanstack/react-query';
import { fleetService } from '../services/fleetService';
import { useFleetStore } from '../stores/fleetStore';

export function useFleetSessions() {
  const fleetId = useFleetStore((s) => s.fleet?.id);
  return useQuery({
    queryKey: ['fleetSessions', fleetId],
    queryFn: () => fleetService.getFleetSessions(fleetId!),
    enabled: !!fleetId,
  });
}
