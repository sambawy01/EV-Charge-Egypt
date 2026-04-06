# WattsOn Backend Architecture Improvement Report

**Audit Date:** 2026-03-27
**Auditor:** Backend Architect Agent
**Project:** WattsOn — Egypt's AI-Powered EV Charging App
**Database:** Supabase (PostgreSQL 17.6, eu-central-1)

---

## Executive Summary

WattsOn has a functional MVP backend built on Supabase with 435 stations, 518 connectors, 12 providers, and 8 users. The architecture follows a client-heavy pattern where most business logic runs on the mobile device rather than server-side. While this works at current scale, it introduces **critical security vulnerabilities**, **scalability ceilings**, and **data consistency risks** that must be addressed before production launch.

The most urgent issues are: API keys exposed in client bundles, absence of server-side validation on crowdsourced data, a payment system with no real gateway integration and race conditions on wallet balance updates, and AI services that generate fabricated analytics presented as real data.

---

## 1. Data Architecture

### 1.1 Schema Design

**Current State:** 19 tables in the `public` schema covering users, vehicles, stations, connectors, bookings, payments, reviews, and AI audit logging. The schema is well-normalized for an MVP with proper foreign key relationships.

**Strengths:**
- Clean separation of concerns: stations, connectors, providers, bookings, sessions
- Proper use of UUIDs as primary keys (via `gen_random_uuid()`)
- `station_analytics` table with compound unique on `(station_id, hour_of_day, day_of_week)` is a smart design for occupancy predictions
- Wallet system with transaction audit trail
- Fleet management tables ready for B2B expansion

**Issues Found:**

| Issue | Severity | Location |
|-------|----------|----------|
| `station_reports.station_id` is `TEXT`, not `UUID` with FK | HIGH | `20260328000001_station_reports.sql` |
| `station_reports.user_id` is `TEXT`, not `UUID` with FK | HIGH | `20260328000001_station_reports.sql` |
| `submitted_stations.submitted_by` is `TEXT`, not `UUID` with FK | HIGH | `20260328000002_submitted_stations.sql` |
| `submitted_stations.verified_by` is `TEXT[]`, no FK enforcement | MEDIUM | `20260328000002_submitted_stations.sql` |
| Dual station tables exist: `stations` (main) and a migration creates `ev_stations` | HIGH | `20260326000001_ev_charging_stations.sql` |
| No `updated_at` column on `stations` table | LOW | `20260325000001_initial_schema.sql` |
| `connectors.price_per_kwh` is `NOT NULL` but all 518 rows have prices | OK | Verified via query |

The `station_reports` table uses `TEXT` for `station_id` because it must reference both Supabase UUID stations and ephemeral OCM/OSM-prefixed IDs (`ocm-12345`, `osm-67890`). This is an intentional tradeoff, but it means there is zero referential integrity on the most write-heavy user-facing table.

### 1.2 Relationships and Integrity

The core schema (`stations -> connectors -> bookings -> sessions`) has proper FK chains. However, the crowdsourced layer (`station_reports`, `submitted_stations`) operates outside this integrity boundary. A report can reference a `station_id` of `"test"` (which exists in production data -- found during audit) with no validation.

**Recommendation:** Introduce a `station_identifiers` view or materialized view that unifies Supabase UUIDs with external IDs, and add a CHECK constraint or trigger that validates `station_id` format.

### 1.3 Indexes

**Current indexes (stations table):** 4 indexes
- `idx_stations_location` on `(latitude, longitude)` -- B-tree composite
- `idx_stations_provider` on `(provider_id)`
- Primary key index
- Unique constraint index on `(provider_id, external_station_id)`

**Missing indexes that will matter at scale:**
- No spatial index (PostGIS `GIST`) for geographic queries -- the current B-tree on `(lat, lng)` cannot support radius/bounding-box queries efficiently
- No index on `stations.city` for filtered queries
- No index on `stations.is_active` for the common `WHERE is_active = true` filter
- No index on `station_reports(station_id, created_at DESC)` as a composite for the hot query path
- No full-text search index on `stations.name` or `stations.address`

### 1.4 RLS Policies

RLS is enabled on all 15+ tables. Policy analysis:

