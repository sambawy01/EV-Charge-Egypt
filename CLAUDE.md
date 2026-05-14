# WattsOn — Project Context for AI Assistants

## Operating Rules — read before acting
Source: `docs/claude-operating-rules.pdf`. These govern how Claude Code works in this repo.

**Rule 1 — Think before coding.** No silent assumptions. State what you're assuming. Surface tradeoffs. Ask before guessing. Push back when a simpler approach exists.

**Rule 2 — Simplicity first.** Minimum code that solves the problem. No speculative features. No abstractions for single-use code. If a senior engineer would call it overcomplicated — simplify.

**Rule 3 — Surgical changes.** Touch only what you must. Don't "improve" adjacent code, comments, or formatting. Don't refactor what isn't broken. Match existing style.

**Rule 4 — Goal-driven execution.** Define success criteria. Loop until verified. Don't follow a fixed list of steps — work toward what success looks like and iterate until it's met.

**Rule 5 — Use the model only for judgment calls.** Use Claude for classification, drafting, summarization, extraction from unstructured text. Do NOT use Claude for routing, retries, status-code handling, deterministic transforms. If a status code already answers the question, plain code answers the question.

**Rule 6 — Token budgets are not advisory.** Per-task budget: 4,000 tokens. Per-session budget: 30,000 tokens. If a task is approaching budget, summarize and start fresh. Do not push through. Surfacing the breach > silently overrunning.

**Rule 7 — Surface conflicts, don't average them.** If two existing patterns in the codebase contradict, don't blend them. Pick one (the more recent / more tested), explain why, and flag the other for cleanup. "Average" code that satisfies both rules is the worst code.

**Rule 8 — Read before you write.** Before adding code in a file, read the file's exports, the immediate caller, and any obvious shared utilities. If you don't understand why existing code is structured the way it is, ask before adding to it. "Looks orthogonal to me" is the most dangerous phrase in this codebase.

**Rule 9 — Tests verify intent, not just behavior.** Every test must encode WHY the behavior matters, not just WHAT it does. A test like `expect(getUserName()).toBe('John')` is worthless if the function takes a hardcoded ID. If you can't write a test that would fail when business logic changes, the function is wrong.

**Rule 10 — Checkpoint after every significant step.** After completing each step in a multi-step task: summarize what was done, what's verified, what's left. Don't continue from a state you can't describe back. If you lose track, stop and restate.

**Rule 11 — Match the codebase's conventions, even if you disagree.** Use snake_case over your preferred camelCase if that's the convention; class-based over hooks if that's the convention. Disagreement is a separate conversation — inside the codebase, conformance > taste. If you genuinely think the convention is harmful, surface it. Don't fork it silently.

**Rule 12 — Fail loud.** If you can't be sure something worked, say so explicitly. "Migration completed" is wrong if 30 records were skipped silently. "Tests pass" is wrong if you skipped any. "Feature works" is wrong if you didn't verify the edge case asked about. Default to surfacing uncertainty, not hiding it.

## What is this?
WattsOn is Egypt's first AI-powered EV charging aggregator. One app to find, navigate to, and report on every EV charging station in Egypt.

**Live:** https://wattson-ev.vercel.app
**Repo:** https://github.com/sambawy01/EV-Charge-Egypt

## Tech Stack
- **Frontend:** React Native + Expo 55 (web + mobile)
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions, Realtime)
- **AI:** Anthropic Claude API (via Edge Functions)
- **Maps:** Google Maps JavaScript API (Directions, Places, Geocoding)
- **News:** Live RSS feeds (Electrek, InsideEVs, CleanTechnica, The Driven, Green Car Reports)
- **Hosting:** Vercel (web), Expo (native builds)
- **State:** Zustand + TanStack React Query
- **Font:** Space Grotesk
- **i18n:** Arabic + English (160+ keys, `useTranslation()` hook)

## Database (Supabase)
- **435 stations** across 16 governorates, 12 providers
- **329 EV models** from 88 brands
- **Tables:** stations, connectors, providers, user_profiles, station_reports, submitted_stations

## Key Features
1. **Google Maps** dark theme, 435 verified stations, split-pane desktop / full-screen mobile
2. **Community Status Reporting** — proximity-locked 100m, rate-limited, timestamped
3. **Claude AI Copilot** — real station data context, visual cards, conversation memory
4. **Trip Planner** — any route via geocoding + station corridor search
5. **Vehicle Dashboard** — AI battery health, consumption, 329 models
6. **EV News Magazine** — live RSS, futuristic layout
7. **Submit a Station** — crowdsourced, 3-verification to appear on map
8. **Proximity Popups** — arrive = report status, leave = rate (48h window)
9. **Responsive** — bottom tabs mobile (<768px), gradient top nav desktop

## Design System
- **Dark mode default:** `#0A0E1A` background, `#141B2D` surface
- **Primary:** `#00D4FF` (electric cyan)
- **Secondary:** `#00FF88` (fluorescent green)
- **Accent:** `#D946EF` (magenta) for gradient borders
- **Typography:** Space Grotesk Bold/SemiBold everywhere
- **All colors via `useTheme()`** — never hardcode hex values

## File Structure
```
src/
├── core/           # Shared: auth, services, stores, theme, i18n, data
├── driver/         # Driver screens + components
├── fleet/          # Fleet manager screens
└── navigation/     # RootNavigator, DriverNavigator, FleetNavigator
screens/auth/       # Welcome, Login, Register
supabase/           # Migrations, Edge Functions
docs/               # Specs, plans, reports, proposals
```

## Important Patterns
- Use `useTheme()` for all colors — supports dark/light mode
- Use `useTranslation()` for all user-facing strings
- Station reports require 100m proximity check
- Ratings available for 48h after visiting
- Map loads from Supabase only (no OCM/Google in hot path)
- The `stationReportService` has client-side rate limiting (5/min)

## API Keys (in .env, never committed)
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_SUPABASE_SERVICE_KEY`
- `EXPO_PUBLIC_GOOGLE_MAPS_KEY`
- `EXPO_PUBLIC_ANTHROPIC_API_KEY`

## Deploy
```bash
npx expo export --platform web
cd dist && vercel deploy --prod --yes
vercel alias <deployment-url> wattson-ev.vercel.app
```

## Owner
Hany Sambawy — sambawy@gmail.com
