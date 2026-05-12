# WattsOn — Coworker Handoff

**Last updated:** 2026-05-12 (commit `f8738b5`)
**Previous owner:** Hany Sambawy — sambawy@gmail.com
**Repo:** https://github.com/sambawy01/EV-Charge-Egypt
**Live web (public):** https://dist-cyan-kappa-31.vercel.app
**Live web (aliased, currently 401 — see Step 1):** https://wattson-ev.vercel.app
**Supabase project ref:** `plpwojwnzueigukmjidw` (eu-central-1, team `Bistro Cloud PRO`)

---

## TL;DR — What you're picking up

A pre-launch EV-charging aggregator. The last sprint did three things in succession:

1. **Security hardening** — closed 13 critical investor-audit findings (RLS, auth bypasses, prompt injection, payment race conditions, XSS, etc). All landed in commit `0db152f` plus deploy.
2. **LLM swap** — moved the 4 AI Edge Functions from Anthropic Claude to Ollama Cloud (`gpt-oss:120b`). All live, commit `a8f02f8`.
3. **Wallet/Booking restore** — the security sprint removed the Wallet, Bookings and ChargingSession tabs because the payment endpoint was unauthenticated. Now that the endpoint is hardened (JWT, ownership, idempotency, atomic credit) the tabs are back. Commit `071d414`.

**Six manual steps remain** to make the platform fully usable. Step 4 (SMTP) is the active blocker — without it, no password resets or signup-confirm emails go out.

---

## Step 1 — Disable Vercel Deployment Protection (~30 seconds)

`wattson-ev.vercel.app` currently returns 401 with a Vercel SSO challenge. The deployment itself is fine — `dist-cyan-kappa-31.vercel.app` returns 200 with the latest bundle. The 401 is the project-level "Vercel Authentication" feature, enabled by default on new hobby-team projects.

1. Open https://vercel.com/sambawy-4389s-projects/dist/settings/deployment-protection
2. Set **Vercel Authentication** to **Disabled**
3. Save

After this, https://wattson-ev.vercel.app returns 200.

