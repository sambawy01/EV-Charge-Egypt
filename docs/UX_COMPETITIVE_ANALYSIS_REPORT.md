# EV Charging App UX Competitive Analysis Report

**Research Date**: March 2026
**Researcher**: UX Research Agent
**Subject**: Comparative UI/UX analysis of 10 leading EV charging apps
**Purpose**: Inform design decisions for EV Charge Egypt

---

## Executive Summary

This report analyzes the UI/UX patterns of the world's leading EV charging and aggregator apps to identify best practices, common patterns, and innovative approaches. The findings are mapped against EV Charge Egypt's current implementation to produce specific, actionable design recommendations.

**Key Takeaways:**
1. Full-screen map with bottom sheet is the dominant and most effective layout pattern
2. Bottom tab navigation (mobile) with side rail (desktop) is the industry standard
3. Dark mode is the default for premium EV apps; cyan/teal accent colors dominate
4. Station markers should encode status (color) AND network (icon/logo) simultaneously
5. Filter chips exposed inline on the map screen reduce friction dramatically vs modal filters
6. Station cards use a strict 3-tier information hierarchy: name+provider, then power+distance, then price+availability

---

## 1. A Better Routeplanner (ABRP)

### Map Screen Layout
- **Full-screen map** is the dominant element; the entire viewport is the map
- On desktop/web: uses a **left sidebar panel** (roughly 320-360px) overlaid on the full-screen map for route inputs, settings, and charger details
- On mobile: uses a **bottom sheet pattern** that slides up from the bottom
- The map fills 100% of the viewport with controls overlaid on top
- Charger network markers use **actual provider logos/icons** on the map for instant network recognition (Shell, Ionity, Tesla, etc.)
- Version 4.6.0 introduced a "refreshed screen layout for large and small screens" with cleaner menu panels

### Station Markers
- Custom markers showing **network logos** (not generic pins)
- Color coding indicates charger speed/type rather than availability
- Cluster markers at low zoom levels that expand when zooming in

### Navigation Pattern
- Web: Sidebar-first with map as the canvas. No traditional tabs. The sidebar contains all route planning, settings, and charger info
- Mobile: Minimal chrome. The map IS the app. Bottom sheet for details
- Route planning is the primary interaction, not station browsing

### Visual Design
- Light mode default on web, with dark mode support (`prefers-color-scheme: dark`)
- Clean, utilitarian aesthetic -- function over decoration
- Uses React Native Web framework (flexbox layout, safe area insets)
- Minimal use of gradients or visual embellishment
- The map itself provides the visual richness

### Unique Features
- **Route-centric design**: Everything revolves around the route, not individual stations
- Charger amenity search (food, rest stops, bathrooms near chargers)
- Charger reliability info with opening hours and latest successful charges
- Pre-trained models for accessories (trailers, roof boxes) affecting range

### Relevance to EV Charge Egypt
ABRP's sidebar-on-desktop approach validates our side nav rail concept, but ABRP uses a much wider sidebar (320px+) that contains actual content, not just navigation icons. Their route-centric model is ideal for trip planning but less relevant for our station-finder use case.

---

## 2. PlugShare

### Map Screen Layout
- **Full-screen map** as the primary view with pins/markers covering the viewport
- Search bar overlaid at the top of the map
- Station details appear in a **bottom sheet / half-sheet** on mobile
- On web (plugshare.com): full-screen map with a **collapsible left panel** showing station list and filters
- Supports both map view and list view, toggleable

### Station Markers (Color Coding System)
This is the most detailed marker system in the industry:
- **Green pins**: Public Level 1 and Level 2 charging locations
- **Orange pins**: Public fast charging (CHAdeMO, CCS, Tesla Superchargers)
- **Brown pins**: Restricted access / no public charging
- **Grey pins**: Stations where all/most ports are currently in use (occupied)
- **Blue house icons**: Residential stations shared by PlugShare users
- **Wrench symbol**: Coming soon or under repair
- Numbers on markers indicate number of charge points at that location

### Station Cards
- Station name and network prominently displayed
- Connector types listed with icons
- Community rating score (stars) and number of check-ins
- Photos uploaded by users
- Distance from current location
- Real-time availability status

### Navigation Pattern
- Web: Full-screen map with left sidebar, top search bar
- Mobile: Bottom tabs for Map, Trips, Activity, Profile
- Quick filters accessible from the map screen
- Filter categories: connector type, charging speed, amenities, network, cost

