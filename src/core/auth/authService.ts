import { supabase } from '../config/supabase';
import type { UserProfile, UserRole } from '../types/auth';

export const authService = {
  async signUp(email: string, password: string, fullName: string, role: UserRole): Promise<UserProfile> {
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) throw authError;
    if (!authData.user) throw new Error('Sign up failed');

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({ id: authData.user.id, role, full_name: fullName })
      .select()
      .single();
    if (profileError) throw profileError;
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
