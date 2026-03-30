# WattsOn — Project Context for AI Assistants

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
