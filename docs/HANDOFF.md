# WattsOn Security Hardening — Coworker Handoff

**Date:** 2026-05-12
**Previous owner:** Hany (sambawy@gmail.com)
**Context:** A 13-item investor-readiness security sprint just landed. DB migration + 7 Edge Functions are deployed to production. Five tasks remain. This doc tells you exactly what to do.

The full audit is at `docs/INVESTOR_READINESS_AUDIT.md`. The deployment runbook is at `docs/SECURITY_FIXES_DEPLOYMENT.md`. The migration file is `supabase/migrations/20260512000001_security_hardening.sql`.

---

## What's already done

| # | Fix | Status | Verify |
|---|-----|--------|--------|
| 1 | `process-payment` hardened (JWT, ownership, idempotency, atomic credit, simulate-gated) | ✅ deployed | `curl` test below returns 401 |
| 2 | Hardcoded JWT removed from `supabase.ts` + 2 scripts; server-side keys moved out of `EXPO_PUBLIC_*` | ✅ committed | `grep -r "eyJhbGc" .env src/ scripts/` returns nothing |
| 3 | `auto_confirm_email` trigger dropped | ✅ migration applied | dashboard toggle is step **A** below |
| 4 | `user_profiles` UPDATE policy has `WITH CHECK` (no role self-escalation) | ✅ migration applied | smoke test **E** below |
| 5 | RLS enabled on `providers`, `ai_interactions`, `station_analytics`, `ads` | ✅ migration applied | anon `SELECT * FROM ai_interactions` returns `[]` |
| 6 | All 7 Edge Functions verify JWT, ignore body-supplied `userId` | ✅ deployed | smoke test **D** below |
| 7 | `submitted_stations` UPDATE locked to self-edits on `pending`; verify via SECURITY DEFINER RPC | ✅ migration applied | — |
| 8 | Per-user AI rate limit (10–30/min via `check_and_increment_rate_limit` RPC) | ✅ migration + functions | — |
| 9 | `WebMap` escapes user-controlled HTML; `MapScreen.web` verifies `event.origin` + whitelists stationId/status | ✅ committed | needs web rebuild (step **D**) |
| 10 | `vehicleAnalysisService` returns `isDemo: true`; dashboard shows "Demo data" banner | ✅ committed | needs web rebuild |
| 11 | "Explore Demo" link removed from WelcomeScreen | ✅ committed | needs web rebuild |
| 12 | Booking/Wallet/ChargingSession removed from nav; fake `setInterval` killed | ✅ committed | needs web rebuild |
| 13 | 6 dead `onPress={() => {}}` Settings rows removed | ✅ committed | needs web rebuild |

**Live deployment state:**
- Supabase project ref: `plpwojwnzueigukmjidw` (ev-charge-egypt, eu-central-1)
- Edge Function secrets set: `ANTHROPIC_API_KEY` (rotate ASAP), `PAYMENT_GATEWAY_MODE=simulate`, `SYNC_CRON_SECRET` (see below)
- Migration `20260512000001_security_hardening` applied
- Web build at https://wattson-ev.vercel.app **still serves the OLD client code** — rebuild + redeploy is task **D** below.

---

## Step A — Enable "Confirm email" in the Supabase dashboard (5 min)

The trigger that silently auto-confirmed every signup is dropped. The dashboard switch that takes its place is OFF. Until you flip it, signups still succeed without email confirmation — they just won't have the audit trail of "confirmed."

1. Open https://supabase.com/dashboard/project/plpwojwnzueigukmjidw/auth/providers
2. Click **Email** to expand.
3. Toggle **Confirm email** to **ON**.
4. Scroll down, click **Save**.

Optional but recommended: scroll to **Password requirements** and:
- Set **Minimum password length** to 10 (currently 6 by default).
- Enable **Password strength** → **Require character types**.

This also closes finding **H-11** (password-policy weakness).

While you're in the Auth section: **Settings → Auth → URL Configuration** — confirm the site URL is `https://wattson-ev.vercel.app` so confirmation emails link to the right place.

---

## Step B — Rotate the leaked keys

These keys are considered compromised because they sat in `.env` + 2 committed scripts. The previous code path didn't actually leak them to browser bundles, but anyone with read access to the repo or a dev laptop saw them.

### B-1. Rotate the Supabase anon + service-role keys + JWT signing secret

1. https://supabase.com/dashboard/project/plpwojwnzueigukmjidw/settings/api
2. Under **Project API keys**: click **Reset** next to **anon** and **service_role**. Copy the new values.
3. Under **JWT Settings**: click **Generate a new secret**. **This invalidates every existing session.** Pre-launch this is fine; current testers will need to sign in again.
4. Update your local `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<new-anon-key>
   ```
   Keep `EXPO_PUBLIC_SUPABASE_URL` as-is.
   Do **not** put the service-role key in `.env` — see B-3.

