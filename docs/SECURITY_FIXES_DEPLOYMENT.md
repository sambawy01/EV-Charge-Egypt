# Security Fixes — Deployment Runbook

This document describes how to deploy the 13 critical-fix patches from the
investor-readiness audit. **Do not skip the rotation steps.** The repo previously
contained a Supabase JWT in plaintext, so the existing anon and service-role keys
must be considered compromised.

## Summary of what changed

| # | Fix | Lives in |
|---|-----|----------|
| 1 | `process-payment` requires JWT + ownership + idempotency + atomic balance | `supabase/functions/process-payment/index.ts` + migration RPC `credit_wallet_atomic` |
| 2 | Removed hardcoded JWT fallback; cleaned scripts; renamed server-side env vars | `src/core/config/supabase.ts`, `.env`, `.env.example`, `scripts/*` |
| 3 | Dropped `auto_confirm_email` trigger | `supabase/migrations/20260512000001_security_hardening.sql` |
| 4 | `user_profiles` UPDATE now has `WITH CHECK` (no role escalation) | migration |
| 5 | Enabled RLS on `providers`, `ai_interactions`, `station_analytics`, `ads` | migration |
| 6 | All 7 Edge Functions verify JWT; body-supplied `userId` ignored | `supabase/functions/_shared/auth.ts` + all 7 functions |
| 7 | `submitted_stations` UPDATE policy locked; verification via SECURITY DEFINER RPC | migration |
| 8 | Per-user rate limits on all AI endpoints | migration + `_shared/rateLimit.ts` |
| 9 | `WebMap` escapes user data + parent verifies `event.origin` + ID/status whitelist | `src/driver/components/WebMap.tsx`, `src/driver/screens/MapScreen.web.tsx` |
| 10 | `vehicleAnalysisService` returns `isDemo: true` + UI banner | service + `VehicleDashboardScreen` |
| 11 | Removed "Explore Demo" button | `screens/auth/WelcomeScreen.tsx` |
| 12 | Removed Booking/Wallet/ChargingSession from nav; killed fake `setInterval` | `src/navigation/DriverNavigator.tsx`, `src/driver/screens/ChargingSessionScreen.tsx` |
| 13 | Removed 6 dead `onPress={() => {}}` Settings rows | `src/driver/screens/SettingsScreen.tsx` |

---

## Step 1 — Rotate compromised keys (Supabase + Anthropic dashboards)

These previously shipped in the public repo and must be rotated.

### 1a. Rotate the Supabase project keys

1. Open https://supabase.com/dashboard/project/_/settings/api
2. Under **Project API keys**, click **Reset** next to both the `anon` and `service_role` keys.
3. Copy the new `anon` key — you'll paste it into `.env` (step 1c).
4. Copy the new `service_role` key — you'll paste it into the Edge Function secret store (step 1d).
5. Under **JWT Settings**, click **Generate new JWT secret**. This invalidates every existing session — all users will need to sign in again. **Acceptable pre-launch.** Do NOT do this without coordination if you already have real users.

### 1b. Rotate the Anthropic API key

1. Open https://console.anthropic.com/settings/keys
2. Find the key starting with `sk-ant-api03-3XaRf6Yb7-nJr3QT5z3u8vqlGQt...`
3. Click **Revoke**.
4. Click **Create Key**, name it `wattson-edge-functions`, copy the new key.

### 1c. Update local `.env`

Replace the contents of `.env` with:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://plpwojwnzueigukmjidw.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<NEW_ANON_KEY_FROM_STEP_1A>
EXPO_PUBLIC_GOOGLE_MAPS_KEY=AIzaSyBIhxzDNFgEGt0hRUhrGzzXsZPUSkFK6Sw
```

Do **not** put the service-role key or Anthropic key in this file. They are server-side only and must never be prefixed `EXPO_PUBLIC_*`.

### 1d. Set Edge Function secrets (server-side only)

```bash
supabase secrets set ANTHROPIC_API_KEY=<NEW_ANTHROPIC_KEY>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<NEW_SERVICE_ROLE_KEY>
supabase secrets set SYNC_CRON_SECRET=$(openssl rand -hex 32)
supabase secrets set PAYMENT_GATEWAY_MODE=simulate

