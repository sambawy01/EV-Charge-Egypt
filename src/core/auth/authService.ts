import { supabase } from '../config/supabase';
import type { UserProfile, UserRole, SignUpResult } from '../types/auth';

export const authService = {
  async signUp(
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
  ): Promise<SignUpResult> {
    // Sign up with Supabase Auth. The on_auth_user_created DB trigger creates
    // the matching public.user_profiles row server-side, so we don't upsert it
    // here. If signUp fails (e.g. a 500 "Error sending confirmation email" when
    // confirmation is enabled but no SMTP is configured) the error is thrown so
    // the caller can show it — we never swallow it.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    if (error) throw error;

    // Supabase returns an obfuscated user with an empty `identities` array when
    // the email is already registered (anti-enumeration). A genuine new signup
    // always comes back with at least one identity.
    const identities = data.user?.identities ?? [];
    if (identities.length === 0) {
      throw new Error(
        'This email is already registered. Please sign in instead, or use a different email.',
      );
    }

    const profile: UserProfile = {
      id: data.user!.id,
      role,
      full_name: fullName,
      phone: null,
      avatar_url: null,
      preferred_lang: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // A session means email confirmation is OFF — the user is authenticated
    // right now. onAuthStateChange (SIGNED_IN) also fires and syncs the store.
    if (data.session) {
      return { status: 'active', profile };
    }

    // No session means email confirmation is ON. Do NOT fake a logged-in state
    // (it has no DB access and dies on reload) — tell the caller to show a
    // "check your email" message instead.
    return { status: 'confirm_email', email };
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