| Table | Read | Write | Risk |
|-------|------|-------|------|
| `stations` | Public | None (admin only) | OK |
| `connectors` | Public | None | OK |
| `station_reports` | Public | **Anyone can INSERT (no auth)** | HIGH |
| `submitted_stations` | Public | **Anyone can INSERT AND UPDATE** | CRITICAL |
| `wallets` | Own only | None via RLS | OK |
| `ai_interactions` | None defined | None defined | MEDIUM |
| `station_analytics` | None defined | None defined | MEDIUM |

**Critical finding:** `submitted_stations` has `UPDATE USING (true)` -- any anonymous user can update ANY submitted station record, including changing its verification status to `'verified'` and injecting a malicious station into the main `stations` table. This is a data integrity and potential safety risk (directing users to non-existent or dangerous locations).

---

## 2. API Layer

### 2.1 Service Architecture Pattern

The app uses a **client-side service layer** pattern where TypeScript service objects (`stationService`, `claudeService`, etc.) make direct Supabase and third-party API calls from the React Native client. There are 7 Supabase Edge Functions for server-side operations.

**Architecture Diagram:**
```
Mobile App
  |-- stationService.ts ----> Supabase (stations table)
  |                     \---> OpenChargeMap API (direct)
  |                      \--> Google Maps API (direct)
  |                       \-> Overpass/OSM API (direct)
  |-- claudeService.ts ----> Supabase Edge Function (ai-chat)
  |                     \---> Anthropic API (direct fallback!)
  |-- newsService.ts -------> RSS feeds via CORS proxy
  |-- stationReportService -> Supabase (station_reports)
  |-- googleMapsService ----> Google Maps APIs (direct)
```

### 2.2 Data Fetching Strategy

`stationService.getStations()` is the primary data path and it implements a **triple-source merge strategy:**

1. Fetch all stations from Supabase (`SELECT *, connectors(*), provider:providers(*)`)
2. Fetch from OpenChargeMap API, merge by name deduplication
3. Fetch from Google Maps Places API, merge by name deduplication

**Issues:**
- **No pagination:** `_getStationsFromSupabase()` fetches ALL stations with all connectors in a single query. At 435 stations with 518 connectors, this is already a payload of ~200KB+ per load. At 1,000 stations this becomes a real problem.
- **Name-based deduplication is fragile:** Matching `s.name.toLowerCase()` will fail when the same station has slightly different names across sources (e.g., "Infinity EV - Mall of Egypt" vs "Infinity-e Charging Station Mall of Egypt").
- **Triple API call on every cold load:** Each `getStations()` call hits Supabase + OCM + Google Maps sequentially (OCM is cached for 10 min). This creates 1-3 second load times and burns Google Maps API quota.
- **Haversine computed client-side for every station:** Distance calculation runs in O(n) on every render cycle. Should be server-side with PostGIS `ST_DWithin`.
- **Filters applied client-side after full fetch:** Filtering by connector type, power, or price fetches ALL stations then filters in JS. This cannot scale.

### 2.3 Caching Strategy

| Cache | TTL | Scope | Invalidation |
|-------|-----|-------|-------------|
| OCM stations | 10 min | In-memory module global | Manual via `invalidateCache()` |
| Station reports | 5 min | In-memory module global | On new report submit |
| News articles | 1 hour | In-memory module global | None (TTL only) |
| Google Maps EV stations | None | No cache | Fetched every time |

**Problem:** All caches are in-memory module-level variables. In React Native with hot reload, these persist across navigation but are lost on app restart. There is no persistent cache layer (AsyncStorage for data, only used for visit tracking). No HTTP cache headers are leveraged. No stale-while-revalidate pattern.

### 2.4 Error Handling

Error handling follows a **silent degradation** pattern -- every service wraps calls in try/catch and returns empty arrays or `null` on failure. While this prevents crashes, it means:
- Users see empty states with no feedback on why
- Errors are logged to `console.warn` which is invisible in production
- No error reporting service (Sentry, Bugsnag) integration
- No retry logic with exponential backoff for transient failures
- The `stationService` falls back gracefully (Supabase -> OCM -> empty), which is good

---

## 3. Authentication

### 3.1 Auth Flow

