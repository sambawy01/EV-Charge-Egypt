export type UserRole = 'driver' | 'fleet_manager' | 'admin';

export interface UserProfile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  preferred_lang: 'ar' | 'en';
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: UserProfile | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Outcome of a signUp() call.
 * - `active`: Supabase returned a session (email confirmation is OFF) — the
 *   user is authenticated right now.
 * - `confirm_email`: no session yet (email confirmation is ON) — the user must
 *   click the link in their inbox before they can sign in. We must NOT fake a
 *   logged-in state here: it has no DB access and dies on reload.
 */
export type SignUpResult =
  | { status: 'active'; profile: UserProfile }
  | { status: 'confirm_email'; email: string };
