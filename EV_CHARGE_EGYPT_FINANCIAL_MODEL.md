# EV Charge Egypt -- Financial Projections & Unit Economics

**Prepared**: March 26, 2026
**Exchange Rate Used**: 1 USD = 50 EGP (rounded from ~50.5 for clean modeling)
**Model Horizon**: 3 Years (April 2026 -- March 2029)

---

## 0. Market Context & Key Assumptions

### Egypt EV Market

| Metric | Value | Source |
|--------|-------|--------|
| EVs on Egyptian roads (est. early 2026) | ~12,000-15,000 | Industry estimates; ~8,000 sold through 2025, cumulative with prior years |
| Projected EV sales 2026 | ~15,000 units | EV24.africa / industry projections |
| Cumulative EVs end of 2026 | ~25,000-30,000 | Growth trajectory estimate |
| Cumulative EVs end of 2027 | ~50,000-60,000 | ~80-100% YoY growth |
| Cumulative EVs end of 2028 | ~90,000-120,000 | Growth moderating to 60-80% |
| Licensed charging operators | 5 (Infinity, Ikarus, Sha7en, Elsewedy Plug, and 1 other) | New Energy Egypt |
| Charging points (early 2026) | ~1,000+ (Infinity alone: 700+) | Provider data |
| Government target | 6,000+ points at 3,000 stations | Ministry of Petroleum |

### Charging Behavior Assumptions

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Public charging sessions per EV per week | 2.5 | Egypt has limited home charging; higher public reliance than US/EU |
| Sessions per EV per month | 10 | Conservative: 2.5/week x 4 weeks |
| App addressable market (% of EV owners) | Year 1: 5-15%, Year 2: 15-25%, Year 3: 25-40% | Aggregator adoption curve |

### Cost Parameters

| Item | Monthly Cost | Notes |
|------|-------------|-------|
| Supabase Pro | $25/mo base + usage | Scales to $50-150/mo at volume |
| Google Maps API | $0 (free tier) to $200+/mo | 10,000 free events/mo on Essentials SKUs |
| Edge Functions (Supabase) | Included in Pro | 500K invocations/mo included |
| Push notifications (Expo) | Free tier to $99/mo | Free for <1,000 users |
| Domain + SSL | ~$15/mo | Standard hosting |
| Ad network (AdMob/Meta Audience) | Revenue share (30-40% to network) | Standard mobile ad terms |

### Revenue Parameters

| Stream | Rate | Notes |
|--------|------|-------|
| Per-session fee | 10 EGP ($0.20) | Flat fee per charge initiated via app |
| Fleet - Starter | Free (5 vehicles) | Lead generation tier |
| Fleet - Business | 1,500 EGP/mo ($30) | 25 vehicles |
| Fleet - Enterprise | 10,000 EGP/mo ($200) | Unlimited vehicles |
| Enterprise credits bulk bonus | 5-12% discount | Retention mechanism |
| In-app ad CPM (Egypt) | ~$1.50-2.00 | Egypt mobile eCPM benchmark |
| Ad impressions per session | 2-3 | Subtle/contextual, not intrusive |

---

## 1. Unit Economics

### 1A. Individual Driver

| Metric | EGP | USD |
|--------|-----|-----|
| Charging sessions per month | 10 | 10 |
| Revenue per session | 10 | 0.20 |
| **Revenue per user per month** | **100** | **$2.00** |
| Ad impressions per user/month (10 sessions x 2.5 ads) | 25 impressions | 25 impressions |
| Ad revenue per user/month (at $1.75 eCPM) | 2.19 | $0.044 |
| **Total revenue per user per month** | **102.19** | **$2.04** |
| | | |
| Supabase cost per user/month (at scale, 5,000 users) | 0.75 | $0.015 |
| Maps API cost per user/month | 0.50 | $0.010 |
| Edge function cost per user/month | 0.25 | $0.005 |
| Payment processing (if applicable, 2.5%) | 2.50 | $0.050 |
| **Total cost to serve per user/month** | **4.00** | **$0.08** |
| | | |
| **Gross margin per user/month** | **98.19** | **$1.96** |
| **Gross margin %** | **96.1%** | |

### 1B. Fleet Accounts

