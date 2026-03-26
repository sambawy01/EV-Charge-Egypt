import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { fleetService } from '../services/fleetService';
import { useAuthStore } from '../stores/authStore';
import { useFleetStore } from '../stores/fleetStore';

export function useFleet() {
  const userId = useAuthStore((s) => s.user?.id);
  const setFleet = useFleetStore((s) => s.setFleet);

  const query = useQuery({
    queryKey: ['fleet', userId],
    queryFn: () => fleetService.getFleetByOwner(userId!),
    enabled: !!userId,
  });

  useEffect(() => {
    if (query.data) setFleet(query.data);
  }, [query.data, setFleet]);

  return query;
}

export function useFleetDashboard() {
  const fleetId = useFleetStore((s) => s.fleet?.id);
  return useQuery({
    queryKey: ['fleetDashboard', fleetId],
    queryFn: () => fleetService.getFleetDashboardStats(fleetId!),
    enabled: !!fleetId,
    refetchInterval: 30000,
  });
}
