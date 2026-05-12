/**
 * Shared auth + CORS helpers for WattsOn Supabase Edge Functions.
 *
 * - `getAuthedUser` verifies the `Authorization: Bearer <jwt>` header against
 *   Supabase Auth via `supabase.auth.getUser()`. This is the ONLY trusted
 *   source of `userId` — never trust the body.
 * - `corsHeaders` is locked to a small allowlist; unknown origins receive
 *   no `Access-Control-Allow-Origin`, which the browser then blocks.
 * - `jsonError` returns a structured error response without leaking
 *   internal error text. Real errors should be logged via `console.error`.
 */

import {
  createClient,
  SupabaseClient,
  User,
} from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const ALLOWED_ORIGINS = [
  'https://wattson-ev.vercel.app',
  'http://localhost:8081',
  'http://localhost:19006',
];

const ALLOWED_METHODS = 'GET, POST, OPTIONS';
const ALLOWED_HEADERS =
  'authorization, x-client-info, apikey, content-type, x-cron-secret, x-request-id';

export function corsHeaders(origin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': ALLOWED_METHODS,
    'Access-Control-Allow-Headers': ALLOWED_HEADERS,
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

export function jsonError(
  message: string,
  status: number,
  origin: string | null,
  requestId?: string,
): Response {
  const body = {
    error: {
      code: status,
      message,
      requestId: requestId ?? null,
    },
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      'Content-Type': 'application/json',
    },
  });
}

export type AuthSuccess = { user: User; userClient: SupabaseClient };
export type AuthFailure = { error: Response };

/**
 * Verify the caller's JWT and return a Supabase client scoped to that user
 * (so RLS applies). Returns `{ error: Response }` on any auth failure.
 */
export async function getAuthedUser(
  req: Request,
  supabaseUrl: string,
  anonKey: string,
): Promise<AuthSuccess | AuthFailure> {
  const origin = req.headers.get('origin');
  const authHeader =
    req.headers.get('Authorization') ?? req.headers.get('authorization');

  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return {
      error: jsonError('Missing or malformed Authorization header', 401, origin),
    };
  }

  // Build a client that forwards the user's JWT — RLS will apply on queries.
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  // The real verification step. supabase-js calls /auth/v1/user with the JWT
  // and the server validates the signature + expiry.
  const { data, error } = await userClient.auth.getUser();
  if (error || !data?.user) {
    if (error) {
      console.error('[auth] getUser failed:', error.message);
    }
    return {
      error: jsonError('Invalid or expired token', 401, origin),
    };
  }

  return { user: data.user, userClient };
}

/**
 * Strip ASCII / Unicode control characters (except common whitespace) from
 * user-supplied text before it enters prompts or DB rows.
 *
 * Preserves: \t (\x09), \n (\x0A), \r (\x0D).
 * Strips: C0 (\x00-\x08, \x0B, \x0C, \x0E-\x1F), DEL (\x7F), C1 (\x80-\x9F).
 */
export function stripControlChars(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(
    /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\x80-\x9F]/g,
    '',
  );
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v);
}

export function newRequestId(): string {
  return crypto.randomUUID();
}
