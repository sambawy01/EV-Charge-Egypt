import { create } from 'zustand';
import type { UserProfile } from '../types/auth';

interface AuthStore {
  user: UserProfile | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /**
   * True between PASSWORD_RECOVERY auth event and a successful updateUser().
   * RootNavigator uses this to force the user onto ResetPasswordScreen even
   * though they technically have a valid (recovery) session.
   */
  inPasswordRecovery: boolean;
  setUser: (user: UserProfile) => void;
  setSession: (session: any) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setPasswordRecovery: (flag: boolean) => void;
  reset: () => void;
}

const initialState = {
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  inPasswordRecovery: false,
};

export const useAuthStore = create<AuthStore>((set) => ({
  ...initialState,
  setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),
  setSession: (session) => set({ session }),
  clearUser: () =>
    set({ user: null, session: null, isAuthenticated: false, inPasswordRecovery: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setPasswordRecovery: (flag) => set({ inPasswordRecovery: flag }),
  reset: () => set(initialState),
}));
