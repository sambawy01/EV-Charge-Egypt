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

    // Supabase returns a fake user with empty identities when email already exists
    // (to prevent email enumeration). Detect this and try sign-in instead.
    const isRealUser = authData.user?.identities && authData.user.identities.length > 0;

    if (!isRealUser) {
      // Email already registered — try signing in with the password they provided
      try {
        const signInResult = await supabase.auth.signInWithPassword({ email, password });
        if (signInResult.error) {
          throw new Error('This email is already registered. Please sign in instead, or use a different email.');
        }
        // Sign in succeeded — fetch their existing profile
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', signInResult.data.user.id)
          .single();
        if (existingProfile) return existingProfile;
        // No profile yet — create one
        return {
          id: signInResult.data.user.id,
          role,
          full_name: fullName,
          phone: null,
          avatar_url: null,
          preferred_lang: 'en',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as UserProfile;
      } catch (e: any) {
        throw new Error(e.message || 'This email is already registered. Please sign in instead.');
      }
    }

    const userId = authData.user!.id;

    // Build a local profile so we always have something to return
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

    // Best-effort: persist profile in DB
    try {
      await supabase
        .from('user_profiles')
        .upsert({ id: userId, role, full_name: fullName }, { onConflict: 'id' });
    } catch {}

    // Best-effort: auto sign-in (works when email confirmation is OFF)
    try {
      await supabase.auth.signInWithPassword({ email, password });
    } catch {}

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