### Visual Design
- Light mode default with clean, utilitarian colors
- Green as the primary brand/accent color
- Standard Google Maps styling underneath
- Some users perceive the map UI as "outdated" compared to modern alternatives
- Recent updates added quick filters and enhanced location details

### Unique Features
- Community-driven data (check-ins, photos, reviews)
- Residential charger sharing (unique blue house markers)
- Trip planning with automatic charging station selection along route
- Amenity information (nearby hotels, restaurants, rest stops)

### Relevance to EV Charge Egypt
PlugShare's color-coded marker system is excellent and directly applicable. Our current StationMarker uses status colors (available/partial/occupied/offline) which maps well to PlugShare's grey-for-occupied approach. However, we should consider encoding charger speed/type in the marker design too, as PlugShare does with green vs orange for Level 2 vs DC fast.

---

## 3. ChargePoint

### Map Screen Layout
- Full-screen map with **station pins showing real-time availability**
- Search bar at top with **exposed filter pills/chips** below it (not hidden in a modal)
- Integrated map + list view -- users can toggle between map and list
- Station details in a **half-sheet** that slides up from bottom
- Map key educates users about pin meanings (addressing confusion found in research)

### Station Cards
- Speed displayed using **both lightning bolts (visual) AND kilowatts (numeric)** to serve both novice and advanced users
- Compatibility labels reduce cognitive load
- For multi-connector stations, Side A and Side B labels
- Pricing estimates shown as time-based cost rather than kWh to help new drivers
- Prominent "Start Charge" button in station details

### Navigation Pattern
- **Bottom tabs** (replaced hamburger menu in redesign -- key accessibility improvement)
- Main tabs: Home (map), My Spots (favorites/recents), Activity, Account
- Previously buried features like "My Spots" and "Recents" were surfaced to tabs because analytics showed high traffic despite poor discoverability
- Two-tab sub-navigation within detail pages for information density management

### Visual Design
- Moved away from old gray-blue palette to a new accessible color system
- All components meet **WCAG contrast requirements** (the old app had zero compliance)
- Bright colors for functional elements, muted grays for non-essential features
- Material Design principles on Android, native patterns on iOS
- Generic reusable card design that accommodates stations, connections, and saved locations

### Unique Features
- **3x faster map performance** after redesign
- Predictive search with auto-fill
- Only shows stations compatible with user's registered vehicle
- Satellite view to find stations down to the parking spot
- Popular charging times display (like Google Maps busy hours)

### Relevance to EV Charge Egypt
ChargePoint's decision to move from hamburger menu to bottom tabs is validated by analytics and directly applicable. Our current side nav rail on web is similar to their pre-redesign state where features were "buried." The exposed filter chips on the map screen is a critical improvement over our current modal-based filter approach. The dual representation of speed (visual + numeric) is an excellent pattern for Egypt's mixed-experience user base.

---

## 4. Electrify America

### Map Screen Layout
- Full-screen map with station markers
- **Auto-shows station card** when user is physically near a charging station (geofence trigger)
- Station cards use a **tab layout** for faster charger selection and session start
- Coming soon and offline stations are hidden from the nearby list (reduces clutter)
- Real-time charger status visible without login

### Station Cards
- Charger ID number prominently displayed (for physical identification at the station)
- Connector types: CCS, CHAdeMO, Level 2, NACS
- Real-time availability with visual status indicators
- Improved visuals for charger status in recent updates
- State of charge (SOC) display during charging sessions
- Custom notifications for compatible vehicles

### Navigation Pattern
- Bottom tab navigation on mobile
- Settings accessible in Account tab
- Dark mode available as a setting
- Contactless payment flow: tap charger or swipe phone screen
- CarPlay and Android Auto integration

### Visual Design
- Supports **Dark Mode** (toggle in settings)
- Clean, modern design language
- Emphasis on real-time data visibility
- Charging session visualization shows energy delivered, start times, charging speed
- Cost tracking displays during active sessions

### Unique Features
- **Geofence-triggered station cards** -- proactive UI based on location
- Real-time charger data integrated into Google Maps (2025)
- No login required to view station status
- Contactless payment at the charger
- Charging history with energy delivered and session details

### Relevance to EV Charge Egypt
The geofence-triggered station card is an innovative pattern worth considering for future versions. The tab-based station card layout for faster session starts is directly applicable. Hiding offline/coming-soon stations from the list view is a simple but effective UX improvement we should implement. Their dark mode implementation confirms our dark-first approach is aligned with premium EV apps.

