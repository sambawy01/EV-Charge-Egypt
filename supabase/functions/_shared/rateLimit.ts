/**
 * Rate-limit helper.
 *
 * Calls the `check_and_increment_rate_limit(user_id, endpoint, max, window_seconds)`
 * RPC defined in `20260512000001_security_hardening.sql`. The RPC atomically
 * increments the counter and returns true if the call is allowed, false if the
 * window cap is exceeded.
 *
 * MUST be called with the service-role client — the rate_limits table is
 * service-role only (no client RLS policy grants read/write).
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

export async function checkRateLimit(
  serviceClient: SupabaseClient,
  userId: string,
  endpoint: string,
  maxPerWindow: number,
  windowSeconds: number,
): Promise<boolean> {
  const { data, error } = await serviceClient.rpc(
    'check_and_increment_rate_limit',
    {
      p_user_id: userId,
      p_endpoint: endpoint,
      p_max: maxPerWindow,
      p_window_seconds: windowSeconds,
    },
  );

  if (error) {
    // Fail closed: if the rate-limit infra is unhealthy, reject the request
    // rather than silently allowing unlimited traffic.
    console.error(
      `[rate-limit] RPC failed for ${endpoint} user=${userId}:`,
      error.message,
    );
    return false;
  }

  return data === true;
}
