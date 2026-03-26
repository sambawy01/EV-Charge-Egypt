import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../services/bookingService';
import { useAuthStore } from '../stores/authStore';

export function useCreateBooking() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      connectorId: string;
      stationId: string;
      vehicleId?: string;
      scheduledStart: string;
      scheduledEnd: string;
    }) => bookingService.createBooking({ ...input, userId: userId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => bookingService.cancelBooking(bookingId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  });
}
