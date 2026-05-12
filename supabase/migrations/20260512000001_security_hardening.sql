-- =============================================================================
-- Security Hardening Migration
-- =============================================================================
-- Date:    2026-05-12
-- Author:  WattsOn Security Audit
-- Purpose: Fix critical security & integrity issues found in the prior audit.
--
-- Scope:
--   1) Remove the auto-confirm-email dev trigger (production must rely on
--      Supabase Auth email confirmation).
--   2) Patch user_profiles UPDATE policy to prevent role escalation.
--   3) Harden handle_new_user() to whitelist allowed signup roles.
--   4) Enable RLS on currently-unprotected tables (providers, ai_interactions,
--      station_analytics, ads) with safe public/private policies.
--   5) Tighten submitted_stations UPDATE policy + add a SECURITY DEFINER
--      verify_submitted_station() function.
--   6) Add a rate_limits table + check_and_increment_rate_limit() helper for
--      AI endpoint throttling (called from Edge Functions).
--   7) Add idempotency_key to transactions + an atomic credit_wallet_atomic()
--      function for safe wallet topups.
--   8) Add submit_station_report() helper that enforces 150m geo-proximity.
--
-- All statements are idempotent. Safe to re-run.
-- (No explicit BEGIN/COMMIT — Supabase wraps each migration in its own
--  transaction. Explicit BEGIN here breaks pgx prepared-statement push.)
-- =============================================================================

-- =============================================================================
-- 1) Drop the auto_confirm_email dev trigger + function
-- =============================================================================
-- The auto_confirm_email trigger lived in 20260325000004_triggers.sql lines
-- 36-50 and silently bypassed email verification for ALL new auth.users rows.
-- That's fine for local dev but is a credential-stuffing / fake-account risk
-- in production. Drop it. Email confirmation MUST be enabled in the Supabase
-- Auth dashboard (Authentication -> Providers -> Email -> "Confirm email").
DROP TRIGGER IF EXISTS on_auth_user_confirm_email ON auth.users;
DROP FUNCTION IF EXISTS auto_confirm_email();

COMMENT ON SCHEMA public IS
  'WattsOn EV public schema. Email confirmation is enforced by Supabase Auth dashboard, not by triggers.';


-- =============================================================================
-- 2) Fix user_profiles UPDATE policy — prevent role escalation
-- =============================================================================
-- Original policy (20260325000002_rls_policies.sql line 19) had no WITH CHECK,
-- which meant an authenticated user could UPDATE their own row and set
-- role='admin'. The new policy uses a WITH CHECK subquery to pin the role to
-- its current value on every UPDATE. Role changes can only happen via
-- service_role (Edge Function or DB admin).
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON user_profiles;

CREATE POLICY "users_update_own_profile" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM user_profiles WHERE id = auth.uid())
  );

COMMENT ON POLICY "users_update_own_profile" ON user_profiles IS
  'Users may update their own profile but cannot change their role (anti-escalation).';

-- Harden handle_new_user() — whitelist 'driver' / 'fleet_manager' only.
-- Anything else from raw_user_meta_data->>'role' (e.g. 'admin') falls back
-- to 'driver'. This closes the signup-as-admin vector.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  requested_role text;
  safe_role text;
BEGIN
  requested_role := NEW.raw_user_meta_data->>'role';

  -- Whitelist: only 'driver' and 'fleet_manager' are allowed at signup.
  -- 'admin' must be granted manually by a DB admin / service_role.
  IF requested_role IN ('driver', 'fleet_manager') THEN
    safe_role := requested_role;
  ELSE
    safe_role := 'driver';
  END IF;

  INSERT INTO public.user_profiles (id, role, full_name, preferred_lang)
  VALUES (
    NEW.id,
    safe_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'ar'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION handle_new_user() IS
  'Auto-creates user_profiles on signup. Hardened 2026-05-12 to whitelist only driver/fleet_manager roles.';


-- =============================================================================
-- 3) Enable RLS on currently-unprotected tables
-- =============================================================================

-- ---- providers ----
-- Provider names/logos display in the station list; anon SELECT is fine.
-- Writes (rotating API keys, adding adapters) must be service_role only.
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view providers" ON providers;
DROP POLICY IF EXISTS "providers_select_public" ON providers;
DROP POLICY IF EXISTS "providers_no_insert" ON providers;
DROP POLICY IF EXISTS "providers_no_update" ON providers;
DROP POLICY IF EXISTS "providers_no_delete" ON providers;

