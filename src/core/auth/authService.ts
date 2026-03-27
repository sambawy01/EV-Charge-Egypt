import { supabase } from '../config/supabase';
import { createClient } from '@supabase/supabase-js';
import type { UserProfile, UserRole } from '../types/auth';

// Admin client for operations that need to bypass RLS (profile creation on signup)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SERVICE_KEY = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_KEY || '';
const adminSupabase = createClient(SUPABASE_URL, SERVICE_KEY);

export const authService = {
  async signUp(email: string, password: string, fullName: string, role: UserRole): Promise<UserProfile> {
    // Use admin client to create user with auto-confirm
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });
    if (authError) throw authError;
    if (!authData.user) throw new Error('Sign up failed');

    // Create profile using admin client (bypasses RLS)
    const { data: profile, error: profileError } = await adminSupabase
      .from('user_profiles')
      .insert({ id: authData.user.id, role, full_name: fullName })
      .select()
      .single();
    if (profileError) throw profileError;

    // Auto sign-in after registration
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) throw signInError;

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
