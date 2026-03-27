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
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        let profile = await authService.getProfile(session.user.id);
        if (!profile) {
          // Profile doesn't exist yet (new signup) — create one from user metadata
          const meta = session.user.user_metadata || {};
          profile = {
            id: session.user.id,
            role: meta.role || 'driver',
            full_name: meta.full_name || session.user.email?.split('@')[0] || 'User',
            phone: null,
            avatar_url: null,
            preferred_lang: 'en',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any;
          // Try to persist it (may fail due to RLS, that's ok)
          try {
            const { data } = await (await import('../config/supabase')).supabase
              .from('user_profiles')
              .upsert({ id: profile!.id, role: profile!.role, full_name: profile!.full_name }, { onConflict: 'id' })
              .select()
              .single();
            if (data) profile = data;
          } catch {}
        }
        setUser(profile!);
        setSession(session);
      } else if (event === 'SIGNED_OUT') {
        clearUser();
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