---

## 5. Shell Recharge

### Map Screen Layout
- Full-screen map with **circular station markers**
- Markers show: number of ports in center, green ring for available ports, orange ring for in-use ports (donut/ring progress visualization)
- Nearby sites list overlaid on the map
- Filter by power level, connector type, and real-time availability

### Station Markers
- **Donut/ring markers**: Circle with number of ports, color-coded ring showing availability ratio
  - Green ring segment = available ports
  - Orange ring segment = ports in use
  - This provides at-a-glance capacity information without tapping

### Navigation Pattern
- Map-first approach
- RFID card integration for session start
- In-app charging start/stop
- Filters for power level, connector type, availability

### Visual Design
- Shell brand yellow/red accents on clean white backgrounds
- Consistent style guide created in collaboration with Shell's brand team
- Design based on extensive field research (visiting charging stations in London)
- Prototyped in Proto.io before development
- User testing conducted with recruited EV drivers at lab facilities

### Unique Features
- **Ring/donut availability visualization on markers** -- shows capacity at a glance
- Extensive field research informing design decisions
- Comprehensive onboarding flow
- RFID card + app dual interaction model
- Cross-country coverage with consistent experience

### Relevance to EV Charge Egypt
Shell Recharge's donut/ring marker design is perhaps the most information-dense marker pattern discovered in this research. Instead of just showing status color, it shows the RATIO of available vs occupied ports. This is superior to our current binary status marker. Their field research methodology (visiting actual stations) should inform our own research in Egyptian cities.

---

## 6. Chargemap

### Map Screen Layout
- Interactive full-screen map as the primary interface
- Over 1 million charge points mapped across Europe
- Real-time availability indicators on the map
- CarPlay and Android Auto integration for in-vehicle display
- Known issue: Route screen UI not optimized for small screens (half screen consumed by header image)

### Station Cards
- Connector types and power ratings displayed
- Time slots and means of access
- Community scores and comments
- Network information (compatible with Chargemap Pass or not)
- Reviews from other drivers

### Filtering
- Comprehensive filter system: free stations, highest scoring, nearby services
- Network-specific filters (favorite networks, Chargemap Pass compatible)
- Connector type and power rating filters
- Amenity-based filtering

### Visual Design
- Clean European design aesthetic
- Green as primary brand color
- Community-driven content (reviews, comments, scores)
- Photo gallery per station from user contributions

### Unique Features
- **Chargemap Pass** integration (single RFID card for multiple networks)
- Community scoring system with detailed reviews
- Time-slot availability information
- European multi-network aggregation

### Relevance to EV Charge Egypt
Chargemap validates the aggregator model with a physical pass (RFID) which is analogous to our planned wallet/payment aggregation for Egyptian networks. Their community scoring and review system is mature and should inform our review feature design. The small-screen issue with their Route page is a cautionary tale about header images consuming precious mobile viewport space.

---

## 7. Octopus Electroverse

### Map Screen Layout
- Full-screen map with station markers
- **Map toggle** to switch between "all chargers" and "Electroverse-compatible chargers"
- Filters accessible from the map for speed, socket type, and network preference
- Detailed charger information panel with live availability

### Station Cards
- Live charger availability status
- Renewable energy icon (100% green energy indicator)
- Charging costs displayed
- Parking restrictions noted
- Network operator information

### Filtering
- Socket type filters
- Minimum charging point count filter
- Speed filters
- Network-specific filters
- Access method filters: Electrocard, App, Plug & Charge, Contactless
- Users have requested price-based filtering (not yet available)

### Visual Design
- Clean, modern interface (won Best EV Charging App 2025, Mobile Innovation 2024)
- Octopus Energy brand identity (playful, approachable)
- Focus on simplicity and clarity

### Navigation Pattern
- Map-first design
- Route planner with plotted charging stops
- In-app charging: plug in, tap "start charge"
- One-card / one-app philosophy

### Unique Features
- **Renewable energy indicator** on stations
- 1 million+ chargers across 40+ countries, 1200+ networks
- Single-card access across all networks (Electrocard)
- Route planner integrated into the map experience
- Award-winning UX (multiple industry awards)

