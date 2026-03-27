import { supabase } from '../config/supabase';
import type { UserProfile, UserRole } from '../types/auth';

export const authService = {
  async signUp(email: string, password: string, fullName: string, role: UserRole): Promise<UserProfile> {
    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    if (authError) throw authError;
    if (!authData.user) throw new Error('Sign up failed — please try again');

    const userId = authData.user.id;

    // Build a local profile from the signup inputs so we always have something
    // to return — even if DB insert or auto sign-in fails (e.g. email confirm ON).
    const localProfile: UserProfile = {
      id: userId,
      role,
      full_name: fullName,
      phone: null,
      avatar_url: null,
      preferred_lang: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as UserProfile;

    // Best-effort: persist profile in DB (may fail due to RLS without session)
    try {
      await supabase
        .from('user_profiles')
        .upsert({ id: userId, role, full_name: fullName }, { onConflict: 'id' });
    } catch {
      // Swallow — profile will be created on first real session
    }

    // Best-effort: auto sign-in (works only when email confirmation is OFF)
    try {
      await supabase.auth.signInWithPassword({ email, password });
    } catch {
      // Expected to fail when email confirmation is required
    }

    // Always return the profile — useAuth.signUp calls setUser() with this,
    // which sets isAuthenticated = true regardless of session state.
    return localProfile;
  },

  async signIn(email: string, password: string): Promise<{ profile: UserProfile; session: any }> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    if (profileError) throw profileError;
    return { profile, session: data.session };
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) return null;
    return data;
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
