import { useMutation } from '@tanstack/react-query';
import { aiService } from '../services/aiService';
import { useAIStore } from '../stores/aiStore';
import { useAuthStore } from '../stores/authStore';

export function useRoutePlanner() {
  const userId = useAuthStore((s) => s.user?.id);
  const setLastRoute = useAIStore((s) => s.setLastRoute);

  return useMutation({
    mutationFn: async (input: {
      destination: string;
      currentBatteryPct: number;
      vehicleId: string;
      origin: { lat: number; lng: number };
    }) => {
      const route = await aiService.planRoute({ ...input, userId: userId! });
      setLastRoute(route);
      return route;
    },
  });
}