# Verify
supabase secrets list
```

`PAYMENT_GATEWAY_MODE=simulate` makes `process-payment` credit wallets without hitting a real gateway — fine for staging. **Set to `live` only after the Paymob/Fawry integration is wired up** (which is still a TODO). In `live` mode the function returns 501 until that integration exists.

`SYNC_CRON_SECRET` protects `sync-ocm-stations`. Schedule that function via `pg_cron` or an external scheduler and have it send `x-cron-secret: <secret>` on every call.

---

## Step 2 — Apply the DB migration

The migration is **idempotent** — safe to run multiple times.

```bash
# Local dev
supabase db push

# Or against staging/prod
supabase db push --linked   # or `supabase db remote commit` per your workflow
```

After it applies, run the verification queries at the bottom of `supabase/migrations/20260512000001_security_hardening.sql`:

```sql
-- 1. The dev trigger is gone
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_confirm_email';
-- expect: 0 rows

-- 2. RLS is enabled on the four newly-protected tables
SELECT relname, relrowsecurity FROM pg_class
WHERE relname IN ('providers','ai_interactions','station_analytics','ads');
-- expect: relrowsecurity = true for all four

-- 3. user_profiles UPDATE policy has WITH CHECK
SELECT polname, polcmd FROM pg_policy
WHERE polrelid='user_profiles'::regclass AND polcmd='w';
-- expect: 'users_update_own_profile'

-- 4. New SECURITY DEFINER functions exist
SELECT proname FROM pg_proc WHERE proname IN (
  'verify_submitted_station','check_and_increment_rate_limit',
  'credit_wallet_atomic','submit_station_report'
);
-- expect: all 4 listed

-- 5. transactions.idempotency_key + unique index exist
SELECT column_name FROM information_schema.columns
WHERE table_name='transactions' AND column_name='idempotency_key';
SELECT indexname FROM pg_indexes
WHERE tablename='transactions' AND indexname='idx_transactions_idempotency';
```

---

## Step 3 — Enable Supabase Auth email confirmation

The migration drops the auto-confirm trigger. Now turn on the dashboard setting that takes its place:

1. https://supabase.com/dashboard/project/_/auth/providers
2. Expand **Email**.
3. Toggle **Confirm email** to ON.
4. Save.

Without this step, signups will succeed but accounts will be unconfirmed and unable to log in until they click the confirmation email.

---

## Step 4 — Deploy the Edge Functions

```bash
# Deploy all 7 functions
supabase functions deploy ai-chat
supabase functions deploy ai-cost-optimizer
supabase functions deploy ai-route-planner
supabase functions deploy ai-battery-health
supabase functions deploy ai-predict-availability
supabase functions deploy process-payment
supabase functions deploy sync-ocm-stations

# Or all at once
supabase functions deploy
```

The functions now do their own JWT verification, so you should disable Supabase's built-in `--verify-jwt` wrapper. Check the project's `supabase/config.toml`:

```toml
[functions.process-payment]
verify_jwt = false   # we do JWT verification in-function

[functions.ai-chat]
verify_jwt = false
# ... repeat for the other AI functions

