export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: 'global' | 'tech' | 'review' | 'market';
  image: string;
  imageEmoji: string;
  videoUrl?: string;
  readTimeMin: number;
  publishedAt: string;
  url: string;
  trending: boolean;
  aiPick: boolean;
}

interface RSSFeed {
  name: string;
  url: string;
  category: NewsArticle['category'];
  emoji: string;
}

const RSS_FEEDS: RSSFeed[] = [
  { name: 'Electrek', url: 'https://electrek.co/feed/', category: 'global', emoji: '\u26A1' },
  { name: 'InsideEVs', url: 'https://insideevs.com/rss/news/', category: 'review', emoji: '\uD83D\uDE97' },
  { name: 'CleanTechnica', url: 'https://cleantechnica.com/feed/', category: 'tech', emoji: '\uD83C\uDF3F' },
  { name: 'The Driven', url: 'https://thedriven.io/feed/', category: 'global', emoji: '\uD83D\uDD0B' },
  { name: 'Green Car Reports', url: 'https://www.greencarreports.com/rss', category: 'review', emoji: '\uD83C\uDF0D' },
];

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Cache fetched articles for 1 hour
let _cache: { articles: NewsArticle[]; fetchedAt: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, '\u2019')
    .replace(/&#8216;/g, '\u2018')
    .replace(/&#8220;/g, '\u201C')
    .replace(/&#8221;/g, '\u201D')
    .replace(/&#8211;/g, '\u2013')
    .replace(/&#8212;/g, '\u2014')
    .replace(/&#038;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function stripHTML(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

function makeId(feedName: string, link: string): string {
  // Simple hash without Buffer (works in browser)
  let hash = 0;
  for (let i = 0; i < link.length; i++) {
    const char = link.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `rss-${feedName.replace(/\s+/g, '')}-${Math.abs(hash).toString(36)}`;
}

function parseRSSItems(xmlText: string, feed: RSSFeed): NewsArticle[] {
  const articles: NewsArticle[] = [];

  // Simple XML parsing without external library
  const items = xmlText.match(/<item[\s\S]*?<\/item>/gi) || [];

  for (const item of items.slice(0, 8)) { // max 8 per feed
    const getTag = (tag: string): string => {
      const match =
        item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i')) ||
        item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
      return match ? match[1].trim() : '';
    };

    const title = decodeHTMLEntities(stripHTML(getTag('title')));
    const rawDescription = getTag('description');
    const description = decodeHTMLEntities(stripHTML(rawDescription));
    const link = getTag('link');
    const pubDate = getTag('pubDate');

    // Extract image from content or media tags
    let image = '';
    const mediaMatch =
      item.match(/<media:content[^>]+url="([^"]+)"/i) ||
      item.match(/<media:thumbnail[^>]+url="([^"]+)"/i) ||
      item.match(/<enclosure[^>]+url="([^"]+)"/i) ||
      rawDescription.match(/<img[^>]+src="([^"]+)"/i);
    if (mediaMatch) {
      image = mediaMatch[1];
    }

    // Also check content:encoded for images
    if (!image) {
      const contentEncoded = getTag('content:encoded') || '';
      const imgMatch = contentEncoded.match(/src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i);
      if (imgMatch) image = imgMatch[1];
    }

    // Check raw description HTML for images too
    if (!image) {
      const imgMatch = rawDescription.match(/src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i);
      if (imgMatch) image = imgMatch[1];
    }

    if (!title || !link) continue;

    // Filter: skip negative articles (layoffs, recalls, crashes, lawsuits, deaths)
    const lowerTitle = title.toLowerCase();
    const negativeKeywords = [
      'recall', 'crash', 'fire', 'lawsuit', 'layoff', 'cut jobs', 'death',
      'fatal', 'accident', 'fraud', 'scandal', 'bankrupt', 'shutdown', 'closing',
    ];
    if (negativeKeywords.some((kw) => lowerTitle.includes(kw))) continue;

    const summary = description.substring(0, 200) + (description.length > 200 ? '...' : '');
    const wordCount = description.split(/\s+/).length;

    articles.push({
      id: makeId(feed.name, link),
      title,
      summary,
      source: feed.name,
      category: detectCategory(title, feed.category),
      image: image || `https://picsum.photos/seed/${encodeURIComponent(title.slice(0, 20))}/800/400`,
      imageEmoji: feed.emoji,
      readTimeMin: Math.max(2, Math.round(wordCount / 200)),
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      url: link,
      trending: false,
      aiPick: false,
    });
  }

  return articles;
}

function detectCategory(title: string, defaultCat: NewsArticle['category']): NewsArticle['category'] {
  const lower = title.toLowerCase();
  if (lower.includes('review') || lower.includes('test drive') || lower.includes('first drive') || lower.includes('hands-on')) return 'review';
  if (lower.includes('battery') || lower.includes('charging') || lower.includes('solid-state') || lower.includes('kwh') || lower.includes('technology')) return 'tech';
  if (lower.includes('sales') || lower.includes('market') || lower.includes('price') || lower.includes('cost') || lower.includes('investment') || lower.includes('stock')) return 'market';
  return defaultCat;
}

async function fetchFeed(feed: RSSFeed): Promise<NewsArticle[]> {
  try {
    const url = CORS_PROXY + encodeURIComponent(feed.url);
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return [];
    const text = await response.text();
    return parseRSSItems(text, feed);
  } catch (err) {
    console.warn(`[newsService] Failed to fetch ${feed.name}:`, err);
    return [];
  }
}

export const newsService = {
  async getDailyFeed(userVehicleMake?: string): Promise<NewsArticle[]> {
    // Return cache if fresh
    if (_cache && Date.now() - _cache.fetchedAt < CACHE_TTL) {
      return this._applyUserContext(_cache.articles, userVehicleMake);
    }

    // Fetch all feeds in parallel
    const results = await Promise.allSettled(RSS_FEEDS.map((feed) => fetchFeed(feed)));

    let articles: NewsArticle[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        articles = [...articles, ...result.value];
      }
    }

    // Sort by publish date (newest first)
    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Remove duplicates by title similarity
    const seen = new Set<string>();
    articles = articles.filter((a) => {
      const key = a.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Mark top 3 as trending
    articles.slice(0, 3).forEach((a) => (a.trending = true));

    // Cache
    _cache = { articles, fetchedAt: Date.now() };

    // If fetch returned nothing (all feeds failed), fall back to static pool
    if (articles.length === 0) {
      return this._getStaticFallback(userVehicleMake);
    }

    return this._applyUserContext(articles, userVehicleMake);
  },

  async getByCategory(category: NewsArticle['category'], userVehicleMake?: string): Promise<NewsArticle[]> {
    const all = await this.getDailyFeed(userVehicleMake);
    return all.filter((a) => a.category === category);
  },

  async getTrending(userVehicleMake?: string): Promise<NewsArticle[]> {
    const all = await this.getDailyFeed(userVehicleMake);
    return all.filter((a) => a.trending);
  },

  _applyUserContext(articles: NewsArticle[], userVehicleMake?: string): NewsArticle[] {
    if (!userVehicleMake) return articles;
    return articles.map((a) => ({
      ...a,
      aiPick:
        a.title.toLowerCase().includes(userVehicleMake.toLowerCase()) ||
        a.summary.toLowerCase().includes(userVehicleMake.toLowerCase()),
    }));
  },

  // Static fallback if all RSS feeds fail
  _getStaticFallback(userVehicleMake?: string): NewsArticle[] {
    const now = new Date();
    const fallback: NewsArticle[] = [
      {
        id: 'fb-1',
        title: 'Global EV Sales Hit Record 20 Million in 2026',
        summary: 'Electric vehicle adoption accelerates worldwide with China, Europe, and North America leading the charge toward sustainable transportation.',
        source: 'Bloomberg',
        category: 'market',
        image: 'https://picsum.photos/seed/ev-sales/800/400',
        imageEmoji: '\uD83D\uDCC8',
        readTimeMin: 4,
        publishedAt: now.toISOString(),
        url: 'https://bloomberg.com',
        trending: true,
        aiPick: false,
      },
      {
        id: 'fb-2',
        title: 'Solid-State Batteries Promise 1000km Range by 2027',
        summary: 'Toyota and Samsung begin mass production of next-generation solid-state battery cells that could revolutionize electric vehicle range and charging speed.',
        source: 'MIT Tech Review',
        category: 'tech',
        image: 'https://picsum.photos/seed/ev-battery/800/400',
        imageEmoji: '\uD83D\uDD0B',
        readTimeMin: 5,
        publishedAt: now.toISOString(),
        url: 'https://technologyreview.com',
        trending: true,
        aiPick: false,
      },
      {
        id: 'fb-3',
        title: "BYD Launches Next-Gen Blade Battery with 45% More Density",
        summary: "BYD unveils its second-generation Blade Battery technology featuring significantly improved energy density while maintaining its renowned safety record.",
        source: 'Electrek',
        category: 'tech',
        image: 'https://picsum.photos/seed/ev-byd/800/400',
        imageEmoji: '\u26A1',
        readTimeMin: 4,
        publishedAt: now.toISOString(),
        url: 'https://electrek.co',
        trending: true,
        aiPick: false,
      },
      {
        id: 'fb-4',
        title: 'Egypt Opens 50 New Fast Charging Stations on Highway Network',
        summary: 'The Egyptian government accelerates EV infrastructure with new ultra-fast charging stations covering Cairo-Alexandria and Cairo-Hurghada corridors.',
        source: 'Daily News Egypt',
        category: 'global',
        image: 'https://picsum.photos/seed/ev-egypt/800/400',
        imageEmoji: '\uD83C\uDDEA\uD83C\uDDEC',
        readTimeMin: 3,
        publishedAt: now.toISOString(),
        url: 'https://dailynewsegypt.com',
        trending: false,
        aiPick: false,
      },
      {
        id: 'fb-5',
        title: 'Tesla Supercharger Network Expands to 75,000 Stations Globally',
        summary: 'Tesla continues rapid expansion of its Supercharger network, now open to all EV brands through the NACS standard adopted by major automakers.',
        source: 'Electrek',
        category: 'global',
        image: 'https://picsum.photos/seed/ev-tesla/800/400',
        imageEmoji: '\u26A1',
        readTimeMin: 5,
        publishedAt: now.toISOString(),
        url: 'https://electrek.co',
        trending: false,
        aiPick: false,
      },
      {
        id: 'fb-6',
        title: 'Wireless EV Charging Roads Successfully Tested at Highway Speeds',
        summary: 'Sweden completes successful trials of dynamic wireless charging roads, allowing electric vehicles to charge while driving at up to 120 km/h.',
        source: 'Wired',
        category: 'tech',
        image: 'https://picsum.photos/seed/ev-wireless/800/400',
        imageEmoji: '\uD83D\uDEE4\uFE0F',
        readTimeMin: 6,
        publishedAt: now.toISOString(),
        url: 'https://wired.com',
        trending: false,
        aiPick: false,
      },
    ];
    return this._applyUserContext(fallback, userVehicleMake);
  },
};