### B-2. Rotate the Anthropic API key

1. https://console.anthropic.com/settings/keys
2. Find the key starting `sk-ant-api03-3XaRf6Yb7-...` → **Revoke**.
3. Click **Create Key** → name it `wattson-edge-functions` → copy.

### B-3. Update Edge Function secrets with the new keys

```bash
# Anthropic (after rotation)
supabase secrets set --project-ref plpwojwnzueigukmjidw \
  ANTHROPIC_API_KEY='<new-anthropic-key>'

# Supabase service-role is auto-injected by the Edge Function runtime as
# `SUPABASE_SERVICE_ROLE_KEY` — you do NOT need to manually set it. After
# rotating it in B-1, the runtime updates automatically on next function
# invocation.

# Verify
supabase secrets list --project-ref plpwojwnzueigukmjidw
```

---

## Step C — Schedule the OCM sync cron

The `sync-ocm-stations` Edge Function is publicly invocable but now blocks every request without the cron-secret header. It also previously had a destructive `UPDATE ... SET is_active = false` line that could wipe the live station catalog; that's now gated behind `?deactivate=true`.

**The cron secret already set in Edge Function env:**

```
SYNC_CRON_SECRET = 8cf76b36584667b344167b085e294feedd09bb35fbbc31beab0ba268e40f8241
```

Save this in 1Password / your team's secret manager. The Edge Function checks this with constant-time compare against `Deno.env.get('SYNC_CRON_SECRET')`.

### Option C-1 — pg_cron (recommended; lives inside Supabase)