| Metric | Starter (Free) | Business (1,500/mo) | Enterprise (10,000/mo) |
|--------|----------------|---------------------|----------------------|
| Vehicles | 5 | 25 | 100 (assumed avg) |
| Sessions/vehicle/month | 15 (fleet = higher usage) | 15 | 15 |
| Per-session fee revenue (EGP) | 750 | 3,750 | 15,000 |
| Subscription fee (EGP) | 0 | 1,500 | 10,000 |
| Bulk credit discount cost (EGP) | 0 | 0 | -1,800 (12% on credits) |
| **Total revenue per fleet/month (EGP)** | **750** | **5,250** | **23,200** |
| **Total revenue per fleet/month (USD)** | **$15** | **$105** | **$464** |
| Cost to serve (EGP) | 50 | 200 | 600 |
| **Gross margin per fleet/month (EGP)** | **700** | **5,050** | **22,600** |

### 1C. Customer Acquisition Cost (CAC)

| Channel | Cost per Install (EGP) | Cost per Install (USD) | Conversion to Active | CAC (EGP) | CAC (USD) |
|---------|----------------------|----------------------|---------------------|-----------|-----------|
| Organic (app store, word of mouth) | 0 | 0 | 30% | 0 | 0 |
| Meta/Instagram ads (Egypt) | 50-75 | $1.00-1.50 | 15% | 400 | $8.00 |
| Google App campaigns | 75-100 | $1.50-2.00 | 12% | 700 | $14.00 |
| Charging station partnerships (QR) | 25 | $0.50 | 25% | 100 | $2.00 |
| **Blended CAC (weighted)** | | | | **200** | **$4.00** |

### 1D. Lifetime Value (LTV)

| Metric | Value (EGP) | Value (USD) |
|--------|-------------|-------------|
| Monthly gross margin per user | 98.19 | $1.96 |
| Average user lifespan (months) | 24 | 24 |
| Monthly churn rate (est.) | 5% | 5% |
| Adjusted lifespan (1/churn) | 20 months | 20 months |
| **LTV (individual driver)** | **1,964** | **$39.28** |
| | | |
| **LTV : CAC Ratio** | **9.8x** | **9.8x** |

An LTV:CAC ratio of ~10x is excellent. Even if CAC doubles or LTV halves, the ratio remains healthy above 3x.

---

## 2. Revenue Projections -- 3 Years

### Year 1: Month-by-Month (April 2026 -- March 2027)

**User Growth Assumptions:**
- MVP launch Month 1 with 2-3 provider integrations
- Word-of-mouth + QR codes at stations drive early growth
- Fleet sales begin Month 4
- Marketing spend ramps Month 4-6

| Month | Individual Users | Fleet (Starter) | Fleet (Business) | Fleet (Enterprise) | Sessions | Per-Charge Rev (EGP) | Subscription Rev (EGP) | Ad Rev (EGP) | **Total Rev (EGP)** | **Total Rev (USD)** |
|-------|-----------------|-----------------|-------------------|-------------------|----------|---------------------|----------------------|--------------|-------------------|-------------------|
| M1 (Apr) | 100 | 1 | 0 | 0 | 1,075 | 10,750 | 0 | 269 | **11,019** | **$220** |
| M2 (May) | 250 | 2 | 0 | 0 | 2,650 | 26,500 | 0 | 663 | **27,163** | **$543** |
| M3 (Jun) | 500 | 4 | 0 | 0 | 5,300 | 53,000 | 0 | 1,325 | **54,325** | **$1,087** |
| M4 (Jul) | 900 | 6 | 1 | 0 | 9,675 | 96,750 | 1,500 | 2,419 | **100,669** | **$2,013** |
| M5 (Aug) | 1,400 | 8 | 2 | 0 | 15,200 | 152,000 | 3,000 | 3,800 | **158,800** | **$3,176** |
| M6 (Sep) | 2,000 | 10 | 3 | 1 | 22,250 | 222,500 | 14,500 | 5,563 | **242,563** | **$4,851** |
| M7 (Oct) | 2,800 | 12 | 4 | 1 | 31,300 | 313,000 | 16,000 | 7,825 | **336,825** | **$6,737** |
| M8 (Nov) | 3,600 | 14 | 5 | 1 | 40,100 | 401,000 | 17,500 | 10,025 | **428,525** | **$8,571** |
| M9 (Dec) | 4,500 | 16 | 6 | 2 | 50,900 | 509,000 | 29,000 | 12,725 | **550,725** | **$11,015** |
| M10 (Jan) | 5,500 | 18 | 8 | 2 | 62,700 | 627,000 | 32,000 | 15,675 | **674,675** | **$13,494** |
| M11 (Feb) | 6,500 | 20 | 10 | 3 | 74,750 | 747,500 | 45,000 | 18,688 | **811,188** | **$16,224** |
| M12 (Mar) | 8,000 | 22 | 12 | 3 | 92,300 | 923,000 | 48,000 | 23,075 | **994,075** | **$19,881** |
| | | | | | | | | | | |
| **Y1 Total** | | | | | **408,200** | **4,082,000** | **206,500** | **102,050** | **4,390,550** | **$87,811** |

