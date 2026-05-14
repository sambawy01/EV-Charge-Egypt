import { useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authService } from './authService';
import type { UserRole } from '../types/auth';

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, setSession, clearUser } = useAuthStore();

  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
  ) => {
    // Deliberately does NOT touch the global `isLoading` flag. That flag gates
    // the whole RootNavigator — flipping it here renders LoadingScreen, which
    // unmounts AuthNavigator (and RegisterScreen with it), destroying the
    // screen's error-banner state before it can render. In-flight submit state
    // is owned locally by RegisterScreen instead.
    const result = await authService.signUp(email, password, fullName, role);
    // Only authenticate when Supabase actually returned a session. When the
    // result is `confirm_email` the user has no session yet — RegisterScreen
    // shows a "check your email" message instead of entering the app.
    if (result.status === 'active') {
      setUser(result.profile);
    }
    return result;
  }, [setUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    // Like signUp: deliberately does NOT touch the global `isLoading` flag. It
    // gates the whole RootNavigator — flipping it here unmounts LoginScreen
    // mid-request and destroys its error-banner state. LoginScreen owns its
    // own local submit state instead.
    const { profile, session } = await authService.signIn(email, password);
    setUser(profile);
    setSession(session);
    return profile;
  }, [setUser, setSession]);

  const signOut = useCallback(async () => {
    await authService.signOut();
    clearUser();
  }, [clearUser]);

  return { user, isAuthenticated, isLoading, signUp, signIn, signOut };
}
