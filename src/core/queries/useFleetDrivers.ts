import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fleetService } from '../services/fleetService';
import { useFleetStore } from '../stores/fleetStore';

export function useFleetMembers() {
  const fleetId = useFleetStore((s) => s.fleet?.id);
  return useQuery({
    queryKey: ['fleetMembers', fleetId],
    queryFn: () => fleetService.getFleetMembers(fleetId!),
    enabled: !!fleetId,
  });
}

export function useAssignDriver() {
  const queryClient = useQueryClient();
  const fleetId = useFleetStore((s) => s.fleet?.id);
  return useMutation({
    mutationFn: ({ memberId, vehicleId }: { memberId: string; vehicleId: string }) =>
      fleetService.assignVehicle(memberId, vehicleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fleetMembers', fleetId] }),
  });
}
