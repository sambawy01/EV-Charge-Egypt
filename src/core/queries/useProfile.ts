import { useQuery } from '@tanstack/react-query';
import { profileService } from '../services/profileService';
import { useAuthStore } from '../stores/authStore';

export function useChargingStats() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['chargingStats', userId],
    queryFn: () => profileService.getChargingStats(userId!),
    enabled: !!userId,
  });
}