Authentication uses Supabase Auth with email/password. The flow:
1. `signUp()` creates auth user, builds local profile, best-effort DB persist
2. Trigger `handle_new_user()` auto-creates `user_profiles` row
3. Trigger `handle_new_user_wallet()` auto-creates wallet
4. `AuthProvider` listens for auth state changes and syncs to Zustand store

**Strengths:**
- SecureStore used for token persistence on native (not AsyncStorage)
- Auto-refresh token enabled
- Trigger-based profile/wallet creation prevents orphaned records

### 3.2 Security Issues

| Issue | Severity | Details |
|-------|----------|---------|
| Auto email confirmation trigger | CRITICAL | `auto_confirm_email()` trigger bypasses email verification. Comment says "remove for production" but it is live. |
| No password strength enforcement | HIGH | Supabase default minimum is 6 characters. No complexity requirements. |
| Anonymous user workaround | HIGH | `stationReportService` falls back to `'anonymous'` string for `user_id`, bypassing auth entirely for reports. |
| No rate limiting on auth endpoints | MEDIUM | Supabase provides some built-in protection, but no custom throttling. |
| Session stored as `any` type | LOW | `authStore.session` is typed `any`, no type safety on token handling. |
| SignUp auto-signs-in on duplicate email | MEDIUM | If email exists and password matches, `signUp()` silently signs in. This is a UX convenience but leaks information about registered emails. |

### 3.3 Demo Mode Risk

The `AuthProvider` has a defensive pattern to not clear the user if `isAuthenticated` is already true (to handle signup without email confirmation). This means if a user's session expires server-side but the Zustand store still has `isAuthenticated: true`, the user appears logged in but all authenticated API calls will fail silently due to RLS.

---

## 4. Data Quality

### 4.1 Live Database Metrics

| Metric | Count | Assessment |
|--------|-------|------------|
| Stations | 435 | Good for Egypt market |
| Active stations | 434 | 1 inactive |
| Connectors | 518 | ~1.2 per station average |
| Providers | 12 | Comprehensive coverage |
| Station reports | 31 | Very low (app is new) |
| Users | 8 | Pre-launch |
| Vehicles | 4 | Pre-launch |
| Bookings | 0 | Feature not yet used |
| Charging sessions | 0 | Feature not yet used |
| Reviews | 0 | Feature not yet used |

### 4.2 Station Distribution

Greater Cairo dominates with 246 stations (57%), which reflects real-world infrastructure:
- Cairo: 96 | New Cairo: 74 | 6th of October: 51 | Sheikh Zayed: 14 | Giza: 11
- Sharm El Sheikh: 28 | Alexandria: 25 | North Coast: 16
- Highway corridor coverage: Ain Sokhna (7), Hurghada (7), El Alamein (7)

### 4.3 Provider Concentration Risk

**Infinity EV accounts for 330 of 435 stations (76%).** If this is accurate, the database correctly reflects market reality. If it is a data import artifact (e.g., generic stations defaulting to Infinity EV), this is a significant data quality issue. Cross-reference recommended.

### 4.4 Duplicate Detection

3 duplicate station name groups found:
- "Infinity-e Charging Station" appears **10 times** -- these are likely different physical locations with identical generic names. Need unique identifiers (address, coordinates) to distinguish them.
- "Infinity EV Station" appears 3 times
- "Infinity EV - Suez" appears 2 times (possible true duplicate)

**Recommendation:** Add a compound unique constraint or dedup trigger on `(name, ROUND(latitude, 3), ROUND(longitude, 3))` to catch stations within ~100m with the same name.

### 4.5 Connector Data Quality

- **Type2:** 435 connectors, avg 22.0 kW, avg 2.90 EGP/kWh
- **CCS:** 83 connectors, avg 60.0 kW, avg 3.50 EGP/kWh
- **No CHAdeMO or GBT** connectors in the database despite the schema supporting them
- The Type2 data looks uniform (all exactly 22kW) suggesting bulk-imported defaults rather than verified per-station specs

### 4.6 Report Data Anomaly

The `station_reports` table contains a record with `station_id = 'test'` -- this is test data in production. Additionally, multiple reports for the same station were submitted within seconds of each other (e.g., 12 reports for station `abe79ecb` in 20 seconds), suggesting automated testing or rate-limit bypass. The client-side rate limit of 5/minute is trivially bypassable.

