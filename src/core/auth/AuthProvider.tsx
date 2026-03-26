import React, { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authService } from './authService';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, clearUser, setLoading } = useAuthStore();

  useEffect(() => {
    // Initialize auth state from existing session
    authService.getSession().then(async (session) => {
      if (session?.user) {
        const profile = await authService.getProfile(session.user.id);
        if (profile) {
          setUser(profile);
          setSession(session);
        } else {
          clearUser();
        }
      } else {
        clearUser();
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await authService.getProfile(session.user.id);
        if (profile) {
          setUser(profile);
          setSession(session);
        }
      } else if (event === 'SIGNED_OUT') {
        clearUser();
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
