import { create } from 'zustand';
import type { UserProfile } from '../types/auth';

interface AuthStore {
  user: UserProfile | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: UserProfile) => void;
  setSession: (session: any) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
};

export const useAuthStore = create<AuthStore>((set) => ({
  ...initialState,
  setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),
  setSession: (session) => set({ session }),
  clearUser: () => set({ user: null, session: null, isAuthenticated: false }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set(initialState),
}));