**Year 1 Revenue Breakdown:**
- Per-charge fees: 4,082,000 EGP ($81,640) -- 93.0%
- Subscriptions: 206,500 EGP ($4,130) -- 4.7%
- Advertising: 102,050 EGP ($2,041) -- 2.3%

### Years 2-3: Quarterly Projections

**Year 2 (April 2027 -- March 2028)**

| Quarter | Individual Users (end) | Fleet Starter | Fleet Business | Fleet Enterprise | Sessions | Per-Charge (EGP) | Subscriptions (EGP) | Ads (EGP) | **Total (EGP)** | **Total (USD)** |
|---------|----------------------|---------------|----------------|-----------------|----------|------------------|--------------------|-----------|--------------------|-----------------|
| Q1 (Apr-Jun) | 14,000 | 30 | 20 | 5 | 315,000 | 3,150,000 | 210,000 | 78,750 | **3,438,750** | **$68,775** |
| Q2 (Jul-Sep) | 20,000 | 40 | 30 | 8 | 483,000 | 4,830,000 | 375,000 | 120,750 | **5,325,750** | **$106,515** |
| Q3 (Oct-Dec) | 28,000 | 50 | 40 | 12 | 696,000 | 6,960,000 | 540,000 | 174,000 | **7,674,000** | **$153,480** |
| Q4 (Jan-Mar) | 35,000 | 60 | 50 | 15 | 882,000 | 8,820,000 | 675,000 | 220,500 | **9,715,500** | **$194,310** |
| **Y2 Total** | | | | | **2,376,000** | **23,760,000** | **1,800,000** | **594,000** | **26,154,000** | **$523,080** |

**Year 3 (April 2028 -- March 2029)**

| Quarter | Individual Users (end) | Fleet Starter | Fleet Business | Fleet Enterprise | Sessions | Per-Charge (EGP) | Subscriptions (EGP) | Ads (EGP) | **Total (EGP)** | **Total (USD)** |
|---------|----------------------|---------------|----------------|-----------------|----------|------------------|--------------------|-----------|--------------------|-----------------|
| Q1 (Apr-Jun) | 45,000 | 75 | 65 | 20 | 1,170,000 | 11,700,000 | 892,500 | 292,500 | **12,885,000** | **$257,700** |
| Q2 (Jul-Sep) | 55,000 | 90 | 80 | 28 | 1,473,000 | 14,730,000 | 1,120,000 | 368,250 | **16,218,250** | **$324,365** |
| Q3 (Oct-Dec) | 65,000 | 100 | 95 | 35 | 1,762,500 | 17,625,000 | 1,342,500 | 440,625 | **19,408,125** | **$388,163** |
| Q4 (Jan-Mar) | 75,000 | 110 | 110 | 42 | 2,061,000 | 20,610,000 | 1,585,000 | 515,250 | **22,710,250** | **$454,205** |
| **Y3 Total** | | | | | **6,466,500** | **64,665,000** | **4,940,000** | **1,616,625** | **71,221,625** | **$1,424,433** |

### 3-Year Revenue Summary

