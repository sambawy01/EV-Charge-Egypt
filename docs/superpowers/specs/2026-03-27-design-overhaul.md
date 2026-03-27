# EV Charge Egypt — Design Overhaul Spec

**Date:** 2026-03-27
**Goal:** Transform the app from generic mint-green startup template into a sleek, dark-mode-first, tech-forward EV platform with AI character. Tesla/Rivian energy — premium automotive tech feel.

---

## Color System

### Dark Mode (Default)

| Token | Hex | Usage |
|---|---|---|
| `background` | `#0A0E1A` | App background, deep navy-black |
| `surface` | `#141B2D` | Cards, panels, modals |
| `surfaceSecondary` | `#1C2438` | Input fields, secondary containers |
| `surfaceTertiary` | `#232B42` | Nested elements, hover states |
| `border` | `#2A3350` | Dividers, card borders |
| `borderFocus` | `#00D4FF` | Focused input borders |
| `primary` | `#00D4FF` | Electric cyan — buttons, links, active states |
| `primaryDark` | `#0095CC` | Pressed state, gradient end |
| `primaryGlow` | `rgba(0, 212, 255, 0.15)` | Glow behind key interactive elements |
| `secondary` | `#00FF88` | Electric green — available status, success, charging |
| `secondaryDark` | `#00CC6A` | Pressed state for green elements |
| `secondaryGlow` | `rgba(0, 255, 136, 0.12)` | Glow behind status indicators |
| `text` | `#F0F4FF` | Primary text, near-white with blue tint |
| `textSecondary` | `#8892B0` | Muted slate, labels, captions |
| `textTertiary` | `#5A6482` | Placeholder text, disabled labels |
| `error` | `#FF4D6A` | Errors, occupied status |
| `warning` | `#FFB020` | Warnings, partial availability |
| `success` | `#00FF88` | Aliases secondary |
| `info` | `#00D4FF` | Aliases primary |
| `statusAvailable` | `#00FF88` | Station available |
| `statusCharging` | `#00D4FF` | Actively charging |
| `statusPartial` | `#FFB020` | Some bays available |
| `statusOccupied` | `#FF4D6A` | All bays occupied |
| `statusOffline` | `#5A6482` | Station offline |
| `white` | `#FFFFFF` | |
| `black` | `#000000` | |

### Light Mode

| Token | Hex | Usage |
|---|---|---|
| `background` | `#F4F6FB` | Light gray-blue background |
| `surface` | `#FFFFFF` | Cards, panels |
| `surfaceSecondary` | `#EEF1F8` | Input fields, secondary containers |
| `surfaceTertiary` | `#E4E8F2` | Nested elements |
| `border` | `#D0D5E3` | Dividers |
| `borderFocus` | `#00A8CC` | Focused inputs (slightly darker cyan for contrast) |
| `primary` | `#00A8CC` | Cyan adjusted for light backgrounds |
| `primaryDark` | `#007A99` | Pressed |
| `primaryGlow` | `rgba(0, 168, 204, 0.10)` | |
| `secondary` | `#00CC6A` | Green adjusted for light backgrounds |
| `secondaryGlow` | `rgba(0, 204, 106, 0.10)` | |
| `text` | `#0A0E1A` | Primary text |
| `textSecondary` | `#5A6482` | Labels |
| `textTertiary` | `#8892B0` | Placeholders |
| `error` | `#E53E5C` | |
| `warning` | `#E09A00` | |

Accents (primary cyan, secondary green, status colors) stay consistent across modes — only adjusted for contrast.

---

## Typography

### Font Stack
- **Headers (h1, h2, h3):** Space Grotesk (bold/semibold, letter-spacing: -0.5px)
- **Body, captions, buttons:** System font (SF Pro on iOS, Roboto on Android)

### Scale

| Token | Font | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| `h1` | Space Grotesk | 32 | 700 | 38 | -0.5 |
| `h2` | Space Grotesk | 24 | 700 | 30 | -0.5 |
| `h3` | Space Grotesk | 20 | 600 | 26 | -0.3 |
| `body` | System | 15 | 400 | 22 | 0 |
| `bodyBold` | System | 15 | 600 | 22 | 0 |
| `caption` | System | 13 | 400 | 18 | 0.1 |
| `small` | System | 11 | 400 | 16 | 0.2 |
| `button` | System | 15 | 600 | 20 | 0.3 |
| `mono` | Space Grotesk | 14 | 500 | 20 | 0 |

`mono` token is for data displays — kWh readings, prices, session timers.

---

## Spacing & Radii

Spacing stays the same (xs:4, sm:8, md:16, lg:24, xl:32, xxl:48).

### Border Radii (updated)

| Token | Value | Usage |
|---|---|---|
| `sm` | 8 | Small chips, badges |
| `md` | 12 | Buttons, inputs |
| `lg` | 16 | Cards |
| `xl` | 20 | Bottom sheets, modals |
| `full` | 9999 | Avatars, round indicators |

---

## Component Specs

