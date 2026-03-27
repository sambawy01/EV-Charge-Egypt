export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: 'egypt' | 'global' | 'tech' | 'market' | 'review';
  imageEmoji: string;
  image: string;
  videoUrl?: string;
  readTimeMin: number;
  publishedAt: string;
  url?: string;
  trending: boolean;
  aiPick: boolean;
}

// Date-seeded random for daily rotation
function dailySeed(): () => number {
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  let h = seed;
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
}

const ARTICLE_POOL: Omit<NewsArticle, 'id' | 'publishedAt' | 'trending' | 'aiPick'>[] = [
  // ═══════════════════════════════════════════════════════
  // EGYPT — Real articles about Egypt's EV market
  // ═══════════════════════════════════════════════════════
  {
    title: 'Electric Cars in Egypt: Prices, Availability and Charging in 2026',
    summary: 'Electric cars are becoming more popular in Egypt, with sales growing by nearly 20% in 2025. Government incentives, local manufacturing efforts by BYD through Mansour Group, and a growing charging network are driving adoption.',
    source: 'EV24 Africa',
    category: 'egypt',
    imageEmoji: '\u{1F1EA}\u{1F1EC}',
    image: 'https://www.ev24.africa/wp-content/uploads/2026/03/image_e50799f4d063dea9d489b5b5fefbaff0.jpeg',
    url: 'https://www.ev24.africa/electric-cars-in-egypt-prices-availability-charging-2026/',
    readTimeMin: 5,
  },
  {
    title: "Egypt's EV Future Is Here \u2014 It Just Has a Backup Engine",
    summary: 'Industry insiders bet that 2026 will see range-extended electric vehicles (REEVs) potentially accounting for 50-60% of new car sales in Egypt. BYD enters the market through Mansour Group\'s Maneast distribution deal.',
    source: 'Enterprise',
    category: 'egypt',
    imageEmoji: '\u26A1',
    image: 'https://picsum.photos/seed/egypt-ev-future/800/400',
    url: 'https://enterpriseam.com/egypt/2025/12/21/egypts-ev-future-is-here-it-just-has-a-backup-engine/',
    readTimeMin: 6,
  },
  {
    title: 'Electric Vehicle Charging Stations in Egypt: 2025 Guide',
    summary: 'Infinity manages over 700 charging points across 16 governorates and aims to expand to 6,000 charging points at 3,000 stations nationwide. The Ministry of Petroleum has allocated EGP 450 million for infrastructure buildout.',
    source: 'New Energy Egypt',
    category: 'egypt',
    imageEmoji: '\u{1F50C}',
    image: 'https://picsum.photos/seed/egypt-charging-guide/800/400',
    url: 'https://newenergyeg.com/electric-vehicle-charging-stations-in-egypt-2025-guide-by-new-energy/',
    readTimeMin: 4,
  },
  {
    title: 'EV Incentives and Charging Infrastructure in Egypt: What Buyers Should Know',
    summary: 'Egypt offers customs exemptions and subsidized electricity rates for EV charging. Gas stations by Shell, Mobil, and Misr Petroleum are being retrofitted with EV chargers along national highways.',
    source: 'EV24 Africa',
    category: 'egypt',
    imageEmoji: '\u{1F4B0}',
    image: 'https://picsum.photos/seed/egypt-ev-incentives/800/400',
    url: 'https://www.ev24.africa/ev-incentives-and-charging-infrastructure-in-egypt-whats-buyers-should-know/',
    readTimeMin: 4,
  },
  {
    title: 'Middle East & Africa EV Market Worth $5 Billion in 2026, Expected to Cross $20 Billion by 2031',
    summary: 'The Middle East and Africa EV market is expanding rapidly at a CAGR of 32.15%. Sovereign wealth funds are investing in domestic production, and rapid rollout of public DC fast-charging corridors is accelerating adoption.',
    source: 'GlobeNewsWire',
    category: 'egypt',
    imageEmoji: '\u{1F30D}',
    image: 'https://picsum.photos/seed/mea-ev-market/800/400',
    url: 'https://www.globenewswire.com/news-release/2026/03/18/3257959/0/en/Middle-East-Africa-Electric-Vehicle-Market-Worth-USD-5-Billion-in-2026-is-Expected-to-Cross-USD-20-Billion-by-2031-Rapid-Rollout-of-Public-DC-Fast-Charging-Corridors.html',
    readTimeMin: 5,
  },
  {
    title: 'BYD Dolphin EV: Price and Specifications in Egypt',
    summary: 'The BYD Dolphin arrives in Egypt with competitive pricing, offering a practical electric hatchback option. Full specifications and pricing details for the Egyptian market are now available.',
    source: 'Misr Connect',
    category: 'egypt',
    imageEmoji: '\u{1F42C}',
    image: 'https://picsum.photos/seed/byd-dolphin-egypt/800/400',
    url: 'https://misrconnect.com/en/news/cars-news/byd-dolphin-ev-price-and-specifications-in-egypt',
    readTimeMin: 3,
  },

  // ═══════════════════════════════════════════════════════
  // GLOBAL — Major EV industry news
  // ═══════════════════════════════════════════════════════
  {
    title: 'Toyota Cuts EV Prices in China, Some Now Under $15,000',
    summary: 'Toyota slashes electric vehicle prices in the competitive Chinese market, with some models now available for under $15,000. The move signals intensifying price wars among automakers in the world\'s largest EV market.',
    source: 'Electrek',
    category: 'global',
    imageEmoji: '\u{1F4B2}',
    image: 'https://electrek.co/wp-content/uploads/sites/3/2026/03/Toyota-cuts-EV-prices-China.jpeg?quality=82&strip=all&w=1400',
    url: 'https://electrek.co/2026/03/25/toyota-cuts-ev-prices-china-under-15000/',
    readTimeMin: 4,
  },
  {
    title: 'GM Is Now Testing Eyes-Off Self-Driving Tech in Its Biggest EV',
    summary: 'The Cadillac Escalade IQ is the first vehicle to hit the road with next-gen self-driving tech. GM is testing eyes-off autonomous driving capability in California and Michigan, with full deployment expected by 2028.',
    source: 'Electrek',
    category: 'global',
    imageEmoji: '\u{1F916}',
    image: 'https://electrek.co/wp-content/uploads/sites/3/2026/03/GM-self-driving-EV-Cadillac.jpeg?quality=82&strip=all',
    url: 'https://electrek.co/2026/03/24/gm-testing-eyes-off-self-driving-tech-in-biggest-ev/',
    readTimeMin: 5,
  },
  {
    title: 'Toyota Launches the C-HR+ in Europe as Its Longest-Range EV with 607km',
    summary: 'Toyota\'s C-HR+ launches in Europe with up to 607km of range, making it the brand\'s longest-range electric vehicle. Customer deliveries are already underway across European markets.',
    source: 'Electrek',
    category: 'global',
    imageEmoji: '\u{1F697}',
    image: 'https://electrek.co/wp-content/uploads/sites/3/2026/03/Toyota-longest-range-EV-Europe-C-HR-1.jpeg?quality=82&strip=all',
    url: 'https://electrek.co/2026/03/20/toyota-launches-c-hr-europe-longest-range-ev/',
    readTimeMin: 4,
  },
  {
    title: 'Elon Teases a Van, Tesla Sales Tumble, and There Is No Robotaxi in California',
    summary: 'Tesla faces headwinds as sales decline amid the end of EV tax credits. Meanwhile, Musk teases a people-hauling vehicle and the Robotaxi program hits regulatory delays in California.',
    source: 'Electrek',
    category: 'global',
    imageEmoji: '\u{1F68C}',
    image: 'https://electrek.co/wp-content/uploads/sites/3/2026/03/Tesla-Model-X-electric-van_16x9.jpg?quality=82&strip=all',
    url: 'https://electrek.co/2026/03/25/elon-teases-a-van-tesla-sales-tumble-and-there-is-no-robotaxi-in-california/',
    readTimeMin: 6,
  },
  {
    title: 'Lexus Announces 2026 ES EV Prices Start at Under $50,000',
    summary: 'Lexus reveals pricing for its all-new 2026 ES EV, starting under $50,000. The luxury electric sedan aims to compete with the BMW i4 and Mercedes EQE in the premium EV segment.',
    source: 'Electrek',
    category: 'global',
    imageEmoji: '\u{1F3CE}\u{FE0F}',
    image: 'https://electrek.co/wp-content/uploads/sites/3/2025/11/new-2026-Lexus-ES-EV.jpeg?quality=82&strip=all',
    url: 'https://electrek.co/2026/03/05/lexus-announces-2026-es-ev-prices-start-at-under-50000/',
    readTimeMin: 4,
  },
  {
    title: 'Every New EV Launching in 2026 in the U.S.',
    summary: '2026 is set to be the best year yet for new EVs, with 32 new electric vehicle models arriving in the United States. From affordable compacts to luxury SUVs, the market is expanding rapidly.',
    source: 'InsideEVs',
    category: 'global',
    imageEmoji: '\u{1F1FA}\u{1F1F8}',
    image: 'https://picsum.photos/seed/all-evs-2026/800/400',
    url: 'https://insideevs.com/features/783999/every-new-electric-car-ev-2026/',
    readTimeMin: 8,
  },
  {
    title: 'EVs Canceled in 2026: Honda, Tesla, Hyundai, Kia Cut Programs',
    summary: 'Several major automakers have canceled or delayed EV programs in 2026. Honda, Tesla, Hyundai, and Kia are among the companies scaling back certain electric vehicle plans amid market shifts.',
    source: 'Automotive News',
    category: 'global',
    imageEmoji: '\u{274C}',
    image: 'https://picsum.photos/seed/evs-canceled-2026/800/400',
    url: 'https://www.autonews.com/car-concepts/an-ev-cancellations-delays-2026-0313/',
    readTimeMin: 5,
  },

  // ═══════════════════════════════════════════════════════
  // MARKET — EV industry business and sales data
  // ═══════════════════════════════════════════════════════
  {
    title: 'New EV Sales Dropped 28%, But Used EVs Are Booming',
    summary: 'Around 213,000 new EVs were sold in Q1 2026, down 28% year-over-year due to the end of tax credits. However, the secondhand EV market is surging as used electric vehicles become more affordable than ever.',
    source: 'InsideEVs',
    category: 'market',
    imageEmoji: '\u{1F4C9}',
    image: 'https://picsum.photos/seed/ev-sales-q1-2026/800/400',
    url: 'https://insideevs.com/news/791253/ev-sales-used-new-hybrids-q1-2026/',
    readTimeMin: 5,
  },
  {
    title: 'BYD Stock Rebound Gathers Pace as Oil Shock Drives EV Sales Boom',
    summary: 'BYD shares rebounded nearly 12% in March 2026 as surging oil prices brightened the outlook for electric vehicle sales. The oil crisis is pushing more consumers toward EVs globally.',
    source: 'Bloomberg',
    category: 'market',
    imageEmoji: '\u{1F4C8}',
    image: 'https://picsum.photos/seed/byd-stock-rebound/800/400',
    url: 'https://www.bloomberg.com/news/articles/2026-03-26/byd-stock-rebound-gathers-pace-as-oil-shock-drives-ev-sales-boom',
    readTimeMin: 4,
  },
  {
    title: "BYD Delivers Steeper-Than-Expected Profit Drop Amid EV Price War",
    summary: 'BYD\'s Q4 net income fell 38% to 9.3 billion yuan ($1.3B) as the EV price war intensified. Revenue dropped about 14% to 237.7 billion yuan, but the company maintains its global expansion plans.',
    source: 'Bloomberg',
    category: 'market',
    imageEmoji: '\u{1F4B8}',
    image: 'https://picsum.photos/seed/byd-profit-drop/800/400',
    url: 'https://www.bloomberg.com/news/articles/2026-03-27/byd-delivers-steeper-than-expected-profit-drop-amid-ev-price-war',
    readTimeMin: 5,
  },
  {
    title: 'BYD Eyes 25% Jump in Overseas Sales With 1.3 Million Target for 2026',
    summary: 'BYD aims to sell 1.3 million vehicles outside China in 2026, representing nearly 25% growth over 2025. The Brazilian factory is on track for 150,000 annual vehicle capacity by year-end.',
    source: 'Electric Cars Report',
    category: 'market',
    imageEmoji: '\u{1F30F}',
    image: 'https://picsum.photos/seed/byd-overseas-2026/800/400',
    url: 'https://electriccarsreport.com/2026/01/byd-eyes-25-jump-in-overseas-sales-with-1-3-million-target-for-2026/',
    readTimeMin: 4,
  },
  {
    title: 'BYD Sales Plunge in First Two Months of 2026 as Competitors Gain Ground',
    summary: 'BYD\'s combined January-February 2026 sales dipped roughly 36% as rivals like Geely and Leapmotor gained market share. The Chinese EV giant faces growing competition in its home market.',
    source: 'CNBC',
    category: 'market',
    imageEmoji: '\u{1F4CA}',
    image: 'https://picsum.photos/seed/byd-sales-plunge/800/400',
    url: 'https://www.cnbc.com/2026/03/05/drawdown-byd-chinese-ev-sales-mixed-results-holiday-lull.html',
    readTimeMin: 5,
  },
  {
    title: 'Tesla Stock True Believers Could Be Losing Faith',
    summary: 'Protective puts on TSLA have grown more expensive while bullish calls lost favor. Tesla\'s risk metric reached its highest level in three years as the company expects Q1 deliveries of about 367,000 vehicles.',
    source: 'CNBC',
    category: 'market',
    imageEmoji: '\u{1F4C9}',
    image: 'https://picsum.photos/seed/tesla-stock-faith/800/400',
    url: 'https://www.cnbc.com/2026/03/25/tesla-stock-true-believers-could-be-losing-faith.html',
    readTimeMin: 5,
  },
  {
    title: 'Global EV Charging Stations to Surpass 9 Million by 2026',
    summary: 'Global public EV charging infrastructure is projected to reach 9.01 million stations worldwide. Europe alone is set to add 219,000 public chargers, bringing its total to 1.47 million.',
    source: 'Digitimes',
    category: 'market',
    imageEmoji: '\u26A1',
    image: 'https://picsum.photos/seed/9m-chargers-global/800/400',
    url: 'https://www.digitimes.com/news/a20260309PD213/china-europe-ev-charging-infrastructure-2026.html',
    readTimeMin: 4,
  },

  // ═══════════════════════════════════════════════════════
  // TECH — Battery breakthroughs, charging innovation
  // ═══════════════════════════════════════════════════════
  {
    title: 'Sodium-Ion EV Battery Breakthrough Delivers 11-Min Charging and 450km Range',
    summary: 'A major sodium-ion battery breakthrough achieves 170+ Wh/kg energy density with just 11-minute charging to 80%. CATL and Changan unveiled the world\'s first mass-produced EV with sodium-ion cells.',
    source: 'Electrek',
    category: 'tech',
    imageEmoji: '\u{1F50B}',
    image: 'https://electrek.co/wp-content/uploads/sites/3/2026/03/Sodium-ion-EV-battery-breakthrough-6.jpeg?quality=82&strip=all&w=1400',
    url: 'https://electrek.co/2026/03/25/sodium-ion-ev-battery-delivers-11-min-charging-450-km-range/',
    readTimeMin: 5,
  },
  {
    title: "What's Next for EV Batteries in 2026",
    summary: 'MIT Technology Review explores the frontier of EV battery tech including solid-state cells targeting 400-500 Wh/kg and lithium-metal anodes. Battery pack prices have dropped to $108/kWh, down 8% since 2024.',
    source: 'MIT Technology Review',
    category: 'tech',
    imageEmoji: '\u{1F9EA}',
    image: 'https://picsum.photos/seed/mit-ev-batteries/800/400',
    url: 'https://www.technologyreview.com/2026/02/02/1132042/whats-next-for-ev-batteries-in-2026/',
    readTimeMin: 7,
  },
  {
    title: 'Solid-State Batteries 2026: How the Technology Is Finally Reaching Commercial Use',
    summary: 'Toyota, BMW, and Hyundai are targeting limited commercial deployment of solid-state batteries between 2026-2028. The electric Dodge Charger will be the first EV to launch with Factorial\'s solid-state cells.',
    source: 'To7 Motor',
    category: 'tech',
    imageEmoji: '\u{1F9EA}',
    image: 'https://to7motor.com/wp-content/uploads/2026/02/solid-state-battery-ebike-1-scaled-600x432-1.png',
    url: 'https://to7motor.com/solid-state-batteries-2026-commercial-reality',
    readTimeMin: 6,
  },
  {
    title: 'A Solid-State EV Battery Standard Will Be Released in China in 2026',
    summary: 'China is preparing to introduce its first solid-state EV battery standard in July 2026, paving the way for mass commercialization. MG Motor plans to bring semi-solid-state battery tech to Europe by year-end.',
    source: 'Electrek',
    category: 'tech',
    imageEmoji: '\u{1F1E8}\u{1F1F3}',
    image: 'https://electrek.co/wp-content/uploads/sites/3/2025/11/All-solid-state-EV-batteries-China.jpeg?quality=82&strip=all',
    url: 'https://electrek.co/2026/02/11/solid-state-ev-battery-standard-china-2026/',
    readTimeMin: 5,
  },
  {
    title: 'Sodium-Ion Batteries: 10 Breakthrough Technologies 2026',
    summary: 'MIT Technology Review names sodium-ion batteries as one of the top 10 breakthrough technologies of 2026. The cheaper, more sustainable alternative to lithium is nearing mass production for passenger EVs.',
    source: 'MIT Technology Review',
    category: 'tech',
    imageEmoji: '\u{1F3C6}',
    image: 'https://picsum.photos/seed/mit-sodium-ion/800/400',
    url: 'https://www.technologyreview.com/2026/01/12/1129991/sodium-ion-batteries-2026-breakthrough-technology/',
    readTimeMin: 6,
  },
  {
    title: 'BYD\'s New Seal EV to Feature 1,500kW Flash Charging at Under A$35,000',
    summary: 'BYD launches the Seal 07 EV with its revolutionary Flash Charging technology, capable of charging 10-70% in just 5 minutes at 1,500kW. The vehicle is priced at under A$35,000.',
    source: 'The Driven',
    category: 'tech',
    imageEmoji: '\u26A1',
    image: 'https://thedriven.io/wp-content/uploads/2026/03/2026-BYD-Seal-07-EV-Front.jpg',
    url: 'https://thedriven.io/2026/03/08/byds-new-seal-ev-model-to-feature-1500-kw-flash-charging-at-under-a35000/',
    readTimeMin: 5,
  },
  {
    title: 'EV Charging in 2026 Is About to Change in Three Important Ways',
    summary: 'The focus shifts from charger quantity to reliability, with faster sessions, wider NACS access, and AI-driven energy management. Automakers are integrating real-time station availability into navigation systems.',
    source: 'GreenCars',
    category: 'tech',
    imageEmoji: '\u{1F504}',
    image: 'https://cdn.prod.website-files.com/5ec85520c4dfff034b036be2/69bb42999b19c1fddcdd7485_EV-charging-residential-hero.webp',
    url: 'https://www.greencars.com/news/ev-charging-in-2026-is-about-to-change-in-three-important-ways',
    readTimeMin: 5,
  },
  {
    title: '2026 EV Charging Industry Predictions and Trends',
    summary: 'Ultra-fast 350kW+ charging is gaining traction globally. EVgo plans 500+ NACS connectors by year-end, and AI-driven energy management is becoming foundational for reliable, cost-effective EV charging.',
    source: 'Driivz',
    category: 'tech',
    imageEmoji: '\u{1F52E}',
    image: 'https://driivz.com/wp-content/uploads/2025/12/EV-Charging-.webp',
    url: 'https://driivz.com/blog/2026-ev-charging-industry-predictions-and-trends/',
    readTimeMin: 6,
  },

  // ═══════════════════════════════════════════════════════
  // REVIEW — Real car reviews from Autocar and others
  // ═══════════════════════════════════════════════════════
  {
    title: '2026 Mercedes-Benz GLC Electric Review',
    summary: 'The GLC EQ 400 4Matic delivers 483bhp with dual motors and a maximum range of 433 miles. Autocar\'s full road test finds a thoroughly capable electric SUV with rapid charging capability.',
    source: 'Autocar',
    category: 'review',
    imageEmoji: '\u2B50',
    image: 'https://images.cdn.autocar.co.uk/sites/autocar.co.uk/files/mercedes-glc-review-2026-001.jpg',
    url: 'https://www.autocar.co.uk/car-review/mercedes-benz/glc-electric',
    readTimeMin: 8,
  },
  {
    title: '2026 Mercedes-Benz CLA Electric Review',
    summary: 'The new CLA Electric impresses with a balanced suspension, configurable drivetrain, and comfortable driving position. Autocar calls it a thoroughly impressive and enjoyable electric sedan.',
    source: 'Autocar',
    category: 'review',
    imageEmoji: '\u{1F31F}',
    image: 'https://images.cdn.autocar.co.uk/sites/autocar.co.uk/files/01-mercedes-benz-cla-ev-2026-autocar-road-test-review-front-driving-lead.jpg',
    url: 'https://www.autocar.co.uk/car-review/mercedes-benz/cla-electric',
    readTimeMin: 7,
  },
  {
    title: '2026 Porsche Macan Electric Review',
    summary: 'The Macan 4 Electric outshines even the top-rung Macan Turbo variant. All Macans share an appealing cabin and rapid charging, but the cheaper car shines with superior handling and impressive range.',
    source: 'Autocar',
    category: 'review',
    imageEmoji: '\u{1F3CE}\u{FE0F}',
    image: 'https://images.cdn.autocar.co.uk/sites/autocar.co.uk/files/porsche-macan-ev-review-2025-001_0.jpg',
    url: 'https://www.autocar.co.uk/car-review/porsche/macan-electric',
    readTimeMin: 8,
  },
  {
    title: '2026 Citroen e-C5 Aircross Review',
    summary: 'A 421-mile electric family car for less than \u00A333,000 \u2014 Autocar calls it one of the smartest EV buys of 2026. Practical, affordable, and with genuinely impressive range for the price.',
    source: 'Autocar',
    category: 'review',
    imageEmoji: '\u{1F44D}',
    image: 'https://images.cdn.autocar.co.uk/sites/autocar.co.uk/files/citroen-e-c5-aircross-review-2025-001_0.jpg',
    url: 'https://www.autocar.co.uk/car-review/citroen/e-c5-aircross',
    readTimeMin: 7,
  },
  {
    title: 'Over 20 New EVs Are Coming in 2026 \u2014 These Are the Seven Most Exciting',
    summary: 'InsideEVs picks the seven most anticipated electric vehicles arriving in 2026, from budget-friendly compacts to high-performance luxury models. The year promises unprecedented choice for EV buyers.',
    source: 'InsideEVs',
    category: 'review',
    imageEmoji: '\u{1F525}',
    image: 'https://picsum.photos/seed/7-best-evs-2026/800/400',
    url: 'https://insideevs.com/news/782572/2026-ev-predictions-best-cars/',
    readTimeMin: 7,
  },
];