| Year | Per-Charge (EGP) | Subscriptions (EGP) | Ads (EGP) | **Total (EGP)** | **Total (USD)** |
|------|------------------|--------------------|-----------|--------------------|-----------------|
| Year 1 | 4,082,000 | 206,500 | 102,050 | **4,390,550** | **$87,811** |
| Year 2 | 23,760,000 | 1,800,000 | 594,000 | **26,154,000** | **$523,080** |
| Year 3 | 64,665,000 | 4,940,000 | 1,616,625 | **71,221,625** | **$1,424,433** |
| **3-Year Total** | **92,507,000** | **6,946,500** | **2,312,675** | **101,766,175** | **$2,035,323** |

---

## 3. Cost Structure

### 3A. Initial Development Costs (Pre-Launch / Month 0)

| Item | Cost (EGP) | Cost (USD) | Notes |
|------|-----------|-----------|-------|
| React Native app development (3 months, 2 devs) | 450,000 | $9,000 | Egypt market rates for senior RN devs |
| Backend/Supabase setup + Edge Functions | 150,000 | $3,000 | Database schema, auth, real-time |
| UI/UX design | 100,000 | $2,000 | Design system, user flows |
| Maps integration + provider APIs | 75,000 | $1,500 | Google Maps, station data APIs |
| QA/Testing | 50,000 | $1,000 | Manual + automated testing |
| App store accounts (Apple + Google) | 7,500 | $150 | One-time fees |
| Legal/business registration | 50,000 | $1,000 | Egypt company formation |
| **Total Initial Development** | **882,500** | **$17,650** | |

### 3B. Monthly Operating Costs

| Cost Category | M1-3 (EGP/mo) | M4-6 (EGP/mo) | M7-12 (EGP/mo) | Y2 Avg (EGP/mo) | Y3 Avg (EGP/mo) |
|--------------|---------------|---------------|----------------|-----------------|-----------------|
| **Infrastructure** | | | | | |
| Supabase Pro + usage | 1,500 | 2,500 | 4,000 | 7,500 | 15,000 |
| Google Maps API | 500 | 1,500 | 3,000 | 7,500 | 15,000 |
| Push notifications | 0 | 500 | 2,500 | 5,000 | 7,500 |
| Monitoring/analytics | 500 | 500 | 1,000 | 2,500 | 5,000 |
| Domain/CDN/misc | 750 | 750 | 1,000 | 1,500 | 2,500 |
| **Infra Subtotal** | **3,250** | **5,750** | **11,500** | **24,000** | **45,000** |
| | | | | | |
| **Team** | | | | | |
| Founder/CEO (deferred) | 0 | 0 | 15,000 | 25,000 | 40,000 |
| Lead developer (1) | 30,000 | 30,000 | 35,000 | 40,000 | 50,000 |
| Junior developer (1) | 0 | 15,000 | 15,000 | 20,000 | 25,000 |
| Business development (1) | 0 | 0 | 20,000 | 25,000 | 30,000 |
| Customer support (1) | 0 | 0 | 0 | 15,000 | 20,000 |
| Marketing specialist (1) | 0 | 0 | 0 | 20,000 | 25,000 |
| **Team Subtotal** | **30,000** | **45,000** | **85,000** | **145,000** | **190,000** |
| | | | | | |
| **Marketing** | | | | | |
| Digital ads (Meta/Google) | 5,000 | 25,000 | 50,000 | 100,000 | 150,000 |
| Station partnership materials | 2,500 | 5,000 | 5,000 | 10,000 | 15,000 |
| Events/partnerships | 0 | 5,000 | 10,000 | 25,000 | 40,000 |
| Content marketing | 2,500 | 5,000 | 5,000 | 10,000 | 15,000 |
| **Marketing Subtotal** | **10,000** | **40,000** | **70,000** | **145,000** | **220,000** |
| | | | | | |
| **Other Operating** | | | | | |
| Office/coworking | 5,000 | 5,000 | 10,000 | 15,000 | 25,000 |
| Accounting/legal | 5,000 | 5,000 | 7,500 | 10,000 | 15,000 |
| Insurance | 2,500 | 2,500 | 2,500 | 5,000 | 7,500 |
| Contingency (10%) | 5,575 | 10,325 | 18,600 | 34,400 | 50,250 |
| **Other Subtotal** | **18,075** | **22,825** | **38,600** | **64,400** | **97,750** |
| | | | | | |
| **TOTAL MONTHLY OPEX** | **61,325** | **113,575** | **205,100** | **378,400** | **552,750** |
| **TOTAL MONTHLY OPEX (USD)** | **$1,227** | **$2,272** | **$4,102** | **$7,568** | **$11,055** |