CREATE POLICY "providers_select_public" ON providers
  FOR SELECT
  USING (true);

-- Explicit deny: anon + authenticated cannot mutate. service_role bypasses RLS.
CREATE POLICY "providers_no_insert" ON providers
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "providers_no_update" ON providers
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "providers_no_delete" ON providers
  FOR DELETE
  USING (false);

COMMENT ON TABLE providers IS
  'Charging-network providers. Public-readable; writes are service_role only.';


-- ---- ai_interactions ----
-- Per-user audit log of Claude AI calls. Users see ONLY their own rows; only
-- Edge Functions (service_role) can insert.
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_interactions_select_own" ON ai_interactions;
DROP POLICY IF EXISTS "ai_interactions_no_insert" ON ai_interactions;
DROP POLICY IF EXISTS "ai_interactions_no_update" ON ai_interactions;
DROP POLICY IF EXISTS "ai_interactions_no_delete" ON ai_interactions;

CREATE POLICY "ai_interactions_select_own" ON ai_interactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ai_interactions_no_insert" ON ai_interactions
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "ai_interactions_no_update" ON ai_interactions
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "ai_interactions_no_delete" ON ai_interactions
  FOR DELETE
  USING (false);

COMMENT ON TABLE ai_interactions IS
  'Claude AI call audit log. Users see only their own rows; inserts via service_role only.';


-- ---- station_analytics ----
-- Aggregate occupancy / wait-time stats are public, but only the analytics
-- pipeline (service_role) may write.
ALTER TABLE station_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "station_analytics_select_public" ON station_analytics;
DROP POLICY IF EXISTS "station_analytics_no_insert" ON station_analytics;
DROP POLICY IF EXISTS "station_analytics_no_update" ON station_analytics;
DROP POLICY IF EXISTS "station_analytics_no_delete" ON station_analytics;

CREATE POLICY "station_analytics_select_public" ON station_analytics
  FOR SELECT
  USING (true);

CREATE POLICY "station_analytics_no_insert" ON station_analytics
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "station_analytics_no_update" ON station_analytics
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "station_analytics_no_delete" ON station_analytics
  FOR DELETE
  USING (false);

COMMENT ON TABLE station_analytics IS
  'Aggregate station occupancy stats. Public-readable; writes via service_role pipeline only.';


-- ---- ads ----
-- The original policy used `is_active = true` for public SELECT; preserve that
-- but block all client writes.
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active ads" ON ads;
DROP POLICY IF EXISTS "ads_select_active" ON ads;
DROP POLICY IF EXISTS "ads_no_insert" ON ads;
DROP POLICY IF EXISTS "ads_no_update" ON ads;
DROP POLICY IF EXISTS "ads_no_delete" ON ads;

CREATE POLICY "ads_select_active" ON ads
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "ads_no_insert" ON ads
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "ads_no_update" ON ads
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "ads_no_delete" ON ads
  FOR DELETE
  USING (false);

COMMENT ON TABLE ads IS
  'Sponsored ad slots. Active ads are public-readable; impression/click counters and content edits via service_role only.';


-- =============================================================================
-- 4) Tighten submitted_stations + add self-verify guard
-- =============================================================================
-- The original "submitted_update" policy was USING (true) — ANY user could
-- mutate ANY pending submission's verification_count to force it onto the map.
-- Replace with self-edit-only AND only-while-pending.
DROP POLICY IF EXISTS "submitted_update" ON submitted_stations;
DROP POLICY IF EXISTS "submitted_update_own_pending" ON submitted_stations;

CREATE POLICY "submitted_update_own_pending" ON submitted_stations
  FOR UPDATE
  USING (auth.uid()::text = submitted_by AND status = 'pending')
  WITH CHECK (auth.uid()::text = submitted_by AND status = 'pending');

COMMENT ON POLICY "submitted_update_own_pending" ON submitted_stations IS
  'Submitters may edit their own pending submission. Verification is done via verify_submitted_station() RPC only.';