### Relevance to EV Charge Egypt
Electroverse's "one app, one card" positioning is exactly the aggregator model EV Charge Egypt should aspire to. Their map toggle (all chargers vs compatible chargers) is a useful pattern when some stations require different access methods. The renewable energy indicator is forward-thinking and could differentiate us as Egypt builds out solar-powered charging infrastructure.

---

## 8. Tesla App

### Map Screen Layout
- Full-screen map with Supercharger pins
- **3D Supercharger Site Maps** (2025 Holiday Update): real-time 3D view showing actual physical layout of the charging site
  - Shows each stall's availability
  - Indicates disabled stalls, occupied spots, vehicle facing direction, towing stalls
  - Displays nearby businesses
- Map is deeply integrated with navigation; charging is part of the route, not a separate task

### Station Information
- Real-time stall availability per site
- Charger type identification in-vehicle UI (update 2025.38)
- Parking fee hints displayed above the navigation map
- Access codes and floor information shown upon arrival
- Countdown timer with valet service departure info

### Charging Visualization
- **Color-coded charging cable animation**:
  - Blue = charger establishing connection
  - Green = active charging
- New charging visualizations appear for any charger type (not just Tesla)
- State of charge prominently displayed

### Navigation Pattern
- No traditional bottom tabs for the in-car interface; voice + touch navigation
- Mobile app: bottom tabs (Vehicles, Climate, Charging, Controls, Service)
- Map allows hiding details for clean view
- Multi-stop route planning

### Visual Design
- **Dark mode by default** (the benchmark for premium dark UI)
- Neumorphism and glassmorphism design elements
- Subtle animations (charging cable color transitions)
- Minimal, premium aesthetic with generous whitespace
- High contrast for outdoor readability in the vehicle
- Custom tab bar with curve and neon light effects (in design concepts)

### Unique Features
- **3D site maps** showing actual physical layout of charging stations
- Cable color animation indicating charging state
- Proactive notifications (parking fees, access codes, departure countdown)
- Deep vehicle integration (SoC, range, climate)
- Works with any charger type, not just Tesla

### Relevance to EV Charge Egypt
Tesla sets the benchmark for premium feel. Their 3D site maps are aspirational but not feasible for our current scope. However, the charging cable color-state animation and proactive notifications are implementable patterns. Tesla's dark mode is the industry gold standard that validates our dark-first color system. Their minimalist approach with generous whitespace should influence our UI density decisions.

---

## 9. Rivian App

### Map Screen Layout
- Map integrated with trip planning and charging discovery
- Send-to-vehicle functionality from mobile app
- Energy app with **two-tab layout**: Charging (energy inflow) and Energy Monitor (energy outflow)
- Repeatable layout with **left/center/right panes** for consistent experience across vehicle and mobile

### Visual Design
- **Cel-shaded / cartoon style** for 2025 model year (high-contrast, high-edge-intensity, moving away from photorealistic)
- Subtle animations: flickering campfire, flapping birds on the horizon
- For upcoming R2: **softer, more refined** design with rounded corners everywhere, floating modal windows, completely rethought modern layout
- Sharp edges replaced with curves
- Premium feel through unique art direction rather than pure minimalism

### Navigation Pattern
- Consistent left/center/right pane layout across screens
- Tab-based sub-navigation within sections
- Smart charging scheduling for off-peak hours

### Unique Features
- **Cel-shaded design language** (unique in the industry)
- Plug & Charge for Electrify America and IONNA networks
- Smart charge scheduling for cost optimization
- Energy monitoring with detailed inflow/outflow tracking
- Consistent design vocabulary between in-car and mobile app

### Relevance to EV Charge Egypt
Rivian demonstrates that premium feel does not require photorealism -- their cel-shaded approach proves that a distinctive visual identity creates stronger brand recognition than generic flat design. The left/center/right pane layout with tab navigation is a mature pattern for organizing complex information. Their smart scheduling for off-peak hours aligns with our cost optimizer feature.

---

## 10. Bonnet

### Map Screen Layout
- **Map and list section** with easy toggle between views
- Both map and list have filter options
- Real-time status indicators on map markers
- Bold, eye-catching color scheme that is "immediately appealing"
- Easy to navigate "without compromising function over style by hiding things in layers of menus"

### Station Cards
- Last used status (when charger was last used)
- Current availability status
- In-use indicators
- Unavailable indicators
- Network operator shown
- Per-kW pricing from the network

### Filtering
- Cable type filter
- Charge speed filter
- Availability filter
- **Number of charge points** at a location (unique filter)
- **Hide taxi charge points** (unique filter for UK market)
- Network preference filter