### Card
- Background: `surface` (`#141B2D` dark / `#FFFFFF` light)
- Border: 1px `border` color
- Border-radius: `lg` (16px)
- No drop shadow in dark mode (borders define edges on dark backgrounds)
- Light mode: subtle shadow (0 2px 8px rgba(0,0,0,0.06))
- Active/pressed state: border shifts to `primary` with `primaryGlow` box-shadow

### Button (Primary)
- Background: linear gradient `#00D4FF` → `#0095CC` (left to right)
- Text: `#0A0E1A` (dark text on bright cyan)
- Border-radius: `md` (12px)
- Shadow: `0 0 20px rgba(0, 212, 255, 0.3)` (subtle cyan glow)
- Pressed: gradient darkens, glow intensifies slightly
- Disabled: opacity 0.4, no glow

### Button (Secondary)
- Background: `surfaceSecondary`
- Text: `primary` color
- Border: 1px `border`
- No glow

### Button (Outline)
- Background: transparent
- Border: 1.5px `primary`
- Text: `primary`

### Button (Ghost)
- Background: transparent
- Text: `primary`
- Hover/press: `primaryGlow` background

### Input Fields
- Background: `surfaceSecondary`
- Border: 1px `border`, transitions to `borderFocus` on focus
- Text: `text`
- Placeholder: `textTertiary`
- Border-radius: `md` (12px)
- Focus glow: `0 0 0 3px primaryGlow`

### Bottom Tab Bar
- Background: `surface` with top border `border`
- Active icon: `primary` (cyan)
- Inactive icon: `textTertiary`
- Active label: `primary`
- Inactive label: `textTertiary`
- No active indicator background — just color shift

### Station Markers (Map)
- Available: `secondary` (#00FF88) dot with pulse animation
- Charging: `primary` (#00D4FF) dot, steady
- Partial: `warning` (#FFB020) dot
- Occupied: `error` (#FF4D6A) dot
- Offline: `statusOffline` (#5A6482) dot, no pulse

### Bottom Sheet (Station Detail, Booking)
- Background: `surface`
- Handle bar: `border` color, 36px wide, 4px tall
- Border-radius top: `xl` (20px)
- Content uses standard text/spacing tokens

### Loading / Skeleton States
- Skeleton: `surfaceSecondary` with shimmer animation using `surfaceTertiary`
- Activity spinner: `primary` color

### Status Badges
- Rounded pill shape (borderRadius: `full`)
- Background: status color at 15% opacity
- Text: status color at full
- Example: available badge = `rgba(0, 255, 136, 0.15)` bg, `#00FF88` text

---

## Screen-Specific Notes

### Map Screen
- Map tiles remain standard (Leaflet/Google Maps)
- Bottom sheet overlay and search bar get dark treatment
- Search bar: `surfaceSecondary` background, `border` border, `primary` search icon
- Filter chips: `surfaceSecondary` bg, `text` label; active = `primaryGlow` bg, `primary` text + border

### Wallet Screen
- Balance card: gradient background `#141B2D` → `#1C2438` with subtle `primaryGlow` border
- Balance amount: `h1` in `primary` color (big cyan number)
- Transaction items: `surface` cards with status-colored left accent line (3px)

### AI Assistant Screen
- Chat bubbles: user = `primary` gradient bg with dark text; AI = `surface` bg with `text` color
- Typing indicator: 3 dots pulsing in `primary`
- Input bar: `surfaceSecondary` with `border`, send button `primary` gradient

### Profile Screen
- Avatar ring: 2px `primary` border with `primaryGlow`
- Stats cards: `surface` with `mono` typography for numbers
- Settings items: `surface` rows with `border` separators

### Charging Session Screen
- Circular progress: `primary` (cyan) animated ring on `surfaceSecondary` track
- kWh/cost readouts: `mono` typography, `secondary` (green) for energy, `primary` for cost
- Timer: `h2` in `text` color

---

## Light Mode Behavior

- User toggles in Settings screen
- Preference saved to AsyncStorage
- All tokens swap via a theme context provider
- Components reference tokens, never hardcoded hex values
- Map tiles unaffected

---

## Font Loading

- Space Grotesk loaded via `expo-font` at app startup
- Loaded weights: 600 (SemiBold), 700 (Bold)
- Fallback while loading: system font with same sizes
- App shows splash screen until fonts + auth check complete

---

## Files to Modify

1. `src/core/theme/colors.ts` — complete rewrite with dark/light token maps
2. `src/core/theme/typography.ts` — Space Grotesk headers, updated scale
3. `src/core/theme/spacing.ts` — updated border radii
4. `src/core/theme/index.ts` — add ThemeProvider, useTheme hook, mode toggle
5. `src/core/components/Button.tsx` — gradient primary, glow effects
6. `src/core/components/Card.tsx` — dark surface, border-based, no shadow in dark
7. `src/core/components/Header.tsx` — dark background, cyan accents
8. `src/core/components/Badge.tsx` — status badge pill style
9. `src/core/components/LoadingScreen.tsx` — dark bg, cyan spinner
10. `App.tsx` — load Space Grotesk font, wrap in ThemeProvider
11. All screens — replace hardcoded colors with theme tokens
12. `src/navigation/*` — dark tab bar, cyan active states