-- verify_submitted_station(): the ONLY supported way to verify a submission.
-- - Submitter cannot self-verify.
-- - Same user cannot verify twice.
-- - Hits 3 confirmations -> status flips to 'verified'.
CREATE OR REPLACE FUNCTION verify_submitted_station(submission_id uuid)
RETURNS submitted_stations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row submitted_stations;
  v_caller text;
  v_new_count integer;
  v_new_verified_by text[];
  v_new_status text;
BEGIN
  v_caller := auth.uid()::text;

  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  SELECT * INTO v_row FROM submitted_stations WHERE id = submission_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'submission % not found', submission_id;
  END IF;

  IF v_row.status <> 'pending' THEN
    RAISE EXCEPTION 'submission % is not pending (status=%)', submission_id, v_row.status;
  END IF;

  IF v_row.submitted_by IS NOT NULL AND v_row.submitted_by = v_caller THEN
    RAISE EXCEPTION 'submitter cannot self-verify their own submission';
  END IF;

  IF v_caller = ANY(COALESCE(v_row.verified_by, ARRAY[]::text[])) THEN
    RAISE EXCEPTION 'user has already verified this submission';
  END IF;

  v_new_verified_by := COALESCE(v_row.verified_by, ARRAY[]::text[]) || v_caller;
  v_new_count := COALESCE(v_row.verification_count, 0) + 1;
  v_new_status := CASE WHEN v_new_count >= 3 THEN 'verified' ELSE 'pending' END;

  UPDATE submitted_stations
  SET verified_by = v_new_verified_by,
      verification_count = v_new_count,
      status = v_new_status
  WHERE id = submission_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION verify_submitted_station(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION verify_submitted_station(uuid) TO authenticated;

COMMENT ON FUNCTION verify_submitted_station(uuid) IS
  'Authenticated users verify a pending submitted_stations row. Rejects self-verification and duplicate votes. Flips status to verified at 3 confirmations.';


-- =============================================================================
-- 5) Rate-limit infrastructure for AI / Edge-Function endpoints
-- =============================================================================
CREATE TABLE IF NOT EXISTS rate_limits (
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- No policies = no client access. service_role bypasses RLS.
COMMENT ON TABLE rate_limits IS
  'Per-(user, endpoint, minute) request counters. service_role only — clients cannot read or write directly.';

-- check_and_increment_rate_limit(): upsert + return whether the caller is
-- under the limit. Window is bucketed by minute (date_trunc('minute', now())).
-- Returns true if the *new* count is <= p_max, false otherwise.
CREATE OR REPLACE FUNCTION check_and_increment_rate_limit(
  p_user_id uuid,
  p_endpoint text,
  p_max integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_window_start timestamptz;
  v_new_count integer;
BEGIN
  IF p_user_id IS NULL OR p_endpoint IS NULL THEN
    RAISE EXCEPTION 'user_id and endpoint are required';
  END IF;

  -- Bucket by floor(now() / window_seconds). Default fine-grain bucket is
  -- per-minute, but p_window_seconds lets callers widen if they want.
  v_window_start := to_timestamp(
    floor(extract(epoch FROM now()) / GREATEST(p_window_seconds, 1)) * GREATEST(p_window_seconds, 1)
  );

  INSERT INTO rate_limits (user_id, endpoint, window_start, count)
  VALUES (p_user_id, p_endpoint, v_window_start, 1)
  ON CONFLICT (user_id, endpoint, window_start)
  DO UPDATE SET count = rate_limits.count + 1
  RETURNING count INTO v_new_count;

  RETURN v_new_count <= p_max;
END;
$$;

REVOKE ALL ON FUNCTION check_and_increment_rate_limit(uuid, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_and_increment_rate_limit(uuid, text, integer, integer) TO service_role;

COMMENT ON FUNCTION check_and_increment_rate_limit(uuid, text, integer, integer) IS
  'Edge-Function rate limiter. Upserts the (user, endpoint, window) counter and returns true if the post-increment count is <= p_max. service_role only.';


-- =============================================================================
-- 6) Transaction idempotency + atomic wallet credit
-- =============================================================================
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_idempotency
  ON transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;

COMMENT ON COLUMN transactions.idempotency_key IS
  'Client-supplied idempotency key (e.g. UUIDv4 from the topup form). Unique-when-not-null so retries do not double-credit.';

-- credit_wallet_atomic(): the ONLY supported way to top up a wallet from a
-- server-side payment callback. Ensures:
--   - the wallet belongs to the claimed user
--   - replays with the same idempotency_key return the prior tx unchanged
--   - balance update + transaction insert are atomic (same statement)
CREATE OR REPLACE FUNCTION credit_wallet_atomic(
  p_wallet_id uuid,
  p_amount numeric,
  p_type text,
  p_method text,
  p_reference text,
  p_idempotency_key text,
  p_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_owner uuid;
  v_existing_tx uuid;
  v_new_balance numeric;
  v_new_tx_id uuid;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'amount must be > 0';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;

  -- Ownership check
  SELECT user_id INTO v_owner FROM wallets WHERE id = p_wallet_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'wallet % not found', p_wallet_id;
  END IF;
  IF v_owner IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'wallet does not belong to user';
  END IF;

  -- Idempotent replay
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_tx
    FROM transactions
    WHERE idempotency_key = p_idempotency_key
    LIMIT 1;

    IF FOUND THEN
      SELECT balance INTO v_new_balance FROM wallets WHERE id = p_wallet_id;
      RETURN json_build_object(
        'transaction_id', v_existing_tx,
        'balance', v_new_balance,
        'replayed', true
      );
    END IF;
  END IF;

  -- Atomic credit
  UPDATE wallets
  SET balance = balance + p_amount
  WHERE id = p_wallet_id AND user_id = p_user_id
  RETURNING balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'wallet ownership check failed during update';
  END IF;

  INSERT INTO transactions (wallet_id, type, amount, method, reference_id, status, idempotency_key)
  VALUES (p_wallet_id, p_type, p_amount, p_method, p_reference, 'completed', p_idempotency_key)
  RETURNING id INTO v_new_tx_id;

  RETURN json_build_object(
    'transaction_id', v_new_tx_id,
    'balance', v_new_balance,
    'replayed', false
  );
END;
$$;

REVOKE ALL ON FUNCTION credit_wallet_atomic(uuid, numeric, text, text, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION credit_wallet_atomic(uuid, numeric, text, text, text, text, uuid) TO service_role;

COMMENT ON FUNCTION credit_wallet_atomic(uuid, numeric, text, text, text, text, uuid) IS
  'Atomically credit a wallet and record a transaction. Idempotent on p_idempotency_key. service_role only.';


-- =============================================================================
-- 7) Server-side proximity-checked station_reports submission
-- =============================================================================
-- Note: station_reports.station_id is TEXT, not UUID (see 20260328000001).
-- We cast inside the function instead of altering the column (would break
-- existing rows). The function tries `ev_stations` first (the live table used
-- by the map) and falls back to `stations`.
CREATE OR REPLACE FUNCTION submit_station_report(
  p_station_id uuid,
  p_status text,
  p_user_lat numeric,
  p_user_lng numeric,
  p_user_id uuid,
  p_notes text,
  p_photo_urls text[]
)
RETURNS station_reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_lat numeric;
  v_lng numeric;
  v_dist_km numeric;
  v_row station_reports;
  v_caller uuid;
  v_radius_earth_km constant numeric := 6371.0088;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  IF p_user_id IS DISTINCT FROM v_caller THEN
    RAISE EXCEPTION 'p_user_id must match auth.uid()';
  END IF;

  IF p_user_lat IS NULL OR p_user_lng IS NULL THEN
    RAISE EXCEPTION 'user latitude/longitude required for proximity check';
  END IF;

  -- Look up station coords. Prefer ev_stations (current map source); fall
  -- back to stations. Both tables expose latitude/longitude columns.
  BEGIN
    EXECUTE 'SELECT latitude, longitude FROM ev_stations WHERE id = $1'
      INTO v_lat, v_lng
      USING p_station_id;
  EXCEPTION WHEN undefined_table THEN
    v_lat := NULL;
    v_lng := NULL;
  END;

  IF v_lat IS NULL OR v_lng IS NULL THEN
    SELECT latitude, longitude INTO v_lat, v_lng
    FROM stations WHERE id = p_station_id;
  END IF;

  IF v_lat IS NULL OR v_lng IS NULL THEN
    RAISE EXCEPTION 'station % not found', p_station_id;
  END IF;

  -- Haversine distance (km)
  v_dist_km := 2 * v_radius_earth_km * asin(
    sqrt(
      power(sin(radians((v_lat - p_user_lat) / 2)), 2)
      + cos(radians(p_user_lat)) * cos(radians(v_lat))
        * power(sin(radians((v_lng - p_user_lng) / 2)), 2)
    )
  );

  -- 150m grace (0.15 km). Reports outside this radius are rejected.
  IF v_dist_km > 0.15 THEN
    RAISE EXCEPTION 'too far from station (%.3f km > 0.150 km)', v_dist_km;
  END IF;

  INSERT INTO station_reports (station_id, user_id, status, comment)
  VALUES (p_station_id::text, p_user_id::text, p_status, p_notes)
  RETURNING * INTO v_row;

  -- Note: photo_urls is accepted for forward-compat once the column is added
  -- (see 20260406000001_station_report_photos.sql). If the column already
  -- exists, update it in place; otherwise silently ignore.
  IF p_photo_urls IS NOT NULL AND array_length(p_photo_urls, 1) > 0 THEN
    BEGIN
      EXECUTE 'UPDATE station_reports SET photo_urls = $1 WHERE id = $2'
        USING p_photo_urls, v_row.id;
    EXCEPTION WHEN undefined_column THEN
      -- photo_urls column not present yet — ignore
      NULL;
    END;
  END IF;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION submit_station_report(uuid, text, numeric, numeric, uuid, text, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION submit_station_report(uuid, text, numeric, numeric, uuid, text, text[]) TO authenticated;

COMMENT ON FUNCTION submit_station_report(uuid, text, numeric, numeric, uuid, text, text[]) IS
  'Server-side station-report insertion with 150m haversine proximity check. Callable by authenticated users; the SECURITY DEFINER context lets it run even when station_reports has tighter RLS in the future.';


-- =============================================================================
-- VERIFICATION QUERIES (run manually after applying):
-- =============================================================================
-- Confirm the auto-confirm trigger and function are gone.
--   SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_confirm_email';
--   -- expect: 0 rows
--   SELECT proname FROM pg_proc WHERE proname = 'auto_confirm_email';
--   -- expect: 0 rows
--
-- Confirm RLS is enabled on the previously-unprotected tables.
--   SELECT relname, relrowsecurity
--   FROM pg_class
--   WHERE relname IN ('providers', 'ai_interactions', 'station_analytics', 'ads', 'rate_limits')
--   ORDER BY relname;
--   -- expect: relrowsecurity = true for every row
--
-- Confirm the user_profiles UPDATE policy has a WITH CHECK clause.
--   SELECT polname, pg_get_expr(polqual, polrelid) AS using_expr,
--          pg_get_expr(polwithcheck, polrelid) AS check_expr
--   FROM pg_policy
--   WHERE polrelid = 'user_profiles'::regclass AND polcmd = 'w';
--   -- expect: 'users_update_own_profile' with a non-null check_expr that
--   --        references the existing role.
--
-- Confirm submitted_stations UPDATE policy is the new one.
--   SELECT polname FROM pg_policy
--   WHERE polrelid = 'submitted_stations'::regclass AND polcmd = 'w';
--   -- expect: 'submitted_update_own_pending'
--
-- Confirm the new functions exist and have the right security/owner.
--   SELECT proname, prosecdef
--   FROM pg_proc
--   WHERE proname IN (
--     'verify_submitted_station',
--     'check_and_increment_rate_limit',
--     'credit_wallet_atomic',
--     'submit_station_report',
--     'handle_new_user'
--   )
--   ORDER BY proname;
--   -- expect: prosecdef = true for all five.
--
-- Confirm transactions.idempotency_key + its unique index exist.
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'transactions' AND column_name = 'idempotency_key';
--   SELECT indexname FROM pg_indexes
--   WHERE tablename = 'transactions' AND indexname = 'idx_transactions_idempotency';
--
-- Smoke-test rate limiter (as service_role):
--   SELECT check_and_increment_rate_limit(
--     '00000000-0000-0000-0000-000000000001'::uuid, 'test', 3, 60);
--   -- expect: true on the first 3 calls within a minute, false thereafter.
-- =============================================================================
