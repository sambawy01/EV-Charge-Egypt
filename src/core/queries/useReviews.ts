import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '../services/reviewService';
import { useAuthStore } from '../stores/authStore';

export function useStationReviews(stationId: string | null) {
  return useQuery({
    queryKey: ['reviews', stationId],
    queryFn: () => reviewService.getStationReviews(stationId!),
    enabled: !!stationId,
  });
}

export function useCreateReview() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { stationId: string; rating: number; comment?: string }) =>
      reviewService.createReview(userId!, input.stationId, input.rating, input.comment),
    onSuccess: (_, vars) =>
      queryClient.invalidateQueries({ queryKey: ['reviews', vars.stationId] }),
  });
}