[functions.sync-ocm-stations]
verify_jwt = false   # uses x-cron-secret instead of JWT
```

---

## Step 5 — Schedule the OCM sync cron job

The `sync-ocm-stations` function is now publicly inaccessible without the `x-cron-secret` header. Schedule it via Supabase's pg_cron extension:

```sql
-- Run once an hour
SELECT cron.schedule(
  'sync-ocm-stations-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/sync-ocm-stations',
    headers := jsonb_build_object(
      'x-cron-secret', current_setting('app.sync_cron_secret', true),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

Or use an external scheduler that sends the same header.

---

## Step 6 — Update client callers

The Edge Function changes mean the React Native client needs minor updates. The TODO list:

1. **`process-payment` requires `idempotencyKey`**. In `src/core/services/paymentService.ts`, generate `crypto.randomUUID()` (or `expo-crypto`) per top-up attempt and include it in the body. Without it, the function returns 400.

2. **`ai-route-planner` requires `destinationLatLng`**. Geocode the destination string on the client (you already have `googleMapsService.geocode`) and pass `{ lat, lng }` to the Edge Function. Without it, the function returns 400.

3. **All Edge Function calls now require `Authorization: Bearer <session.access_token>`**. Verify that the Supabase JS client is automatically attaching the session token on `supabase.functions.invoke(...)` calls. Anonymous invocations now return 401.

4. **AI endpoints rate-limit at 10–30 req/min/user**. Surface the 429 response to the user with a friendly "you're chatting too fast" message in `aiService` / `claudeService`.

5. **`submittedStationService.verifyStation` should call the new RPC** instead of doing a direct UPDATE:
   ```ts
   const { data, error } = await supabase.rpc('verify_submitted_station', { p_submission_id: stationId });
   ```

6. **`stationReportService.submitReport` should call the new RPC** to get server-side proximity enforcement:
   ```ts
   const { data, error } = await supabase.rpc('submit_station_report', {
     p_station_id: stationId,
     p_status: status,
     p_user_lat: userLocation.latitude,
     p_user_lng: userLocation.longitude,
     p_notes: notes ?? null,
     p_photo_urls: photoUrls ?? [],
   });
   ```

These client changes are not blockers for deploying the security fixes — the server is hardened either way. The above just gives users a working UX on the hardened endpoints.

---

## Step 7 — Build and deploy the web app

After the .env is updated:

```bash
npx expo export --platform web
cd dist && vercel deploy --prod --yes
vercel alias <deployment-url> wattson-ev.vercel.app
```

---

## Step 8 — Smoke test

After everything is live, run these checks:

1. **Signup with a real email** → confirmation email arrives → click link → sign in. (Verifies #3.)
2. **Try to escalate role from browser console** (signed in as a driver):
   ```js
   await supabase.from('user_profiles').update({ role: 'admin' }).eq('id', user.id);
   ```
   Should return `error: new row violates row-level security policy`. (Verifies #4.)
3. **Try to read other users' AI chats**:
   ```js
   await supabase.from('ai_interactions').select('*').limit(10);
   ```
   Should return only the current user's rows. (Verifies #5.)
4. **Try unauthenticated `process-payment`**:
   ```bash
   curl -X POST 'https://<project>.supabase.co/functions/v1/process-payment' \
     -H 'apikey: <anon>' \
     -H 'Content-Type: application/json' \
     -d '{"walletId":"any","amount":999,"type":"topup","method":"card","idempotencyKey":"abc"}'
   ```
   Should return 401. (Verifies #1, #6.)
5. **Hammer `ai-chat` in a loop while signed in** — after ~30 requests/minute you should start getting 429. (Verifies #8.)
6. **In the live app**, try a fake station name like `<script>alert(1)</script>` (via submitted_stations admin panel) → on the map InfoWindow it should render as literal text, NOT execute. (Verifies #9.)
7. **Vehicle dashboard** shows the yellow "Demo data" banner over battery/consumption/charging panels. (Verifies #10.)
8. **Welcome screen** no longer shows "Explore Demo". (Verifies #11.)
9. **Tab bar** has no Wallet or Bookings tab. Tapping the Map → station → no "Book Now" route. (Verifies #12.)
10. **Settings screen** has only General + About sections. (Verifies #13.)

---

## What's still outstanding (not in this batch)

The audit identified 33 high-severity issues beyond the 13 criticals. The biggest unfinished items:

- Real payment gateway integration (Paymob/Fawry webhook + HMAC). The function is hardened against abuse but currently runs in simulate mode.
- Native `MapScreen.tsx` parity with the web version (community status, proximity reporter, AI recs).
- i18n on auth + Settings + StationDetail screens (Arabic toggle currently only re-skins a few screens).
- Replace `import { colors }` with `useTheme()` to make dark/light toggle actually work.
- `adService` impressions/clicks still write `0` instead of incrementing — fix or remove ads.
- `chargingService.stopSession` returns null due to missing `.select().single()`.
- `creditService.topUpCredits` should call the new `credit_wallet_atomic` RPC (currently does separate non-atomic updates).
- `accessibilityLabel` on icon-only buttons.
- TypeScript errors in theme types, `Vehicle.year`, `outlineStyle: "none"`, `ProfileScreen.email`.
- Welcome screen "100+ stations" hardcoded — should read live count.
- Add `vercel.json` with CSP / HSTS / X-Frame-Options.
- Real test coverage on `paymentService`, `stationReportService`, `claudeService`, `reliabilityScoreService`.

See `docs/INVESTOR_READINESS_AUDIT.md` for the full punch list with severity and impact.
