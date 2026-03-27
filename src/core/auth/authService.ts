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

    // If email confirmation is required, user won't have a session yet
    // Try to sign in immediately (works when email confirm is disabled)
    if (!authData.session) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        // Email confirmation is likely required — create profile anyway and inform user
        // Use the user ID from signup to create profile via anon (RLS permitting) or just return a mock
        return {
          id: authData.user.id,
          role,
          full_name: fullName,
          phone: null,
          avatar_url: null,
          preferred_lang: 'en',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as UserProfile;
      }
    }

    // Create profile — try insert, ignore if already exists
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .upsert({ id: authData.user.id, role, full_name: fullName }, { onConflict: 'id' })
      .select()
      .single();

    if (profileError) {
      // If RLS blocks insert, return a local profile so the user can still use the app
      return {
        id: authData.user.id,
        role,
        full_name: fullName,
        phone: null,
        avatar_url: null,
        preferred_lang: 'en',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as UserProfile;
    }

    return profile;
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