---

## 5. Performance

### 5.1 Query Patterns

**Hot path:** `stationService.getStations()` -- called on app launch and every map render.

```sql
-- Current query (no filters, no pagination, no spatial)
SELECT *, connectors(*), provider:providers(*)
FROM stations
ORDER BY name;
```

This performs a 3-table join returning all 435 stations with all 518 connectors and provider data. At current scale (~200KB payload), this is acceptable. At 1,000 stations with 2,000 connectors, this becomes a 500KB+ payload with 1-2 second query time.

**Recommended replacement:**
```sql
-- PostGIS spatial query with pagination
SELECT s.*,
  ST_Distance(s.geom, ST_MakePoint($lng, $lat)::geography) as distance_m,
  json_agg(c.*) as connectors,
  row_to_json(p.*) as provider
FROM stations s
LEFT JOIN connectors c ON c.station_id = s.id
LEFT JOIN providers p ON p.id = s.provider_id
WHERE s.is_active = true
  AND ST_DWithin(s.geom, ST_MakePoint($lng, $lat)::geography, $radius_m)
GROUP BY s.id, p.id
ORDER BY distance_m
LIMIT 50 OFFSET $offset;
```

### 5.2 N+1 Query Risk

`stationReportService.getLiveStatus()` calls `getReportsForStation()` which makes an individual Supabase query per station. If called in a list view for 50 stations, this generates 50 sequential database round-trips. The `getAllLiveStatuses()` method correctly batches this into a single query, but it fetches ALL reports from the last 24 hours with no pagination.

### 5.3 Client-Side Computation Overhead

Three services duplicate the Haversine formula (`stationService`, `submittedStationService`, `googleMapsService`). More importantly, `submittedStationService.getNearbyPending()` fetches ALL pending stations then filters by distance in JavaScript -- this is a full table scan moved to the client.

### 5.4 Memory Pressure

The in-memory caches are unbounded:
- `_ocmCache` holds the entire OCM station array
- `_reportCache` holds all reports from the last 24 hours grouped by station
- `newsService._cache` holds all parsed RSS articles

In a React Native app, these module-level caches survive navigation but compete with the JS thread for memory. At scale, this could cause OOM on low-end devices.

---

## 6. Security

### 6.1 API Key Exposure (CRITICAL)

| Key | Exposed In | Risk |
|-----|-----------|------|
| Supabase URL + Anon Key | `supabase.ts` (hardcoded fallback) | MEDIUM -- anon key is designed to be public, but the URL is hardcoded |
| Anthropic API Key | `claudeService.ts` line 6 (`EXPO_PUBLIC_` prefix) | **CRITICAL** -- `EXPO_PUBLIC_` vars are bundled into the client JS. The `anthropic-dangerous-direct-browser-access` header confirms this. |
| Google Maps API Key | `googleMapsService.ts` line 1 (`EXPO_PUBLIC_` prefix) | HIGH -- bundled into client, no server-side restriction possible on mobile |
| OpenChargeMap API Key | `openChargeMapService.ts` line 252 (`EXPO_PUBLIC_` prefix) | MEDIUM -- free API key but still exposed |

**The Anthropic key exposure is the highest priority security fix.** Anyone decompiling the app bundle can extract the key and run arbitrary Claude API calls billed to WattsOn's account. The code even has a comment warning about this (line 1-5 of `claudeService.ts`), but the fallback path remains active.

### 6.2 Input Validation

- `stationReportService.submitReport()`: Comment is truncated to 500 chars (good), but no HTML/script sanitization
- `submittedStationService.submitStation()`: No validation on latitude/longitude ranges (could submit stations at 0,0 or on the moon)
- `searchStations()`: The search query is passed directly into Supabase `.ilike()` filter: `.or(\`name.ilike.%${query}%\`)`. While Supabase parameterizes this, the `%` wildcard wrapping is still injectable for pattern manipulation
- No CAPTCHA or proof-of-work on any submission endpoint

### 6.3 Rate Limiting

- Client-side only: `stationReportService` has a 5/minute limit in JavaScript. This is trivially bypassed by anyone calling the Supabase API directly.
- No server-side rate limiting on Edge Functions
- No rate limiting on station submissions
- No rate limiting on AI chat (each call costs ~$0.003-0.01 in Claude API fees)

