import { useQuery } from '@tanstack/react-query';
import { bookingService } from '../services/bookingService';
import { useAuthStore } from '../stores/authStore';

export function useBookings(status?: string) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['bookings', userId, status],
    queryFn: () => bookingService.getUserBookings(userId!, status),
    enabled: !!userId,
  });
}

export function useBookingDetail(bookingId: string | null) {
  return useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingService.getBookingById(bookingId!),
    enabled: !!bookingId,
  });
}
