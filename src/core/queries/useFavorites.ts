import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { favoriteService } from '../services/favoriteService';
import { useAuthStore } from '../stores/authStore';

export function useFavorites() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['favorites', userId],
    queryFn: () => favoriteService.getFavorites(userId!),
    enabled: !!userId,
  });
}

export function useToggleFavorite() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      stationId,
      isFavorite,
    }: {
      stationId: string;
      isFavorite: boolean;
    }) => favoriteService.toggleFavorite(userId!, stationId, isFavorite),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] }),
  });
}