In the Supabase SQL Editor (https://supabase.com/dashboard/project/plpwojwnzueigukmjidw/sql/new):

```sql
-- Ensure extensions are enabled (probably already are)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the sync hourly. Replace the secret literal below.
SELECT cron.schedule(
  'sync-ocm-stations-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://plpwojwnzueigukmjidw.supabase.co/functions/v1/sync-ocm-stations',
    headers := jsonb_build_object(
      'x-cron-secret', '8cf76b36584667b344167b085e294feedd09bb35fbbc31beab0ba268e40f8241',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- Verify the schedule is registered
SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname = 'sync-ocm-stations-hourly';

-- To stop it later:
-- SELECT cron.unschedule('sync-ocm-stations-hourly');
```

After 1 hour, check the run log:

```sql
SELECT runid, jobid, start_time, end_time, status, return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sync-ocm-stations-hourly')
ORDER BY start_time DESC LIMIT 5;
```

### Option C-2 — GitHub Actions cron (if you prefer outside-DB)

`.github/workflows/sync-ocm-stations.yml`:

```yaml
name: Sync OCM stations
on:
  schedule:
    - cron: '0 * * * *'
  workflow_dispatch:
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Invoke Edge Function
        run: |
          curl -fsSL -X POST \
            'https://plpwojwnzueigukmjidw.supabase.co/functions/v1/sync-ocm-stations' \
            -H "x-cron-secret: ${{ secrets.SYNC_CRON_SECRET }}" \
            -H 'Content-Type: application/json' \
            -d '{}'
```

Then add `SYNC_CRON_SECRET` to repo Settings → Secrets.

---

## Step D — Rebuild + redeploy the web app

The Edge Functions now expect new request shapes that the **deployed web build does not send**:

- `process-payment` requires `idempotencyKey` in body → existing client returns 400 on every top-up attempt.
- `ai-route-planner` requires `destinationLatLng: { lat, lng }` → existing client returns 400 on trip plans.
- `WebMap` XSS fix + `event.origin` postMessage check is in source but not in the deployed bundle.
- `vehicleAnalysisService.isDemo` flag + UI banner is in source but not in the deployed bundle.
- Welcome screen "Explore Demo" link, Booking/Wallet/Charging tabs, dead Settings rows are still in the deployed bundle.

Pre-launch (no real users), this is safe to redeploy whenever. If you have testers actively poking the live site, give them a heads-up because they'll need to sign in again (combined with the JWT rotation in step B).

```bash
cd /Users/bistrocloud/Documents/EV\ Charging\ Aggregator

# Make sure .env has the new EXPO_PUBLIC_SUPABASE_ANON_KEY from B-1
cat .env | grep -v SERVICE | grep -v ANTHROPIC

# Build the web bundle
npx expo export --platform web

# Deploy to Vercel
cd dist && vercel deploy --prod --yes
# Take the URL it prints (e.g. https://dist-xxx.vercel.app) and alias:
vercel alias <printed-url> wattson-ev.vercel.app
```

If `vercel` complains about a missing project link, run `vercel link` first.

After deploy, hard-refresh https://wattson-ev.vercel.app and check:
- Welcome screen no longer has the **Explore Demo** link.
- Bottom tab bar (mobile) / top nav (desktop) has 5 tabs (Map / AI / News / Vehicle / Profile) — **no Wallet, no Bookings**.
- Settings → only "General" and "About" sections.
- Vehicle Dashboard → yellow "Demo data" banner appears.

---

## Step E — Smoke-test signed-in flows

The earlier 401 tests were unauthenticated. These need a real signed-in account.

### E-1. Verify role escalation is blocked

Sign in to https://wattson-ev.vercel.app as any driver. Open DevTools console:

```js
// Get your current user ID
const { data: { user } } = await supabase.auth.getUser();

// Attempt to self-promote
const { data, error } = await supabase
  .from('user_profiles')
  .update({ role: 'admin' })
  .eq('id', user.id);

console.log({ data, error });
```

**Expected:** `error.message` contains `new row violates row-level security policy` or `permission denied`. `data` is null. If `role` actually changes to `admin`, the policy is wrong — open a ticket.

### E-2. Verify cross-tenant data is hidden

```js
// Should only return YOUR own ai_interactions
const { data, error } = await supabase
  .from('ai_interactions')
  .select('user_id, created_at')
  .limit(10);

console.log({ count: data?.length, distinct_users: new Set(data?.map(r => r.user_id)).size });
```

**Expected:** All `user_id` values equal `user.id`, OR `data` is empty. If you see other users' IDs, the RLS policy is wrong.

### E-3. Verify `process-payment` end-to-end

This currently runs in `simulate` mode — credits the wallet without hitting a real gateway, but only if the caller owns the wallet and provides an idempotency key.

```js
// Find/create your wallet
const { data: wallet } = await supabase
  .from('wallets')
  .select('id, balance')
  .eq('user_id', user.id)
  .maybeSingle();

if (!wallet) {
  console.log('Create wallet first');
} else {
  // Top up via the new Edge Function
  const idempotencyKey = crypto.randomUUID();
  const { data, error } = await supabase.functions.invoke('process-payment', {
    body: {
      walletId: wallet.id,
      amount: 100,
      type: 'topup',
      method: 'card',
      idempotencyKey,
    },
  });
  console.log({ data, error });

  // Replay with same idempotency key — should return the SAME transaction_id
  const replay = await supabase.functions.invoke('process-payment', {
    body: { walletId: wallet.id, amount: 100, type: 'topup', method: 'card', idempotencyKey },
  });
  console.log({ replay_data: replay.data });
}
```

**Expected:**
- First call: `data.data.simulated === true`, `data.data.balance === wallet.balance + 100`, returns a `transaction_id`.
- Replay with same idempotencyKey: returns the SAME `transaction_id` and a `replayed: true` flag. Balance does NOT double.

### E-4. Verify station-report proximity check (server-side)

```js
const { data, error } = await supabase.rpc('submit_station_report', {
  p_station_id: '<some-station-uuid-from-stations-table>',
  p_status: 'available',
  p_user_lat: 0,   // intentionally far from any real station
  p_user_lng: 0,
  p_user_id: user.id,
  p_notes: null,
  p_photo_urls: null,
});
console.log({ data, error });
```

**Expected:** `error.message` contains `too far` or similar (the RPC raises an exception when user→station distance > 150m).

Now run again with `p_user_lat`/`p_user_lng` set to your actual lat/lng from a real station (anywhere within 150m). It should succeed and return the new report row.

### E-5. Verify AI rate-limit kicks in

```js
// Hammer ai-chat 35 times
const results = [];
for (let i = 0; i < 35; i++) {
  const r = await supabase.functions.invoke('ai-chat', {
    body: { message: 'ping ' + i, history: [] },
  });
  results.push(r.error?.context?.status ?? 'ok');
}
console.log(results.slice(-10));
```

**Expected:** Roughly the first 30 return `ok`, the next several return `429`. Rate-limit window is 60s.

### E-6. Confirm RLS smoke tests in dashboard SQL editor

For an extra sanity check, paste these in https://supabase.com/dashboard/project/plpwojwnzueigukmjidw/sql/new:

```sql
-- Confirm the auto-confirm trigger is gone
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_confirm_email';
-- expect: 0 rows

-- Confirm RLS is enabled where it matters
SELECT relname, relrowsecurity FROM pg_class
WHERE relname IN ('providers','ai_interactions','station_analytics','ads','rate_limits')
ORDER BY relname;
-- expect: relrowsecurity = true for all five

-- Confirm user_profiles UPDATE policy has WITH CHECK
SELECT polname, pg_get_expr(polwithcheck, polrelid) AS check_expr
FROM pg_policy WHERE polrelid='user_profiles'::regclass AND polcmd='w';
-- expect: 'users_update_own_profile' with non-null check_expr

-- Confirm new SECURITY DEFINER functions exist
SELECT proname, prosecdef FROM pg_proc
WHERE proname IN (
  'verify_submitted_station','check_and_increment_rate_limit',
  'credit_wallet_atomic','submit_station_report'
);
-- expect: 4 rows, prosecdef = true on all

-- Confirm transactions.idempotency_key + unique index
SELECT column_name FROM information_schema.columns
WHERE table_name='transactions' AND column_name='idempotency_key';
SELECT indexname FROM pg_indexes
WHERE tablename='transactions' AND indexname='idx_transactions_idempotency';
-- expect: 1 row each
```

---

## Quick verification — public 401 guards (no login needed)

These should all return 401 right now:

```bash
SUPABASE_URL=https://plpwojwnzueigukmjidw.supabase.co
ANON_KEY=$(grep EXPO_PUBLIC_SUPABASE_ANON_KEY .env | cut -d= -f2)

# 1. process-payment without auth header
curl -s -o /dev/null -w "process-payment no-auth: %{http_code}\n" \
  -X POST "$SUPABASE_URL/functions/v1/process-payment" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d '{"walletId":"x","amount":1,"type":"topup","method":"card","idempotencyKey":"x"}'
# expect: 401

# 2. ai-chat with only anon JWT (no real user)
curl -s -o /dev/null -w "ai-chat anon-only:    %{http_code}\n" \
  -X POST "$SUPABASE_URL/functions/v1/ai-chat" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" -d '{"message":"hi"}'
# expect: 401

# 3. sync-ocm-stations without cron secret
curl -s -o /dev/null -w "sync-ocm no-cron:     %{http_code}\n" \
  -X POST "$SUPABASE_URL/functions/v1/sync-ocm-stations" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" -d '{}'
# expect: 401

# 4. Same with wrong cron secret
curl -s -o /dev/null -w "sync-ocm bad-cron:    %{http_code}\n" \
  -X POST "$SUPABASE_URL/functions/v1/sync-ocm-stations" \
  -H "apikey: $ANON_KEY" -H "x-cron-secret: wrong" \
  -H "Content-Type: application/json" -d '{}'
# expect: 401
```

---

## Known outstanding work (not in this sprint)

The investor audit identified 33 high-severity issues beyond the 13 critical ones. The most important remaining:

- **Real payment gateway (Paymob/Fawry).** The function is hardened against abuse but `PAYMENT_GATEWAY_MODE=simulate`. Switching to `live` returns 501 until you wire HMAC-verified webhooks. Don't accept real money until done.
- **`creditService.topUpCredits`** still does 3 separate non-atomic UPDATE/INSERT calls. Switch to the new `credit_wallet_atomic` RPC (already deployed; safe to call from the client).
- **`adService.trackImpression` / `trackClick`** literally write `0` to the counters (`src/core/services/adService.ts:95-103`). All ad analytics are permanently broken. Fix or hide the ad tab.
- **`chargingService.stopSession`** returns `null` because it never chains `.select().single()` after the UPDATE. Receipts crash.
- **Two-table station schema.** `stations` (live) vs `ev_stations` (defined but empty). Audit recommends consolidating to one. Migration `20260327000002_additional_ev_stations.sql` is marked as "applied" without actually running — its data is missing but the app uses `stations`, so no immediate impact.
- **Native MapScreen** is a stub vs the web version. Port the proximity reporter / community status / AI recs into `src/driver/screens/MapScreen.tsx` before any iOS/Android demo.
- **i18n on auth + Settings + StationDetail screens.** Arabic mode currently only re-skins a handful of screens.
- **`useTheme()` everywhere.** Right now most screens import `colors` from a static singleton, so the light/dark toggle in ProfileScreen is a placebo.
- **`accessibilityLabel`** on icon-only buttons (Locate Me, photo modal X, filter cog). Fails WCAG; blocks Apple App Store accessibility review.
- **Welcome screen "100+ stations / 12 verified"** hardcoded — should pull live counts.
- **`vercel.json` with CSP / HSTS / X-Frame-Options** — currently no security headers on the web app.
- **Test coverage.** 10 of 34 test suites still fail to run (AsyncStorage mock missing). Money-path coverage = 0%.

Full punch list in `docs/INVESTOR_READINESS_AUDIT.md` (severity, file:line, fix per item).

---

## Contact

- **Previous owner (committed all of this):** Hany Sambawy — sambawy@gmail.com
- **Project repo:** https://github.com/sambawy01/EV-Charge-Egypt
- **Live web app:** https://wattson-ev.vercel.app (still serving old bundle — step D)
- **Supabase dashboard:** https://supabase.com/dashboard/project/plpwojwnzueigukmjidw

If any of the smoke tests in step E fail, post the exact output (with the curl/SQL command) — don't try to "patch around" a failing RLS test. The migration file is at `supabase/migrations/20260512000001_security_hardening.sql`; that's the source of truth for what the schema should look like.