While you're there:
- **Settings → General → Project Name** → rename `dist` to `wattson-ev` (CLI doesn't expose this; has to be dashboard).
- Add a root `vercel.json` to the repo with `{ "buildCommand": "npx expo export --platform web", "outputDirectory": "dist" }` so future deploys can run from the repo root and don't accidentally create a new project named `dist` again.

---

## Step 2 — Enable email confirmation on signup (~30 seconds)

The dev-mode `auto_confirm_email` trigger was dropped in the security migration. Until you flip the dashboard switch that replaces it, signups still succeed without email confirmation (just no `email_confirmed_at` timestamp).

1. Open https://supabase.com/dashboard/project/plpwojwnzueigukmjidw/auth/providers
2. Click **Email** to expand
3. Toggle **Confirm email** → **ON**
4. Save

Also recommended on the same screen:
- **Minimum password length:** 10 (the security audit flagged `length >= 8` as too weak)
- **Password strength → Require character types:** enabled

---

## Step 3 — Confirm Redirect URLs are on the allowlist (~2 minutes)

The Site URL is already set to `https://wattson-ev.vercel.app`. The Redirect URLs allowlist must include the wildcard versions, otherwise password-reset email links land on a generic Supabase error page.

1. Open https://supabase.com/dashboard/project/plpwojwnzueigukmjidw/auth/url-configuration
2. Under **Redirect URLs**, click **Add URL** and add (one at a time):
   - `https://wattson-ev.vercel.app/**`
   - `https://dist-cyan-kappa-31.vercel.app/**`
3. (Optional for native + local dev later) Also add:
   - `wattsonev://**`
   - `http://localhost:8081/**`
4. Save

The `/**` suffix matters — without it the `?recovery=1` query the app appends will fail to match.

---

## Step 4 — Set up custom SMTP via Resend (~5 minutes, ACTIVE BLOCKER)

Supabase's built-in mailer is dev-only — limited to ~3 password-reset emails per hour per project, and the mail typically lands in spam. We hit this rate limit during password-reset testing today. **Without custom SMTP, signup confirmations and password resets will be unreliable.**

### 4a. Resend account

1. Sign up at https://resend.com/signup (~90 sec).
2. **API Keys → Create API Key**:
   - Name: `supabase-wattson`
   - Permission: **Sending access** (not full access)
   - Copy the `re_...` key now — Resend shows it once.

### 4b. Pick a sending domain

**For immediate testing:** use Resend's sandbox sender `onboarding@resend.dev` — works, but only delivers to email addresses you've added to "Audiences" inside Resend.

**For production:** buy a domain (Namecheap, Cloudflare Registrar, ~$10/yr) and verify it in Resend. The "WattsOn" brand needs a domain anyway.
1. Resend dashboard → **Domains → Add Domain** → enter the domain.
2. Add the 3 DNS records Resend gives you (SPF / DKIM / MX) at your domain registrar.
3. Click **Verify** in Resend.
4. Sender becomes `no-reply@yourdomain.com`.

### 4c. Plug into Supabase

1. Open https://supabase.com/dashboard/project/plpwojwnzueigukmjidw/settings/auth
2. Scroll to **SMTP Settings** → toggle **Enable Custom SMTP** ON
3. Fill in:
   ```
   Sender email:     onboarding@resend.dev          ← sandbox
                     no-reply@yourdomain.com        ← production
   Sender name:      WattsOn
   Host:             smtp.resend.com
   Port:             465
   Username:         resend
   Password:         re_xxxxxxxxxxxxxxxxxxxx        ← API key from 4a
   Minimum interval: 60
   ```
4. Save
5. Click **Send test email** on the same screen — should arrive within 30 sec.

If the test email doesn't arrive, check **Resend dashboard → Emails** for the rejection reason (almost always "sender not verified" or "missing DNS record").

---

## Step 5 — Rotate the previously-leaked keys (~5 minutes)

These keys were committed in plaintext at some point and have been considered compromised since the security audit. None of them are currently exploitable from the public web bundle (we verified), but they're still a "permanent" liability until rotated.

### 5a. Anthropic key — **NO LONGER NEEDED**

We swapped the AI stack to Ollama Cloud. The old Anthropic key at `console.anthropic.com` should be **revoked** for hygiene but isn't used by the production stack anymore. Hygiene-revoke at https://console.anthropic.com/settings/keys.

### 5b. Ollama key — recommended

The current Ollama API key (`3904326744e84c90b50bd7c72d7071ee.4eMdqrC9rFbLaoLlXxvAOT7R`) appeared in plaintext in a chat session, which means it has been in transcript form somewhere outside our control. Rotate it before public launch:

1. https://ollama.com/settings/keys → revoke the old key, create a new one.
2. Update Supabase Edge Function env:
   ```bash
   supabase secrets set --project-ref plpwojwnzueigukmjidw \
     OLLAMA_API_KEY='<new-key>'
   ```

### 5c. Supabase keys — recommended

1. Open https://supabase.com/dashboard/project/plpwojwnzueigukmjidw/settings/api
2. Under **Project API keys**: click **Reset** next to `anon` and `service_role`. Copy the new anon key.
3. Under **JWT Settings**: **Generate new JWT secret**. This invalidates every existing session — pre-launch this is acceptable, you and any active testers will need to sign in again.
4. Update `.env` locally:
   ```
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<new-anon-key>
   ```
5. Rebuild + redeploy the web app (see "Web rebuild + deploy" below) so the new anon key is in the bundle.

The service-role key is auto-injected by the Edge Function runtime as `SUPABASE_SERVICE_ROLE_KEY` — no manual env update needed after rotation, just the dashboard reset.

---

## Step 6 — Schedule the OCM-sync cron (~5 minutes)

`sync-ocm-stations` is the Edge Function that pulls fresh charger data from OpenChargeMap. It's already deployed and locked behind an `x-cron-secret` header (so anyone can't trigger destructive station-table updates). The secret is set as `SYNC_CRON_SECRET` in the Edge Function env. Find the value in Supabase dashboard → Edge Functions → secrets, or re-set if needed.

### Option A — pg_cron inside Supabase (recommended)

