import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { chargingService } from '../services/chargingService';
import { useAuthStore } from '../stores/authStore';
import type { ChargingSession } from '../types/booking';
import { CHARGING_POLL_MS } from '../config/constants';

export function useActiveSession() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['activeSession', userId],
    queryFn: () => chargingService.getActiveSession(userId!),
    enabled: !!userId,
    refetchInterval: CHARGING_POLL_MS,
  });
}

export function useRealtimeSession(sessionId: string | null) {
  const [session, setSession] = useState<ChargingSession | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    const unsubscribe = chargingService.subscribeToSession(
      sessionId,
      setSession,
    );
    return unsubscribe;
  }, [sessionId]);

  return session;
}
