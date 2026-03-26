import { useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authService } from './authService';
import type { UserRole } from '../types/auth';

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, setSession, clearUser, setLoading } = useAuthStore();

  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
  ) => {
    setLoading(true);
    try {
      const profile = await authService.signUp(email, password, fullName, role);
      setUser(profile);
      return profile;
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading]);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { profile, session } = await authService.signIn(email, password);
      setUser(profile);
      setSession(session);
      return profile;
    } finally {
      setLoading(false);
    }
  }, [setUser, setSession, setLoading]);

  const signOut = useCallback(async () => {
    await authService.signOut();
    clearUser();
  }, [clearUser]);

  return { user, isAuthenticated, isLoading, signUp, signIn, signOut };
}