### 3C. Annual Cost Summary

| Year | Total Costs (EGP) | Total Costs (USD) |
|------|-------------------|-------------------|
| Year 0 (Pre-launch) | 882,500 | $17,650 |
| Year 1 | 1,904,250 | $38,085 |
| Year 2 | 4,540,800 | $90,816 |
| Year 3 | 6,633,000 | $132,660 |
| **3-Year Total** | **13,960,550** | **$279,211** |

---

## 4. Break-Even Analysis

### Monthly P&L Trajectory

| Month | Revenue (EGP) | Costs (EGP) | Net (EGP) | Cumulative (EGP) |
|-------|--------------|-------------|-----------|------------------|
| M1 | 11,019 | 61,325 | -50,306 | -933,306 |
| M2 | 27,163 | 61,325 | -34,162 | -967,468 |
| M3 | 54,325 | 61,325 | -7,000 | -974,468 |
| M4 | 100,669 | 113,575 | -12,906 | -987,374 |
| M5 | 158,800 | 113,575 | 45,225 | -942,149 |
| M6 | 242,563 | 113,575 | 129,988 | -812,161 |
| M7 | 336,825 | 205,100 | 131,725 | -680,436 |
| M8 | 428,525 | 205,100 | 223,425 | -457,011 |
| M9 | 550,725 | 205,100 | 345,625 | -111,386 |
| **M10** | **674,675** | **205,100** | **469,575** | **358,189** |
| M11 | 811,188 | 205,100 | 606,088 | 964,277 |
| M12 | 994,075 | 205,100 | 788,975 | 1,753,252 |

### Break-Even Metrics

| Metric | Value |
|--------|-------|
| **Monthly break-even point** | **Month 5 (August 2026)** -- first month with positive operating cash flow |
| **Cumulative break-even point** | **Month 10 (January 2027)** -- total cumulative profit turns positive |
| **Users at monthly break-even** | ~1,400 individual + small fleet base |
| **Users at cumulative break-even** | ~5,500 individual + 28 fleet accounts |
| **Sessions/month at monthly break-even** | ~15,200 |
| **Maximum cash deficit (trough)** | -987,374 EGP (-$19,747 USD) |
| **Total burn before cumulative break-even** | ~1,870,000 EGP (~$37,400 USD) |

### Break-Even Sensitivity: Per-Session Fee

| Fee Level | Monthly Break-Even | Cumulative Break-Even | Impact |
|-----------|-------------------|----------------------|--------|
| 10 EGP (base case) | Month 5 | Month 10 | Baseline |
| 7.5 EGP | Month 7 | Month 13 | +3 months to cumulative BE |
| 5 EGP | Month 9 | Month 17 | +7 months; requires more funding |

---

## 5. Funding Requirements

### 5A. Capital Requirements

| Phase | Amount (EGP) | Amount (USD) | Purpose |
|-------|-------------|-------------|---------|
| Pre-launch development | 882,500 | $17,650 | App build, legal, setup |
| Operating runway (M1-M5) | 987,374 | $19,747 | Cover losses until monthly positive |
| Safety buffer (3 months costs) | 615,300 | $12,306 | Risk mitigation |
| **Minimum funding required** | **2,485,174** | **$49,703** | To reach monthly profitability |
| | | | |
| Growth capital (M6-M12 marketing) | 500,000 | $10,000 | Accelerate user acquisition |
| **Recommended seed round** | **3,000,000** | **$60,000** | Comfortable runway with growth |

### 5B. Recommended Seed Round

| Parameter | Value |
|-----------|-------|
| **Round size** | 3,000,000 - 5,000,000 EGP ($60,000 - $100,000 USD) |
| **Type** | Pre-seed / Angel round |
| **Runway provided** | 12-18 months |
| **Dilution target** | 10-15% equity |
| **Pre-money valuation** | 25,000,000 - 40,000,000 EGP ($500K-$800K) |

### 5C. Milestones Before Raising