### 6.4 CORS Configuration

All Edge Functions use `Access-Control-Allow-Origin: *`. This is acceptable for a mobile app backend but problematic if the same endpoints serve a web dashboard.

### 6.5 Payment Security

The `process-payment` Edge Function has critical issues:
- **No authentication check** -- anyone with the function URL can credit any wallet
- **Race condition on balance update:** reads balance, adds amount, writes back. Two concurrent requests could both read the same balance and one credit would be lost
- **No payment gateway integration** -- balance is credited immediately with no verification
- **No idempotency key** -- duplicate requests create duplicate credits

---

## 7. Scalability Analysis

### 7.1 Breaking Points

| Scale | Component | Breaking Point | Why |
|-------|-----------|---------------|-----|
| 1,000 stations | `_getStationsFromSupabase()` | Payload >500KB, 2s+ load | No pagination, full table fetch |
| 1,000 stations | Client-side filtering | Janky UI, 200ms+ per filter | O(n) array scans on every render |
| 1,000 stations | Name-based dedup | False negatives | Name matching fails on variants |
| 10,000 users | `station_reports` | Unbounded table growth | No archival or partitioning strategy |
| 10,000 users | AI chat | $100-300/day in API costs | No caching of common Q&A, no token budgeting |
| 10,000 users | `getAllLiveStatuses()` | Timeout on full table scan | Fetches all reports from last 24h |
| 100,000 reports | `station_reports` table | Slow queries | TEXT `station_id` prevents FK join optimization |
| 100,000 reports | In-memory `_reportCache` | OOM on device | Unbounded Map in memory |
| Concurrent writes | `process-payment` | Lost updates | No row-level locking on wallet balance |

### 7.2 Supabase Free Tier Limits

The project is on Supabase free tier (inferred from single project structure):
- 500MB database storage (currently using <1MB)
- 2GB bandwidth/month
- 500K Edge Function invocations/month
- 50MB Edge Function size limit

At 10,000 users making 5 API calls/day, the 500K Edge Function limit would be hit in ~10 days.

### 7.3 Third-Party API Quotas

- **OpenChargeMap:** Free tier, unknown rate limits
- **Overpass API (OSM):** Community resource with strict rate limits (~10K requests/day recommended max)
- **Google Maps Places API:** $0.032 per Nearby Search request. At 1,000 daily users, ~$32/day
- **Anthropic Claude:** ~$0.003-0.015 per chat message. At 10,000 messages/day, $30-150/day

---

## 8. AI Integration

### 8.1 Claude Service Architecture

The app has a **dual-path** Claude integration:
1. **Primary:** Supabase Edge Function `ai-chat` (server-side, secure)
2. **Fallback:** Direct Anthropic API call from client (insecure, development convenience)
3. **Final fallback:** Keyword-based response templates

The Edge Function correctly uses `ANTHROPIC_API_KEY` from Deno env (server-side only). The client fallback uses `EXPO_PUBLIC_ANTHROPIC_API_KEY` which is bundled into the app.

### 8.2 Context Management

The system prompt is well-crafted with:
- User vehicle context (make, model, battery)
- Up to 15 nearby stations with real data (name, distance, power, status)
- Egypt-specific knowledge (providers, costs, routes, climate)
- Actionable response format with `ACTION:` tags

**Issue:** The system prompt is rebuilt on every message, including up to 15 stations with full details. This consumes ~500-800 tokens per message just for context. At scale, this adds up. Consider caching the station context portion and only rebuilding when location changes significantly (>1km).

### 8.3 Fabricated Analytics (HIGH RISK)

`vehicleAnalysisService.ts` and `aiContextService.ts` generate **fake data presented as real analytics:**

- Battery health scores are computed from a seeded PRNG, not real telemetry
- "Monthly spending" is randomly generated (600-1400 EGP)
- "Charging patterns" including preferred time and top stations are fabricated
- "CO2 savings" are computed from fake driving data
- "Battery degradation" percentages are formula-based guesses

The seeded random ensures consistency per user (same vehicle ID always shows same data), which creates an illusion of real tracking. However, these numbers have no basis in reality and could mislead users into false confidence about their battery health.