In Supabase SQL editor (https://supabase.com/dashboard/project/plpwojwnzueigukmjidw/sql/new):

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'sync-ocm-stations-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://plpwojwnzueigukmjidw.supabase.co/functions/v1/sync-ocm-stations',
    headers := jsonb_build_object(
      'x-cron-secret', '<value of SYNC_CRON_SECRET from Edge Function env>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- Verify
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'sync-ocm-stations-hourly';
```

After 1 hour, check runs:
```sql
SELECT start_time, end_time, status, return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sync-ocm-stations-hourly')
ORDER BY start_time DESC LIMIT 5;
```

### Option B — GitHub Actions

`.github/workflows/sync-ocm.yml`:
```yaml
name: Sync OCM stations
on:
  schedule: [{ cron: '0 * * * *' }]
  workflow_dispatch:
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -fsSL -X POST \
            'https://plpwojwnzueigukmjidw.supabase.co/functions/v1/sync-ocm-stations' \
            -H "x-cron-secret: ${{ secrets.SYNC_CRON_SECRET }}" \
            -H 'Content-Type: application/json' \
            -d '{}'
```
Add `SYNC_CRON_SECRET` to repo Settings → Secrets.

---

## How to rebuild + redeploy the web app

```bash
cd "/Users/bistrocloud/Documents/EV Charging Aggregator"
rm -rf dist && npx expo export --platform web

cd dist
vercel deploy --prod --yes
# Take the printed URL (https://dist-XXXX-...vercel.app) and alias:
vercel alias set <printed-url> wattson-ev.vercel.app
```

`vercel link` first time if you've never run on this machine. The project is `dist` under team `sambawy-4389s-projects`.

Smoke-test after deploy:
```bash
curl -sI https://dist-cyan-kappa-31.vercel.app/ | head -3
# expect: HTTP/2 200
```

---

## Verifying the current production state

### Public 401 guards (no login)
```bash
SUPABASE_URL=https://plpwojwnzueigukmjidw.supabase.co
ANON=<EXPO_PUBLIC_SUPABASE_ANON_KEY from .env>

# All four should return HTTP 401:
curl -s -o /dev/null -w "process-payment no-auth:   %{http_code}\n" \
  -X POST "$SUPABASE_URL/functions/v1/process-payment" \
  -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d '{"walletId":"x","amount":1,"type":"topup","method":"card","idempotencyKey":"x"}'

curl -s -o /dev/null -w "ai-chat anon-only:         %{http_code}\n" \
  -X POST "$SUPABASE_URL/functions/v1/ai-chat" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H "Content-Type: application/json" -d '{"message":"hi"}'

curl -s -o /dev/null -w "sync-ocm no-cron:          %{http_code}\n" \
  -X POST "$SUPABASE_URL/functions/v1/sync-ocm-stations" \
  -H "apikey: $ANON" -H "Content-Type: application/json" -d '{}'

curl -s -o /dev/null -w "ai_interactions anon-RLS:  " \
  "$SUPABASE_URL/rest/v1/ai_interactions?select=id&limit=1" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
echo  # body should be [] (RLS active)
```

### Signed-in smoke tests
After logging in via the live app, paste these in DevTools console:

```js
// 1. Role escalation should fail
const { data: { user } } = await supabase.auth.getUser();
const r1 = await supabase.from('user_profiles').update({ role: 'admin' }).eq('id', user.id);
console.log('role escalation:', r1);  // expect error / no rows

// 2. Wallet top-up replay should be idempotent
const w = await supabase.from('wallets').select('id,balance').eq('user_id', user.id).maybeSingle();
const key = crypto.randomUUID();
const t1 = await supabase.functions.invoke('process-payment', {
  body: { walletId: w.data.id, amount: 100, type: 'topup', method: 'card', idempotencyKey: key }
});
const t2 = await supabase.functions.invoke('process-payment', {
  body: { walletId: w.data.id, amount: 100, type: 'topup', method: 'card', idempotencyKey: key }
});
console.log('first:', t1.data?.data?.transactionId, 'replay:', t2.data?.data?.transactionId);
// expect: same transaction_id on both, balance not double-credited
```

---

## Repo geography (where things live)

| Path | What lives there |
|---|---|
| `App.tsx` | Root component. Handles location-permission gate before mounting the app. |
| `src/navigation/` | RootNavigator (auth vs driver vs fleet), DriverNavigator (tab bar), AuthNavigator. |
| `src/driver/screens/` | All driver screens including MapScreen.web.tsx (1000+ lines, the heart of the app). |
| `src/driver/components/WebMap.tsx` | The Google Maps iframe builder. Heavily XSS-hardened — `esc()` everything, validate IDs at boundary. |
| `src/core/services/` | All backend-touching code. `paymentService`, `stationReportService`, `claudeService` (chat → ai-chat Edge Function), etc. |
| `src/core/auth/` | AuthProvider listens to Supabase auth events including `PASSWORD_RECOVERY`. |
| `src/core/stores/` | Zustand stores. `authStore.inPasswordRecovery` flag drives the reset-password routing. |
| `supabase/migrations/` | DB schema. **All security-relevant policy is in `20260512000001_security_hardening.sql`.** |
| `supabase/functions/_shared/` | Auth helper (JWT verify), rate-limit helper, geo (corridor pre-filter), LLM helper (Ollama wrapper). |
| `supabase/functions/<name>/` | 7 Edge Functions. Each does its own JWT verification + rate-limit check via `_shared/`. |
| `docs/INVESTOR_READINESS_AUDIT.md` | 600-line audit with 13 critical + 33 high findings. Source of truth for remaining work. |
| `docs/SECURITY_FIXES_DEPLOYMENT.md` | Earlier deployment runbook (still useful for context). |
| `docs/HANDOFF.md` | This file. |

---

## Known outstanding work (not blockers for testing, but on the punch list)

Sorted by impact. Full details in `docs/INVESTOR_READINESS_AUDIT.md`.

### Money path
- **Real payment gateway integration** (Paymob/Fawry HMAC-verified webhooks). The function is hardened against abuse but `PAYMENT_GATEWAY_MODE=simulate` — wallets credit without hitting a real gateway. Don't flip to `live` until the webhook is wired (the function will return 501 if you do).
- **`creditService.topUpCredits`** still does 3 non-atomic UPDATE/INSERT calls. Switch to the new `credit_wallet_atomic` RPC (already deployed; safe to call from the client).
- **`adService.trackImpression` and `trackClick`** literally write `0` to the counters (`src/core/services/adService.ts:95-103`). Ad analytics are permanently broken. Fix or hide the ad surface.
- **`chargingService.stopSession`** returns `null` because it never chains `.select().single()` after the UPDATE. Receipts crash on real stop.

### Schema
- **Two-table station schema**: `stations` (live, 435 rows) vs `ev_stations` (defined but empty). Migration `20260327000002_additional_ev_stations.sql` is marked applied without running. Consolidate to one table; right now the app uses `stations`.

### Cross-platform
- **Native `MapScreen.tsx`** is a stub vs the web version. iOS/Android demos look bleak. Port the proximity reporter / community status / AI recs via a shared `useMapScreen` hook.

### Polish
- **i18n** is only wired on a handful of screens. Auth + Settings + StationDetail + most driver screens hardcode English. Arabic toggle is a placebo on those.
- **Theme** is mostly hardcoded too (`import { colors } from '@/core/theme/colors'` static singleton). The dark/light toggle in ProfileScreen only re-skins itself.
- **`accessibilityLabel`** on icon-only buttons. Fails WCAG and blocks Apple App Store accessibility review.
- **Welcome screen "100+ stations / 12 verified"** is hardcoded — should pull live counts.
- **`vercel.json` security headers** — Vercel auto-adds HSTS + X-Frame-Options but no CSP yet.

### Tests
- **10 of 34 test suites fail to run** (AsyncStorage mock missing). One-line fix in `jest.setup.js`.
- **Money path test coverage: 0%.** No tests on paymentService, stationReportService, claudeService, etc.

---

## What works right now

If you finish Steps 1–4 above, you'll have a fully functional pre-launch web app:

- ✅ Sign up + log in (with email confirmation enforcement)
- ✅ Map shows 435 stations (no first-load race)
- ✅ Filter by connector / provider / status
- ✅ Community status reporting (proximity-locked server-side via `submit_station_report` RPC)
- ✅ AI chat (Ollama-backed)
- ✅ Trip planner (mocked currently — `MOCK_PROVIDERS=true` in `featureFlags.ts`)
- ✅ Wallet top-up (simulate mode — credits work, no real charge yet)
- ✅ Bookings list + charging session (real DB, no fake setInterval)
- ✅ Vehicle dashboard (battery health analytics — clearly labeled "Demo data")
- ✅ Forgot password (inline banner feedback, server-side reset flow)
- ✅ News feed (real RSS)

---

## Contact

- **Previous owner:** Hany Sambawy — sambawy@gmail.com
- **Live demo:** wattson-ev.vercel.app (once you do Step 1)
- **Investor audit:** `docs/INVESTOR_READINESS_AUDIT.md`

If smoke tests in the "Verifying current production state" section fail, paste the exact output — don't try to patch around. The migration file at `supabase/migrations/20260512000001_security_hardening.sql` is the source of truth for what the DB should look like.