| Milestone | Target | Timeline |
|-----------|--------|----------|
| MVP launched with 2+ provider integrations | Working app in App/Play Store | Month 1 |
| 500 registered users, 100 MAU | Product-market fit signal | Month 3 |
| First fleet subscription sold | B2B revenue validation | Month 4-5 |
| 2,000+ MAU, monthly break-even | Sustainable unit economics proven | Month 5-6 |
| All 5 licensed providers integrated | Market coverage achieved | Month 6-8 |

### 5D. Use of Funds Allocation

| Category | Allocation | Amount (EGP) | Amount (USD) |
|----------|-----------|-------------|-------------|
| Product development | 35% | 1,050,000 | $21,000 |
| Marketing & user acquisition | 30% | 900,000 | $18,000 |
| Operations & team | 25% | 750,000 | $15,000 |
| Reserve/contingency | 10% | 300,000 | $6,000 |
| **Total** | **100%** | **3,000,000** | **$60,000** |

---

## 6. Risk Scenarios

### 6A. Three-Case Projections (End of Year 1)

| Metric | Worst Case | Expected Case | Best Case |
|--------|-----------|---------------|-----------|
| Individual users (M12) | 3,000 | 8,000 | 15,000 |
| Fleet accounts | 15 | 37 | 60 |
| Monthly sessions (M12) | 35,000 | 92,300 | 175,000 |
| Y1 total revenue (EGP) | 1,800,000 | 4,390,550 | 8,500,000 |
| Y1 total revenue (USD) | $36,000 | $87,811 | $170,000 |
| Y1 total costs (EGP) | 1,400,000 | 1,904,250 | 2,500,000 |
| Y1 net income (EGP) | 400,000 | 2,486,300 | 6,000,000 |
| Cumulative break-even | Month 14 | Month 10 | Month 7 |
| Additional funding needed | 1,500,000 EGP | 0 (post M10) | 0 (post M7) |

### 6B. Scenario: Per-Charge Fee Drops to 5 EGP

If competitive pressure forces a 50% reduction in the per-session fee:

| Metric | 10 EGP (Base) | 5 EGP (Reduced) | Delta |
|--------|--------------|-----------------|-------|
| Y1 per-charge revenue | 4,082,000 | 2,041,000 | -50% |
| Y1 total revenue | 4,390,550 | 2,349,550 | -46.5% |
| Y1 net income | 2,486,300 | 445,300 | -82.1% |
| Monthly break-even | Month 5 | Month 9 | +4 months |
| Cumulative break-even | Month 10 | Month 16 | +6 months |
| Additional funding needed | 0 | ~1,200,000 EGP | Manageable |

**Mitigation**: At 5 EGP, the business is still viable but slower. Compensate by:
- Accelerating fleet subscription sales (higher margin)
- Introducing premium features (route planning, reservation, priority charging)
- Increasing ad inventory (carefully, to avoid user experience damage)

### 6C. Scenario: Only 3 of 5 Providers Integrate

If two major providers refuse integration:

| Metric | 5 Providers (Base) | 3 Providers | Delta |
|--------|-------------------|-------------|-------|
| Station coverage | 100% | ~55% | -45% coverage |
| User adoption rate | Baseline | -30% | Reduced value proposition |
| Y1 individual users (M12) | 8,000 | 5,600 | -30% |
| Y1 total revenue (EGP) | 4,390,550 | 3,073,385 | -30% |
| Y1 net income (EGP) | 2,486,300 | 1,169,135 | -53% |
| Cumulative break-even | Month 10 | Month 12 | +2 months |

**Mitigation**:
- Prioritize integrating Infinity (700+ points, ~60-70% of network) -- this single provider gives majority coverage
- Use crowd-sourced station data for non-integrated providers (show location, no live availability)
- Offer non-integrated providers free promotion to incentivize joining
- Build provider FOMO: show them the traffic their competitors receive through the app

### 6D. Combined Worst Case: 5 EGP Fee + Only 3 Providers