### Visual Design
- **Bold, vibrant color scheme** as a key differentiator
- Modern, clean layout
- No deep menu hierarchies -- features are surfaced, not buried
- Style and function balanced carefully
- Premium feel through color confidence rather than minimalism

### Navigation Pattern
- Map-first with list alternative
- In-app payment (no service fee, pricing set by network)
- Subscription tiers (Light Boost 10% off, Turbo Boost 15% off)
- Simple: find charger, plug in, tap to start

### Unique Features
- **No service fee** -- transparent network pricing
- Subscription discount model (Boost tiers)
- Unique filters (charge point count, hide taxi chargers)
- 400,000+ chargers, 600+ networks in single app
- Acquired by OVO Energy (now OVO Charge)

### Relevance to EV Charge Egypt
Bonnet's philosophy of "not hiding things in layers of menus" is a critical design principle. Their bold color approach validates our use of vibrant cyan (#00D4FF) as primary accent on dark backgrounds. Their subscription discount model (Boost tiers) is directly applicable to our monetization strategy. The unique filters (charge point count, hide specific types) show that market-specific filters add real value.

---

## Cross-App Pattern Analysis

### Map Screen Layout Consensus

| Pattern | Apps Using It | Recommendation |
|---------|--------------|----------------|
| Full-screen map | ALL 10 apps | **Adopt** -- Map should fill viewport |
| Bottom sheet for details | ABRP, PlugShare, ChargePoint, EA, Tesla | **Adopt** on mobile |
| Left sidebar on desktop | ABRP, PlugShare (web) | **Consider** for desktop web |
| Search overlay on map | ALL 10 apps | **Already implemented** |
| Exposed filter chips | ChargePoint, Bonnet, Electroverse | **Adopt** -- Replace modal-only filters |

### Station Marker Design Consensus

| Pattern | Apps Using It | Recommendation |
|---------|--------------|----------------|
| Color = status | PlugShare, ChargePoint, EV Charge Egypt | **Keep** but enhance |
| Color = charger speed | PlugShare (green=L2, orange=DC) | **Add** as secondary encoding |
| Network logo on marker | ABRP, Shell | **Add** provider logos |
| Ring/donut capacity | Shell Recharge | **Consider** for information density |
| Count on cluster | PlugShare, Shell | **Add** station count on clusters |

### Navigation Pattern Consensus

| Pattern | Apps Using It | Recommendation |
|---------|--------------|----------------|
| Bottom tabs (mobile) | ChargePoint, EA, PlugShare, Tesla | **Adopt** for mobile |
| Side rail (desktop) | EV Charge Egypt (current) | **Keep** but widen |
| Hamburger menu | NONE of the leaders anymore | **Avoid** |
| 4-5 primary tabs | ALL tab-based apps | **Keep** 5-tab structure |

### Color and Visual Design Consensus

| Pattern | Apps Using It | Recommendation |
|---------|--------------|----------------|
| Dark mode default | Tesla, Rivian, Bonnet, EA (optional) | **Keep** dark-first |
| Cyan/teal accent | Tesla, EV Charge Egypt | **Keep** -- industry-aligned |
| Green = available | ALL 10 apps | **Keep** current palette |
| Red/pink = occupied | ALL 10 apps | **Keep** current palette |
| Orange/amber = partial | Most apps | **Keep** current palette |

---

## Current EV Charge Egypt Assessment

### What We're Doing Well

1. **Dark mode first**: Our `#0A0E1A` background with `#00D4FF` cyan accent is industry-aligned with Tesla and premium EV apps
2. **Status color system**: Our 4-status model (available/partial/occupied/offline) with green/amber/red/grey is consistent with industry standards
3. **Typography choices**: SpaceGrotesk for headings gives a tech/modern feel; system fonts for body text ensure readability
4. **Station card information hierarchy**: Name, address, then power/price/rating meta row is well structured
5. **Filter categories**: Connector type, speed, price, amenities cover the essential filters
6. **Side nav rail with 5 tabs**: The tab structure (Map, Bookings, AI, Wallet, Profile) is appropriate

### What Needs Improvement

#### Priority 1: Map Layout (High Impact)

**Current state**: Map on top (~60% of viewport), station list panel fixed at bottom (280px collapsed, 520px expanded).

**Problem**: This split layout reduces the map viewport significantly and does not match ANY of the 10 analyzed apps. Every leading app uses a full-screen map with overlaid controls.

