import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleService } from '../services/vehicleService';
import { useAuthStore } from '../stores/authStore';

export function useVehicles() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['vehicles', userId],
    queryFn: () => vehicleService.getUserVehicles(userId!),
    enabled: !!userId,
  });
}

export function useAddVehicle() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      make: string;
      model: string;
      batteryCapacityKwh: number;
      connectorTypes: string[];
      year?: number;
      licensePlate?: string;
    }) => vehicleService.addVehicle({ ...input, userId: userId! }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicles', userId] }),
  });
}

export function useDeleteVehicle() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vehicleId: string) => vehicleService.deleteVehicle(vehicleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicles', userId] }),
  });
}