| Metric | Combined Worst | Value |
|--------|---------------|-------|
| Y1 total revenue (EGP) | | 1,645,685 |
| Y1 total revenue (USD) | | $32,914 |
| Y1 total costs (EGP) | | 1,400,000 |
| Y1 net income (EGP) | | 245,685 |
| Cumulative break-even | | Month 18-20 |
| Additional funding needed | | ~2,000,000 EGP ($40,000) |
| Viable? | | Yes, but requires patient capital and pivot to subscriptions |

---

## 7. Key Financial Ratios & Benchmarks

| Metric | Year 1 | Year 2 | Year 3 | Industry Benchmark |
|--------|--------|--------|--------|--------------------|
| Gross margin | 96% | 94% | 92% | SaaS: 70-85% |
| Operating margin | 57% | 83% | 91% | Marketplace: 15-30% |
| Revenue growth (YoY) | -- | 496% | 172% | High-growth: 100%+ |
| CAC payback (months) | 2 | 1.5 | 1 | SaaS target: <12 |
| LTV:CAC | 9.8x | 12x | 15x | Healthy: >3x |
| Monthly burn rate (peak) | 205,100 EGP | 378,400 EGP | 552,750 EGP | -- |
| Revenue per employee | -- | 4,359,000 EGP/yr | 8,903,000 EGP/yr | Efficiency metric |
| Sessions per user/month | 10 | 10.5 | 11 | Engagement metric |

---

## 8. 3-Year Financial Summary

| | Year 1 (EGP) | Year 1 (USD) | Year 2 (EGP) | Year 2 (USD) | Year 3 (EGP) | Year 3 (USD) |
|---|---|---|---|---|---|---|
| **Revenue** | 4,390,550 | $87,811 | 26,154,000 | $523,080 | 71,221,625 | $1,424,433 |
| **Operating Costs** | 1,904,250 | $38,085 | 4,540,800 | $90,816 | 6,633,000 | $132,660 |
| **EBITDA** | 2,486,300 | $49,726 | 21,613,200 | $432,264 | 64,588,625 | $1,291,773 |
| **EBITDA Margin** | 56.6% | | 82.6% | | 90.7% | |
| **Cumulative Profit** | 1,603,800 | $32,076 | 23,217,000 | $464,340 | 87,805,625 | $1,756,113 |

---

## 9. Strategic Recommendations

### Phase 1 (Months 1-3): Validate
- Launch MVP with Infinity integration first (largest network)
- Target 500 users through QR codes at charging stations
- Keep costs minimal: 1 developer, no office, organic marketing only
- Validate the 10 EGP willingness-to-pay through A/B testing

### Phase 2 (Months 4-6): Grow
- Integrate remaining providers
- Begin fleet sales outreach to delivery companies and ride-sharing fleets
- Start paid marketing with focus on Meta ads (lowest CAC in Egypt)
- Hire business development person for fleet accounts

### Phase 3 (Months 7-12): Scale
- Achieve all 5 provider integrations
- Launch Enterprise tier with dedicated account management
- Begin ad monetization with contextual, non-intrusive formats
- Build data analytics capabilities for providers (future B2B revenue stream)

### Phase 4 (Year 2+): Expand
- Consider expansion to adjacent markets (smart parking, roadside assistance)
- Launch provider analytics dashboard (paid B2B product)
- Explore partnerships with car dealerships for pre-installation
- Evaluate expansion to other MENA markets (Saudi Arabia, UAE, Morocco)

---

## 10. Key Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Providers build their own aggregator app | Medium | High | Move fast, build network effects, offer superior UX |
| Government regulation of aggregator fees | Low | High | Engage with regulators early, demonstrate consumer value |
| EV adoption slower than projected | Medium | Medium | Model already conservative; pivot to fleet-heavy model |
| Exchange rate volatility (EGP depreciation) | High | Medium | Revenue and costs both in EGP; USD impact on cloud costs manageable |
| Competitor enters market | Medium | Medium | First-mover advantage; focus on provider relationships |
| Payment processing challenges in Egypt | Medium | Medium | Support multiple payment methods (Fawry, Vodafone Cash, cards) |

---

*This financial model should be updated quarterly as actual data becomes available. All projections are estimates based on market research and comparable business models. Actual results may vary significantly based on execution, market conditions, and competitive dynamics.*

**Model Assumptions Document Version**: 1.0
**Next Review Date**: June 2026 (post-MVP launch)
