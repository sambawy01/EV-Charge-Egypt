export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: 'egypt' | 'global' | 'tech' | 'market' | 'review';
  imageEmoji: string;
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
  // Egypt-specific
  { title: 'Egypt Targets 100,000 EVs on Roads by 2030', summary: 'The Egyptian government announces new incentives including customs exemptions and subsidized charging infrastructure to accelerate EV adoption across the country.', source: 'Daily News Egypt', category: 'egypt', imageEmoji: '\u{1F1EA}\u{1F1EC}', readTimeMin: 4 },
  { title: 'Elsewedy Plug Expands to 150 Stations Nationwide', summary: 'Egypt\'s largest charging network operator Elsewedy Plug announces aggressive expansion plan covering Upper Egypt and the North Coast by Q4 2026.', source: 'Enterprise', category: 'egypt', imageEmoji: '\u26A1', readTimeMin: 3 },
  { title: 'BYD Atto 3 Becomes Egypt\'s Best-Selling EV', summary: 'With over 5,000 units sold, the BYD Atto 3 has captured 40% of Egypt\'s electric vehicle market, driven by competitive pricing and strong dealer network.', source: 'Ahram Online', category: 'egypt', imageEmoji: '\u{1F697}', readTimeMin: 5 },
  { title: 'New Administrative Capital Gets 50 EV Charging Points', summary: 'Egypt\'s New Administrative Capital launches its smart mobility initiative with 50 fast charging stations across government and commercial districts.', source: 'Cairo Scene', category: 'egypt', imageEmoji: '\u{1F3D9}\u{FE0F}', readTimeMin: 3 },
  { title: 'Egypt\'s First EV Battery Assembly Plant Opens in Ain Sokhna', summary: 'A joint venture between Egyptian and Chinese investors inaugurates the country\'s first lithium battery assembly facility in the Ain Sokhna Economic Zone.', source: 'Reuters', category: 'egypt', imageEmoji: '\u{1F50B}', readTimeMin: 4 },
  { title: 'Cairo-Alexandria Highway Gets Ultra-Fast 350kW Chargers', summary: 'Infinity EV partners with highway operators to install 350kW CCS2 chargers every 50km along Egypt\'s busiest highway corridor.', source: 'Egypt Today', category: 'egypt', imageEmoji: '\u{1F6E3}\u{FE0F}', readTimeMin: 3 },
  { title: 'Egyptian Startup Launches V2G Technology Pilot', summary: 'A Cairo-based startup begins testing vehicle-to-grid technology, allowing EV owners to sell excess energy back to the national grid during peak demand.', source: 'Wamda', category: 'egypt', imageEmoji: '\u{1F50C}', readTimeMin: 5 },

  // Global
  { title: 'Tesla Unveils Next-Gen 4680 Battery with 50% More Range', summary: 'Tesla\'s new battery cells promise 500-mile range for Model S and dramatically faster Supercharging speeds up to 400kW.', source: 'Electrek', category: 'global', imageEmoji: '\u{1F50B}', readTimeMin: 6 },
  { title: 'Global EV Sales Surpass 20 Million Units in 2026', summary: 'Electric vehicle sales hit a historic milestone with China, Europe, and the US leading adoption. EVs now represent 25% of all new car sales worldwide.', source: 'Bloomberg', category: 'global', imageEmoji: '\u{1F4C8}', readTimeMin: 5 },
  { title: 'Solid-State Batteries Enter Mass Production', summary: 'Toyota and Samsung SDI begin mass production of solid-state batteries, promising 1000km range and 10-minute charging times by 2027.', source: 'The Verge', category: 'global', imageEmoji: '\u{1F9EA}', readTimeMin: 7 },
  { title: 'EU Bans New Petrol Cars Starting 2035', summary: 'The European Union formally implements its ICE ban, requiring all new vehicles sold from 2035 to be zero-emission.', source: 'BBC News', category: 'global', imageEmoji: '\u{1F30D}', readTimeMin: 4 },
  { title: 'Rivian R3 Becomes Most Affordable Premium EV at $35K', summary: 'Rivian\'s compact crossover R3 launches with a starting price of $35,000, challenging Tesla Model Y\'s dominance in the mid-range EV market.', source: 'Car and Driver', category: 'global', imageEmoji: '\u{1F699}', readTimeMin: 5 },

  // Tech
  { title: 'Wireless EV Charging Roads Tested in Sweden', summary: 'Sweden opens the world\'s first permanent wireless charging highway, allowing EVs to charge while driving at highway speeds.', source: 'Wired', category: 'tech', imageEmoji: '\u{1F6E4}\u{FE0F}', readTimeMin: 6 },
  { title: 'AI-Powered Battery Management Systems Cut Degradation 30%', summary: 'New machine learning algorithms can predict and prevent battery stress in real-time, extending EV battery life by up to 30%.', source: 'MIT Technology Review', category: 'tech', imageEmoji: '\u{1F916}', readTimeMin: 5 },
  { title: 'Bi-Directional Charging Standard Approved Globally', summary: 'ISO releases unified V2G standard, enabling all EVs to power homes, buildings, and the grid \u2014 turning every EV into a mobile power station.', source: 'IEEE Spectrum', category: 'tech', imageEmoji: '\u{1F504}', readTimeMin: 4 },
  { title: 'Megawatt Charging for Electric Trucks Goes Live', summary: 'The first 3.75MW charging station for electric semi-trucks opens in Nevada, capable of adding 500km range in just 15 minutes.', source: 'TechCrunch', category: 'tech', imageEmoji: '\u{1F69B}', readTimeMin: 5 },

  // Market
  { title: 'EV Charging Market to Hit $200B by 2030', summary: 'McKinsey projects the global EV charging infrastructure market will reach $200 billion, with Africa and Middle East as the fastest-growing regions.', source: 'McKinsey', category: 'market', imageEmoji: '\u{1F4B0}', readTimeMin: 6 },
  { title: 'Used EV Prices Drop 25% \u2014 Best Time to Buy', summary: 'The secondhand EV market sees significant price corrections as new model supply increases, making EVs more accessible than ever.', source: 'Autotrader', category: 'market', imageEmoji: '\u{1F4C9}', readTimeMin: 4 },
  { title: 'Insurance Companies Offer 30% Discount for EV Drivers', summary: 'Major insurers introduce EV-specific policies with lower premiums, citing fewer accidents and lower maintenance costs for electric vehicles.', source: 'Financial Times', category: 'market', imageEmoji: '\u{1F6E1}\u{FE0F}', readTimeMin: 3 },

  // Reviews
  { title: 'BYD Seal Review: The Tesla Model 3 Killer?', summary: 'We test BYD\'s premium sedan on Egyptian roads \u2014 impressive range, silky ride, but how does the charging experience compare?', source: 'Top Gear', category: 'review', imageEmoji: '\u2B50', readTimeMin: 8 },
  { title: 'Hyundai Ioniq 6: Long-Range Champion Tested', summary: 'The Ioniq 6 delivers a real-world 520km on a single charge in our Egypt highway test. Plus, 18-minute 10-80% fast charging.', source: 'Autocar', category: 'review', imageEmoji: '\u{1F3C6}', readTimeMin: 7 },
  { title: 'Xiaomi SU7: China\'s Tech Giant Takes on Tesla', summary: 'We review Xiaomi\'s first EV \u2014 a tech-packed sedan with 800V architecture, 5-minute voice assistant, and a price that undercuts everything.', source: 'Car Magazine', category: 'review', imageEmoji: '\u{1F4F1}', readTimeMin: 6 },
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