**Recommendation**: Switch to **full-screen map with draggable bottom sheet**. The map should fill 100% of the viewport. The station list should be a bottom sheet that:
- Collapsed: Shows a handle + "X stations nearby" header (peek height ~80px)
- Half-expanded: Shows 3-4 station cards (default state)
- Fully expanded: Full station list taking ~85% of viewport
- The map remains visible behind the sheet at all states

#### Priority 2: Exposed Filter Chips (High Impact)

**Current state**: Filters are accessible only through a modal (FilterModal) triggered by a gear icon.

**Problem**: ChargePoint's research proved that buried filters hurt discoverability. Modal filters add friction (tap, select, apply, close).

**Recommendation**: Add a **horizontal scrollable chip row** below the search bar showing key quick-filters:
- "DC Fast", "Level 2", "Available Now", "< 5 km"
- Tapping a chip toggles it immediately (no apply step)
- A "More Filters" chip at the end opens the full modal for advanced filtering
- This pattern is used by ChargePoint, Bonnet, Electroverse, and Google Maps

#### Priority 3: Station Marker Enhancement (Medium Impact)

**Current state**: Circle markers with provider initials (IK, SH, EP, KW, NE) colored by status.

**Recommendations**:
- Replace text initials with **actual provider logos** (tiny versions) -- ABRP and Shell both demonstrate this is more instantly recognizable
- Consider Shell Recharge's **donut ring** pattern: show available/total port ratio as a ring around the logo
- At low zoom levels, use **cluster markers** showing count of stations in an area
- Keep the status color coding but make it the ring/border rather than the fill

#### Priority 4: Desktop Web Layout (Medium Impact)

**Current state**: 72px side nav rail with emoji icons + labels. Map fills remaining space with bottom panel.

**Recommendations**:
- **Widen the side rail to a proper sidebar** (280-320px) on desktop screens (>1024px) -- follow ABRP and PlugShare web patterns
- The sidebar should contain: search, filter chips, station list, and quick actions
- Map fills the remaining viewport (no bottom panel on desktop)
- Side nav rail (72px) should remain only for **tablet** breakpoints
- Consider a **split-pane layout**: sidebar (list + filters) on left, full map on right
- PlugShare's web version and ABRP both use this pattern effectively

#### Priority 5: Bottom Tab Bar for Mobile (Medium Impact)

**Current state**: Side nav rail is used for all screen sizes.

**Recommendation**: Implement a **responsive navigation pattern**:
- Desktop (>1024px): Wide sidebar (280-320px) with labels and icons
- Tablet (768-1024px): Narrow side rail (72px) with icons + labels (current approach)
- Mobile (<768px): Standard bottom tab bar (per iOS/Android conventions)
- This matches ChargePoint, PlugShare, Electrify America, and Tesla's mobile patterns

#### Priority 6: Station Card Enrichment (Lower Impact)

**Current state**: Cards show name, address, power, price, rating, status badge, distance.

**Recommendations**:
- Add **connector type icons** (small visual icons for CCS, CHAdeMO, Type2) alongside the power rating
- Show **available ports / total ports** count (e.g., "3/5 available") -- inspired by Shell Recharge
- Add **provider/network logo** on the card (small, left-aligned)
- Consider showing **popular times** or **last successful charge time** (ChargePoint, ABRP patterns)
- For the expanded station detail, use **tab navigation** within the card (Info, Reviews, Photos) per Electrify America's pattern

---

## Detailed Design Recommendations for EV Charge Egypt

### 1. Revised Map Screen Architecture

```
MOBILE (<768px):
+------------------------------------------+
|  [Search Bar]  [Filter]                  |  <- Floating overlay, top
|  [DC Fast] [Available] [< 5km] [More...] |  <- Filter chip strip
|                                          |
|                                          |
|            FULL SCREEN MAP               |
|          (100% of viewport)              |
|                                          |
|                                          |
+------------------------------------------+
|  === (drag handle) ===                   |  <- Bottom sheet (collapsed)
|  83 stations nearby                      |
|  [Station Card 1]                        |  <- Peek shows 1-2 cards
+------------------------------------------+
|  [Map] [Bookings] [AI] [Wallet] [Me]    |  <- Bottom tab bar
+------------------------------------------+

DESKTOP (>1024px):
+------+----------------------------+----------------------+
| SIDE |  [Search Bar]              |                      |
| BAR  |  [DC Fast] [Avail] [More] |                      |
| 280px|  ________________________  |                      |
|      | | Station Card 1        | |    FULL SCREEN MAP   |
| Map  | | Station Card 2        | |   (fills remaining)  |
| Book | | Station Card 3        | |                      |
| AI   | | Station Card 4        | |                      |
| Wall | | Station Card 5        | |                      |
| Prof | | ...                   | |                      |
|      | |_______________________| |                      |
+------+----------------------------+----------------------+
```

