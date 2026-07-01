export interface RSSSource {
  name: string;
  feedUrl: string;
  url: string;
  category: string;
  authority: number;
}

// 33 working feeds. Probed and pruned 2026-07-01:
// - Removed NBC News: image CDN (media-cldnry.s-nbcnews.com) hotlink-blocks,
//   leaving broken-image icons next to most NBC articles. Replaced with
//   AP News (true global wire service) plus 5 sources that bring actual
//   international diversity worldwire was missing (France 24, DW, ABC AU,
//   The Diplomat, MIT Tech Review, Phys.org).
// - Previously pruned (2026-06-30): Reuters (auth), Politico (403),
//   AP News /index.rss (moved — now uses /apf-topnews + /apf-intlnews),
//   WSJ US/business (paywall, WSJ World kept), NPR Health (404),
//   Scientific American (404), USA Today (406), Bloomberg / FT (paywall
//   content — replaced by MarketWatch / Yahoo Finance / Investing.com /
//   Business Insider / OilPrice.com).
export const defaultSources: RSSSource[] = [
  // World
  { name: "BBC World", feedUrl: "https://feeds.bbci.co.uk/news/world/rss.xml", url: "https://www.bbc.com/news/world", category: "world", authority: 10 },
  { name: "AP News International", feedUrl: "https://apnews.com/apf-intlnews", url: "https://apnews.com", category: "world", authority: 9 },
  { name: "Guardian World", feedUrl: "https://www.theguardian.com/world/rss", url: "https://www.theguardian.com/world", category: "world", authority: 9 },
  { name: "Al Jazeera", feedUrl: "https://www.aljazeera.com/xml/rss/all.xml", url: "https://www.aljazeera.com", category: "world", authority: 9 },
  { name: "WSJ World", feedUrl: "https://feeds.a.dj.com/rss/RSSWorldNews.xml", url: "https://www.wsj.com/news/world", category: "world", authority: 9 },
  { name: "France 24", feedUrl: "https://www.france24.com/en/rss", url: "https://www.france24.com/en", category: "world", authority: 8 },
  { name: "Deutsche Welle", feedUrl: "https://rss.dw.com/xml/rss-en-all", url: "https://www.dw.com", category: "world", authority: 8 },
  { name: "ABC Australia", feedUrl: "https://www.abc.net.au/news/feed/51120/rss.xml", url: "https://www.abc.net.au/news/world/", category: "world", authority: 7 },
  { name: "The Diplomat", feedUrl: "https://thediplomat.com/feed/", url: "https://thediplomat.com", category: "world", authority: 7 },

  // US & Politics
  { name: "NPR Politics", feedUrl: "https://feeds.npr.org/1014/rss.xml", url: "https://www.npr.org/sections/politics/", category: "us", authority: 9 },
  { name: "AP News Top", feedUrl: "https://apnews.com/apf-topnews", url: "https://apnews.com", category: "us", authority: 8 },
  { name: "CNN Top", feedUrl: "http://rss.cnn.com/rss/edition.rss", url: "https://www.cnn.com", category: "us", authority: 8 },
  { name: "CBS News", feedUrl: "https://www.cbsnews.com/latest/rss/main", url: "https://www.cbsnews.com", category: "us", authority: 8 },

  // Business
  // Bloomberg + FT removed 2026-06-30 — paywalled article pages meant
  // crawl4ai couldn't extract content, so every story showed up with an
  // empty body. Replaced with five scrapeable sources covering US/global
  // markets and commodities so each article gets a real TL;DR + body.
  { name: "MarketWatch", feedUrl: "https://feeds.marketwatch.com/marketwatch/topstories/", url: "https://www.marketwatch.com", category: "business", authority: 9 },
  { name: "Yahoo Finance", feedUrl: "https://finance.yahoo.com/news/rssindex", url: "https://finance.yahoo.com", category: "business", authority: 9 },
  { name: "Investing.com", feedUrl: "https://www.investing.com/rss/news.rss", url: "https://www.investing.com", category: "business", authority: 8 },
  { name: "Business Insider Markets", feedUrl: "https://markets.businessinsider.com/rss/news", url: "https://markets.businessinsider.com", category: "business", authority: 8 },
  { name: "OilPrice.com", feedUrl: "https://oilprice.com/rss/main", url: "https://oilprice.com", category: "business", authority: 8 },
  { name: "BBC Business", feedUrl: "https://feeds.bbci.co.uk/news/business/rss.xml", url: "https://www.bbc.com/news/business", category: "business", authority: 9 },
  { name: "CNBC Top", feedUrl: "https://www.cnbc.com/id/100003114/device/rss/rss.html", url: "https://www.cnbc.com", category: "business", authority: 9 },

  // Tech
  { name: "The Verge", feedUrl: "https://www.theverge.com/rss/index.xml", url: "https://www.theverge.com", category: "tech", authority: 9 },
  { name: "TechCrunch", feedUrl: "https://techcrunch.com/feed/", url: "https://techcrunch.com", category: "tech", authority: 9 },
  { name: "Ars Technica", feedUrl: "https://feeds.arstechnica.com/arstechnica/index", url: "https://arstechnica.com", category: "tech", authority: 9 },
  { name: "Wired", feedUrl: "https://www.wired.com/feed/rss", url: "https://www.wired.com", category: "tech", authority: 8 },
  { name: "MIT Technology Review", feedUrl: "https://www.technologyreview.com/feed/", url: "https://www.technologyreview.com", category: "tech", authority: 8 },

  // Science & Health
  { name: "Science Daily", feedUrl: "https://www.sciencedaily.com/rss/all.xml", url: "https://www.sciencedaily.com", category: "science", authority: 8 },
  { name: "Phys.org", feedUrl: "https://phys.org/rss-feed/", url: "https://phys.org", category: "science", authority: 7 },
  { name: "NPR Shots Health", feedUrl: "https://feeds.npr.org/1128/rss.xml", url: "https://www.npr.org/sections/health/", category: "science", authority: 9 },
  { name: "NPR Health Care", feedUrl: "https://feeds.npr.org/103537970/rss.xml", url: "https://www.npr.org/sections/health-care/", category: "science", authority: 9 },
  { name: "STAT News", feedUrl: "https://www.statnews.com/feed/", url: "https://www.statnews.com", category: "science", authority: 8 },

  // Sports
  { name: "ESPN", feedUrl: "https://www.espn.com/espn/rss/news", url: "https://www.espn.com", category: "sports", authority: 9 },
  { name: "BBC Sport", feedUrl: "https://feeds.bbci.co.uk/sport/rss.xml", url: "https://www.bbc.com/sport", category: "sports", authority: 9 },
  { name: "Guardian Sport", feedUrl: "https://www.theguardian.com/sport/rss", url: "https://www.theguardian.com/sport", category: "sports", authority: 8 },

  // Culture
  { name: "Guardian Culture", feedUrl: "https://www.theguardian.com/culture/rss", url: "https://www.theguardian.com/culture", category: "culture", authority: 8 },
  { name: "NY Times Arts", feedUrl: "https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml", url: "https://www.nytimes.com/section/arts", category: "culture", authority: 9 },
  { name: "Variety", feedUrl: "https://variety.com/feed/", url: "https://variety.com", category: "culture", authority: 9 },
];

export const categoryMapping: Record<string, string> = {
  world: "world",
  us: "us",
  business: "business",
  tech: "tech",
  science: "science",
  sports: "sports",
  culture: "culture",
};