**Recommendation:** Clearly label these as "estimates" or "simulations" in the UI. Better yet, remove fabricated data and show real telemetry once charging sessions are being recorded.

### 8.4 Cost Optimization

| AI Feature | Model | Max Tokens | Est. Cost/Call |
|------------|-------|------------|----------------|
| Chat | claude-sonnet-4-20250514 | 500 (client) / 1024 (edge) | $0.003-0.015 |
| Battery Health | claude-sonnet-4-20250514 | 1024 | $0.005-0.02 |
| Route Planning | claude-sonnet-4-20250514 | 1024 | $0.005-0.02 |
| Cost Optimizer | claude-sonnet-4-20250514 | 1024 | $0.005-0.02 |

**Savings opportunities:**
- Cache common questions (FAQ-style) to avoid API calls entirely
- Use claude-haiku for simple classification tasks (category detection, intent routing)
- Implement token budgets per user per day
- The `vehicleAnalysisService` does NOT use Claude at all (purely algorithmic) -- but the Edge Function `ai-battery-health` does. Two parallel systems exist for the same feature.

---

## 9. Real-time Features

### 9.1 Current State

There are **no real-time features implemented**. All data is fetched via polling:
- Station data: fetched on mount, cached 10 min
- Reports: fetched on demand, cached 5 min
- News: fetched on mount, cached 1 hour

### 9.2 Supabase Realtime Potential

Supabase Realtime is not being used despite being available. High-value opportunities:

| Feature | Channel | Impact |
|---------|---------|--------|
| Live station status | `station_reports` INSERT | Users see status updates without refreshing |
| Connector availability | `connectors` UPDATE | Real-time availability on station detail page |
| Booking confirmations | `bookings` UPDATE | Push notification when booking status changes |
| Community station verification | `submitted_stations` UPDATE | Counter updates live as others verify |
| Wallet balance | `wallets` UPDATE | Instant balance update after payment |

**Implementation sketch:**
```typescript
// Subscribe to real-time station report updates
const channel = supabase
  .channel('station-reports')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'station_reports',
  }, (payload) => {
    // Update local cache with new report
    updateLiveStatus(payload.new.station_id, payload.new);
  })
  .subscribe();
```

### 9.3 WebSocket Considerations

For real-time connector status from providers (OCPP protocol), a WebSocket gateway would be needed. This is beyond Supabase Realtime and would require a dedicated service (e.g., Supabase Edge Function with Deno WebSocket, or a separate Node.js service).

---

## 10. Missing Backend Features

### 10.1 Critical for Launch

| Feature | Status | Why Critical |
|---------|--------|-------------|
| Server-side input validation | Missing | Prevent malicious data injection |
| Payment gateway integration | Stub only | Cannot accept real payments |
| Email verification | Disabled | Account security |
| Server-side rate limiting | Missing | Prevent abuse and cost overrun |
| Error reporting (Sentry) | Missing | Cannot diagnose production issues |
| API key rotation to server-side | Partially done | Anthropic key exposed in client |
| Database backup strategy | Supabase auto only | Need point-in-time recovery plan |

### 10.2 Important for Growth

| Feature | Status | Why Important |
|---------|--------|---------------|
| PostGIS spatial queries | Not used | Required for radius search at scale |
| Pagination on all list endpoints | Missing | Memory and bandwidth optimization |
| Background sync service (cron) | Edge Function exists, not scheduled | Station data goes stale |
| Push notifications | Table exists, no delivery | User engagement |
| Admin dashboard API | No admin endpoints | Cannot manage content |
| Audit logging | `ai_interactions` only | Need full audit trail |
| GDPR data export/deletion | Missing | Legal requirement |

### 10.3 Nice to Have

| Feature | Status | Notes |
|---------|--------|-------|
| GraphQL API | Not implemented | Would improve client flexibility |
| Webhook system for providers | Not implemented | Real-time OCPP integration |
| A/B testing framework | Not implemented | Optimize AI prompts and UX |
| Analytics pipeline | `station_analytics` table empty | Need ETL from sessions to analytics |
| Multi-language content | `preferred_lang` column exists | Backend supports it, not implemented |

---