### 2. Revised Station Marker Design

```
Current:
  [IK]  <- Circle with text initials, solid status color fill

Proposed:
  +--------+
  | [logo] |  <- Provider logo (12x12px) centered
  |        |  <- Ring border shows status color
  +--------+  <- Donut ring: green portion = available ratio
      V       <- Small arrow pointing down

Color encoding:
  - Ring/border: Status color (green/amber/red/grey)
  - Fill: White/dark (for logo contrast)
  - Ring thickness: Proportional to availability (thicker = more available)

Cluster markers (zoomed out):
  +----+
  | 12 |  <- Count of stations in cluster
  +----+  <- Muted color, expands on tap/zoom
```

### 3. Revised Station Card Design

```
+--------------------------------------------------+
|  [Provider Logo]  Station Name              [>]   |
|                   123 Street, Area                |
|  +------+ +------+ +------+                      |
|  | CCS  | | Type2| | CHdMO|  <- Connector icons  |
|  +------+ +------+ +------+                      |
|                                                   |
|  150 kW  ·  0.05 EGP/kWh  ·  3/5 available      |
|                                                   |
|  [Available ****]           2.3 km  ·  4.2 ★     |
+--------------------------------------------------+

Key changes:
- Provider logo on the left (not just text)
- Connector type mini-icons row
- "3/5 available" instead of just status badge
- Visual availability indicator (dots or mini bar)
```

### 4. Revised Filter UX

```
Inline chip strip (always visible below search):
+---------------------------------------------------+
| [DC Fast] [Available] [CCS] [< 5km] [+ Filters]  |
+---------------------------------------------------+

Tapping a chip toggles it instantly (no modal).
The [+ Filters] chip opens the full FilterModal for:
  - Detailed connector selection
  - Custom speed ranges
  - Price range
  - Amenities
  - Provider/network selection
  - Egypt-specific: Solar powered, Shade available
```

### 5. Premium Visual Polish Recommendations

Based on patterns from Tesla, Rivian, and Bonnet:

**Subtle glow effects**: Our `primaryGlow: rgba(0, 212, 255, 0.3)` is already defined but may be underused. Apply it to:
- Active/selected station markers
- The "Start Charge" button
- Active filter chips
- The currently-charging status indicator

**Micro-animations**: Following Rivian and Tesla patterns:
- Station markers should pulse gently when showing live availability
- Charging session screen should have animated energy flow visualization
- Bottom sheet should have spring physics for natural feel when dragging
- Status transitions (available -> occupied) should animate smoothly

**Typography refinement**: Our SpaceGrotesk headers + system body is solid. Consider:
- Using SpaceGrotesk-SemiBold for station names on cards (currently bodyBold with system font)
- Larger, bolder station count in the panel title
- Tabular/monospaced numbers for kW, price, and distance values (we have `typography.mono` defined for this)

**Information density**: Tesla and Rivian succeed with generous whitespace. Currently our station cards are compact. Consider:
- Increasing vertical padding in StationListItem
- Adding 2px more letter-spacing in meta text
- Using 16px card padding instead of the current `spacing.md`

---

## Implementation Priority Matrix

| Recommendation | Impact | Effort | Priority |
|---|---|---|---|
| Full-screen map + bottom sheet | Very High | Medium | P0 - Do first |
| Exposed filter chips on map | High | Low | P0 - Do first |
| Responsive nav (bottom tabs on mobile) | High | Medium | P1 - Do next |
| Enhanced station markers (logos + rings) | Medium | Medium | P1 - Do next |
| Desktop sidebar with station list | Medium | Medium | P2 - Plan for |
| Station card enrichment (connectors, port count) | Medium | Low | P2 - Plan for |
| Micro-animations and glow effects | Low-Medium | Low | P3 - Polish phase |
| Cluster markers at zoom levels | Low | Medium | P3 - Polish phase |

---

## Success Metrics