export const newsService = {
  /**
   * Get today's curated news feed (changes daily)
   */
  getDailyFeed(userVehicleMake?: string): NewsArticle[] {
    const rand = dailySeed();
    const today = new Date().toISOString().split('T')[0];

    // Shuffle pool using daily seed
    const shuffled = [...ARTICLE_POOL].sort(() => rand() - 0.5);

    // Pick 8-10 articles for today
    const count = 8 + Math.floor(rand() * 3);
    const selected = shuffled.slice(0, count);

    return selected.map((article, i) => {
      const hoursAgo = Math.floor(rand() * 24);
      const published = new Date();
      published.setHours(published.getHours() - hoursAgo);

      return {
        ...article,
        id: `news-${today}-${i}`,
        publishedAt: published.toISOString(),
        trending: i < 3,
        aiPick: userVehicleMake
          ? article.title.toLowerCase().includes(userVehicleMake.toLowerCase()) ||
            (article.category === 'egypt' && rand() > 0.5)
          : false,
      };
    });
  },

  /**
   * Get category-filtered articles
   */
  getByCategory(category: NewsArticle['category'], userVehicleMake?: string): NewsArticle[] {
    return this.getDailyFeed(userVehicleMake).filter(a => a.category === category);
  },

  /**
   * Get trending articles only
   */
  getTrending(userVehicleMake?: string): NewsArticle[] {
    return this.getDailyFeed(userVehicleMake).filter(a => a.trending);
  },
};