## Top 10 Backend Priorities

Ranked by **impact x urgency**, with estimated effort.

| # | Priority | Impact | Effort | Details |
|---|----------|--------|--------|---------|
| **1** | **Remove client-side Anthropic API key** | CRITICAL | 2 hours | Delete the `EXPO_PUBLIC_ANTHROPIC_API_KEY` fallback path in `claudeService.ts`. All Claude calls must go through the `ai-chat` Edge Function. This is a billing and security emergency. |
| **2** | **Fix `submitted_stations` RLS policy** | CRITICAL | 30 min | Change `UPDATE USING (true)` to `UPDATE USING (auth.uid() = submitted_by)` or restrict to admin role. Current policy allows any anonymous user to verify and promote stations to the main table. |
| **3** | **Add server-side validation on reports and submissions** | HIGH | 4 hours | Create an Edge Function or Postgres trigger that validates: lat/lng within Egypt bounds (22-31.5N, 25-35E), station_id format, comment length, and rate limits via a `user_submissions` counter table. |
| **4** | **Implement pagination on station queries** | HIGH | 6 hours | Add `LIMIT/OFFSET` or cursor-based pagination to `_getStationsFromSupabase()`. Return 50 stations max per request, sorted by distance (requires PostGIS or server-side Haversine). This is the single biggest scalability fix. |
| **5** | **Secure the payment Edge Function** | HIGH | 8 hours | Add JWT auth verification, idempotency keys, row-level locking (`SELECT ... FOR UPDATE`), and input validation. Even without a real gateway, the balance-update logic must be atomic. |
| **6** | **Enable PostGIS and spatial indexing** | HIGH | 4 hours | `CREATE EXTENSION postgis;` then add a `geography` column to stations, create a GIST index, and migrate distance queries server-side. This eliminates client-side Haversine and enables true radius search. |
| **7** | **Schedule the sync-ocm-stations Edge Function** | MEDIUM | 1 hour | Use Supabase cron (`pg_cron`) to run the sync function daily. Currently, station data only updates when manually triggered. Stale data erodes user trust. |
| **8** | **Add Supabase Realtime for station reports** | MEDIUM | 4 hours | Subscribe to `station_reports` INSERT events to provide live status updates. This is the highest-value real-time feature and requires minimal backend changes since the table already exists. |
| **9** | **Implement error reporting and structured logging** | MEDIUM | 3 hours | Integrate Sentry or a similar service. Replace all `console.warn` calls with structured error reporting. Add request ID tracking to Edge Functions for debugging. |
| **10** | **Label or replace fabricated analytics** | MEDIUM | 4 hours | Either clearly mark `vehicleAnalysisService` output as simulated estimates, or remove it and redirect users to the `ai-battery-health` Edge Function which uses actual (if sparse) session data. Presenting seeded random numbers as "AI analysis" is a trust liability. |

---

## Appendix: Data Quality Summary from Live Database

```
Table Counts:
  stations:           435    connectors:       518
  providers:           12    station_reports:   31
  user_profiles:        8    vehicles:           4
  wallets:              8    bookings:           0
  charging_sessions:    0    transactions:       0
  reviews:              0    ai_interactions:    0

Data Quality Checks:
  Stations without coordinates:    0  (PASS)
  Stations without name:           0  (PASS)
  Stations without provider:       0  (PASS)
  Stations without connectors:     0  (PASS)
  Connectors with zero power:      0  (PASS)
  Duplicate station names:         3  (WARN - 15 stations affected)
  Inactive stations:               1  (OK)
  Test data in production:         1  (FAIL - station_id='test' in reports)

Provider Distribution:
  Infinity EV:      330 (76%)  -- Verify this is real, not a default
  Elsewedy Plug:     44 (10%)
  Revolta Egypt:     24 (6%)
  Sha7en:            13 (3%)
  IKARUS:            10 (2%)
  Others:            13 (3%)

Connector Types:
  Type2:  435 (84%) avg 22kW @ 2.90 EGP/kWh
  CCS:     83 (16%) avg 60kW @ 3.50 EGP/kWh
```

---

*Report generated by Backend Architect Agent. All findings based on source code review and live database queries against the `plpwojwnzueigukmjidw` Supabase project.*