After implementing these recommendations, measure:

1. **Task completion rate**: Time from app open to "found a suitable station" (target: < 15 seconds)
2. **Filter usage rate**: Currently likely low due to modal-only access (target: 40%+ of sessions use at least one filter)
3. **Map interaction depth**: Average number of station markers tapped per session
4. **Station card to detail conversion**: Percentage of card views that lead to station detail views
5. **Return usage rate**: Weekly active users as a percentage of monthly active users

---

## Sources

- [A Better Routeplanner (ABRP)](https://abetterrouteplanner.com/)
- [ABRP 4.6.0 Update Notes](https://www.iternio.com/post/a-better-routeplanner-4-6-0)
- [PlugShare Map Icons](https://help.plugshare.com/hc/en-us/articles/6136612709267-PlugShare-Map-Icons)
- [PlugShare UX Redesign Case Study - Carolina Torres](https://medium.com/design-bootcamp/plugshare-improving-the-experience-of-the-most-used-ev-charging-app-99e4dc25bdcb)
- [PlugShare App Redesign - Ronas IT on Dribbble](https://dribbble.com/shots/16650768-PlugShare-App-Redesign)
- [PlugShare New Look Review - Electrek](https://electrek.co/2023/11/13/plugshare-app-new-look/)
- [ChargePoint App Redesign - Rachel Chang](https://rachelchang.net/charge/app.html)
- [ChargePoint UX Case Study - Sliced Bread](https://www.slicedbreaddesign.com/work/chargepoint)
- [ChargePoint New App Announcement](https://www.chargepoint.com/about/news/new-chargepoint-mobile-app-here/)
- [Electrify America Redesigned App](https://media.electrifyamerica.com/releases/132)
- [Electrify America Real-Time Google Maps Integration](https://www.electrive.com/2025/10/17/electrify-america-integrates-real-time-charger-data-into-google-maps/)
- [Shell Recharge App Design - Sean Hills](https://www.seanhillsdesign.com/shell-recharge-app)
- [Shell Recharge Network Guide - Zapmap](https://www.zapmap.com/ev-guides/public-charging-point-networks/shell-recharge-network)
- [Chargemap Mobile App](https://chargemap.com/en-gb/mobile)
- [Octopus Electroverse App Guide](https://electroverse.com/community/ev-blogs-and-guides/how-to-use-the-octopus-electroverse-app)
- [Octopus Electroverse Features](https://electroverse.com/community/ev-blogs-and-guides/octopus-electroverse-features-you-should-know)
- [Octopus Electroverse 1 Million Chargers](https://octopus.energy/press/electroverse-skyrockets-to-1-million-public-ev-chargers/)
- [Tesla 3D Supercharger Site Maps](https://evchargingstations.com/chargingnews/tesla-introduces-a-live-3d-supercharger-site-map/)
- [Tesla Charging Visualizations](https://www.notateslaapp.com/news/3331/a-look-at-all-of-teslas-new-charging-visualizations)
- [Tesla Supercharger UI Update](https://www.shop4tesla.com/en/blogs/news/tesla-supercharger-ui-update-details)
- [Rivian Software Update 2025.18](https://stories.rivian.com/software-update-2025-18)
- [Rivian Cel-Shaded UI](https://www.thedrive.com/news/rivians-new-cel-shaded-infotainment-update-is-cool-and-mandatory)
- [Rivian R2 UI Preview](https://riviantrackr.com/news/r2-ui-preview-shows-rivians-next-gen-design/)
- [Bonnet EV Charging App](https://www.joinbonnet.com/ev-charging-app)
- [Bonnet Review - Smart Home Charge](https://www.smarthomecharge.co.uk/reviews/bonnet/)
- [Bonnet OVO Acquisition](https://company.ovo.com/ovo-announces-acquisition-of-bonnet-to-bring-accessible-public-charging-to-millions-of-customers/)
- [EV Charging App Development Best Practices 2026](https://stormotion.io/blog/how-to-make-an-ev-charging-station-app/)
- [Building Map-Based UI for EV Charging - Sidekick Interactive](https://www.sidekickinteractive.com/uncategorized/building-a-map-based-ui-for-ev-charging-stations/)
- [EV Charging App UI - Figma Community](https://www.figma.com/community/file/1528453425961363692/ev-charging-app-ui)
- [Chargepool App Design Case Study](https://bokaap.design/case-study/chargepool-mobile-app-design/)
