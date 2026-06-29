# FinWire Pivot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pivot the `deepwire-finance/` copy of the DeepWire codebase into FinWire — a finance-news aggregation site with identical UI, scraping, and architecture, but with finance-only sources, categories, classifier vocabulary, and brand identity.

**Architecture:** Pure rewrite-of-content pivot. Every UI component, layout, worker, and the `jsdom + @mozilla/readability` scraper stay untouched. Only data, identifiers, and brand strings change. The original `/Users/somu/Downloads/deepwire/` repo is fully insulated.

**Tech Stack:** Astro 6.4 (static), TypeScript strict, Tailwind v4, better-sqlite3 + Drizzle, `rss-parser` + `cheerio` + `jsdom` + `@mozilla/readability`. **Adding** vitest for the one piece of code where TDD is meaningful (the classifier).

---

## Guiding Constraints

1. **UI parity is mandatory.** The `BaseLayout`, `AdminLayout`, all `src/components/`, all CSS, and the `global.css` design tokens must be byte-identical to the original. Touching them is a plan failure.
2. **No new dependencies** except `vitest` (and `@vitest/coverage-v8` only if requested) for the classifier test step.
3. **Every commit must leave the project buildable.** Deletions happen AFTER additions of replacements.
4. **Original `/Users/somu/Downloads/deepwire/` is read-only for this plan.** If any task accidentally modifies it, abort.

---

## File Structure Overview

**New files (10):**
- `vitest.config.ts`
- `tests/ai/classify.test.ts`
- `src/pages/markets.astro`
- `src/pages/stocks.astro`
- `src/pages/crypto.astro`
- `src/pages/banking.astro`
- `src/pages/fintech.astro`
- `src/pages/regulation.astro`
- `src/pages/economy.astro`
- `src/pages/forex.astro`

**Modified files (6):**
- `package.json` (add vitest devDep + test scripts; rename to `finwire`)
- `src/config.ts` (siteConfig + categories + navigation)
- `src/lib/ai/classify.ts` (CATEGORY_KEYWORDS + SOURCE_CATEGORY_HINTS)
- `src/lib/rss/sources.ts` (defaultSources + categoryMapping)
- `src/pages/index.astro` (category fetches + tile filter)
- `astro.config.mjs` (site URL)

**Modified worker files (3):**
- `workers/article-processing.ts` (SKIP_SOURCES)
- `workers/rss-ingestion.ts` (inline skip check)
- `workers/backfill.ts` (repurpose for SEC EDGAR)

**Modified docs (1):**
- `README.md` (full rewrite)

**Deleted files (10):**
- `src/pages/ai.astro`
- `src/pages/research.astro`
- `src/pages/startups.astro`
- `src/pages/security.astro`
- `src/pages/space.astro`
- `src/pages/semiconductors.astro`
- `src/pages/robotics.astro`
- `data/articles.json`
- `data/deepwire.db`
- `data/sources-state.json`

Total: 30 file operations across 14 tasks.

---

## Task 1: Add vitest test infrastructure

**Files:**
- Modify: `package.json` (add vitest devDep + two test scripts)
- Create: `vitest.config.ts`

- [ ] **Step 1: Add vitest to devDependencies**

Edit `package.json` — find the `devDependencies` block and add `"vitest": "^2.1.0"` as a new entry. Also find the `scripts` block and add these two lines:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Place them after the existing `"astro": "astro"` entry. Do not modify any other field.

- [ ] **Step 2: Install**

Run: `cd /Users/somu/Downloads/deepwire-finance && npm install`
Expected: adds vitest and its deps; exits 0; reports no `npm warn deprecated` regressions vs. the previous install (the existing 5 deprecation warnings are pre-existing and unrelated).

- [ ] **Step 3: Create vitest.config.ts**

Create `/Users/somu/Downloads/deepwire-finance/vitest.config.ts` with this exact content:

```ts
import { defineConfig } from "vitest/config";
import * as path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 4: Verify vitest is callable but no tests exist yet**

Run: `cd /Users/somu/Downloads/deepwire-finance && npx vitest run`
Expected: prints "No test files found" or equivalent (vitest's empty-state message), exits non-zero with code 1, but does not crash. If it errors out with a config parse failure, fix `vitest.config.ts`.

- [ ] **Step 5: Commit**

```bash
cd /Users/somu/Downloads/deepwire-finance
git add package.json package-lock.json vitest.config.ts
git -c user.name="kimchi" -c user.email="kimchi@local" commit -m "chore: add vitest for classifier tests"
```

---

## Task 2: Write failing classifier tests (TDD red)

**Files:**
- Create: `tests/ai/classify.test.ts`

- [ ] **Step 1: Create the tests file**

Create `/Users/somu/Downloads/deepwire-finance/tests/ai/classify.test.ts` with this exact content:

```ts
import { describe, it, expect } from "vitest";
import { classifyArticle, getPrimaryCategory } from "../../src/lib/ai/classify";

describe("classifyArticle — finance categories", () => {
  it("tags a crypto article as crypto", () => {
    const tags = classifyArticle(
      "Bitcoin surges past $100,000 as ETF inflows accelerate",
      "The price of bitcoin climbed to a new all-time high today, driven by spot ETF inflows from institutional investors. Ethereum also rallied."
    );
    expect(tags).toContain("crypto");
  });

  it("tags a banking article as banking", () => {
    const tags = classifyArticle(
      "JPMorgan reports record quarterly profit on strong lending",
      "The bank's net interest margin expanded as deposits grew. JPMorgan Chase beat analyst estimates."
    );
    expect(tags).toContain("banking");
  });

  it("tags a regulation article as regulation", () => {
    const tags = classifyArticle(
      "SEC charges hedge fund with insider trading",
      "The Securities and Exchange Commission filed a civil complaint alleging violations of federal securities law."
    );
    expect(tags).toContain("regulation");
  });

  it("tags a forex article as forex", () => {
    const tags = classifyArticle(
      "Dollar weakens against yen after BOJ signals rate hike",
      "The US dollar fell against the Japanese yen as the Bank of Japan hinted at tightening monetary policy. Currency traders repositioned."
    );
    expect(tags).toContain("forex");
  });

  it("tags an economy article as economy", () => {
    const tags = classifyArticle(
      "US inflation cools to 2.4 percent in latest CPI report",
      "Consumer prices rose less than expected, suggesting the Federal Reserve's interest rate policy is working. GDP growth also slowed."
    );
    expect(tags).toContain("economy");
  });

  it("tags a fintech article as fintech", () => {
    const tags = classifyArticle(
      "Stripe launches new embedded payments API for neobanks",
      "The fintech giant released a developer toolkit targeting digital banks and payment platforms. Stripe competes with Plaid and Adyen."
    );
    expect(tags).toContain("fintech");
  });

  it("does NOT match the old tech keywords (regression guard)", () => {
    const tags = classifyArticle(
      "OpenAI releases GPT-5 with improved reasoning",
      "The new large language model from OpenAI shows stronger performance on coding benchmarks and math."
    );
    expect(tags).not.toContain("ai");
    expect(tags).not.toContain("llms");
  });
});

describe("getPrimaryCategory — finance source hints", () => {
  it("falls back to source hint when article text has no keywords", () => {
    const cat = getPrimaryCategory(
      "Untitled market update",
      "no recognizable keywords here",
      "SEC Press Releases"
    );
    expect(cat).toBe("regulation");
  });

  it("returns crypto for a crypto article even with crypto source name", () => {
    const cat = getPrimaryCategory(
      "Ethereum staking yields climb",
      "ethereum staking rewards rose this week as more validators joined the network",
      "CoinDesk"
    );
    expect(cat).toBe("crypto");
  });
});
```

- [ ] **Step 2: Run tests to verify they FAIL**

Run: `cd /Users/somu/Downloads/deepwire-finance && npx vitest run tests/ai/classify.test.ts`
Expected: ALL tests FAIL. The classifier currently returns tech categories (`ai`, `llms`, etc.) for finance text, and the source-hint test fails because the source map still contains tech source names. The crypto/banking/regulation/forex/economy/fintech assertions all fail; the "does NOT match old tech keywords" test passes vacuously (the current classifier returns `ai` which we then check `not.toContain('ai')` — that fails).

Expected failure pattern: at least 7 of 9 tests failing with messages like "expected [ 'ai', 'llms' ] to contain 'crypto'".

- [ ] **Step 3: Commit the failing tests**

```bash
cd /Users/somu/Downloads/deepwire-finance
git add tests/ai/classify.test.ts
git -c user.name="kimchi" -c user.email="kimchi@local" commit -m "test: add failing classifier tests for finance categories"
```

---

## Task 3: Implement finance classifier maps (TDD green)

**Files:**
- Modify: `src/lib/ai/classify.ts` (replace `CATEGORY_KEYWORDS` and `SOURCE_CATEGORY_HINTS` blocks; function bodies unchanged)

- [ ] **Step 1: Replace CATEGORY_KEYWORDS**

Open `src/lib/ai/classify.ts`. Find the `CATEGORY_KEYWORDS` block (lines 12–83 in the original). Replace the entire block (the `export const CATEGORY_KEYWORDS: Record<string, string[]> = { ... };` declaration and its closing `};`) with this exact content:

```ts
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  markets: [
    "stock market", "wall street", "wall st", "equities", "equity market",
    "s&p 500", "s&p", "dow jones", "dow", "nasdaq", "russell 2000",
    "index fund", "broad market", "bull market", "bear market",
    "rally", "selloff", "sell-off", "market close", "market open",
    "intraday", "market cap", "market capitalization",
    "trading session", "trading day", "share price", "stock price",
  ],
  stocks: [
    "earnings", "revenue", "quarterly results", "q1 results", "q2 results",
    "q3 results", "q4 results", "guidance", "eps", "price target",
    "analyst rating", "buy rating", "sell rating", "hold rating",
    "merger", "acquisition", "acquires", "buyback", "share buyback",
    "dividend", "ipo", "initial public offering", "going public",
    "delisting", "tender offer", "hostile takeover", "spinoff",
    "stock split", "reverse split", "insider trading", "insider sale",
    "13f", "10-k", "10-q", "8-k",
  ],
  crypto: [
    "bitcoin", "btc", "ethereum", "eth", "crypto", "cryptocurrency",
    "blockchain", "defi", "decentralized finance", "nft", "non-fungible token",
    "stablecoin", "usdt", "usdc", "binance", "coinbase", "kraken",
    "altcoin", "memecoin", "solana", "sol", "xrp", "ripple", "cardano",
    "dogecoin", "litecoin", "web3", "token", "ico", "exchange-traded fund",
    "spot etf", "bitcoin etf", "ethereum etf", "halving", "mining",
  ],
  banking: [
    "bank", "banker", "banking", "commercial bank", "investment bank",
    "retail bank", "deposit", "deposits", "lending", "loan", "loans",
    "mortgage", "credit", "net interest margin", "nim",
    "jpmorgan", "jpm", "goldman sachs", "gs", "morgan stanley", "ms",
    "bank of america", "bac", "citigroup", "c", "wells fargo", "wfc",
    "hsbc", "barclays", "deutsche bank", "ubs", "credit suisse",
    "capital ratio", "tier 1", "basel", "basel iii", "fdic",
    "central bank", "interest rate", "rate hike", "rate cut",
  ],
  fintech: [
    "fintech", "payments", "payment platform", "digital wallet", "e-wallet",
    "neobank", "challenger bank", "stripe", "plaid", "square", "block",
    "paypal", "adyen", "wise", "revolut", "klarna", "affirm",
    "venmo", "cash app", "zelle", "apple pay", "google pay",
    "embedded finance", "bnpl", "buy now pay later", "remittance",
    "cross-border payments", "open banking", "rails",
  ],
  regulation: [
    "sec", "securities and exchange commission", "cftc", "cfpb",
    "finra", "fca", "esma", "eba", "occ", "fdic",
    "federal reserve", "fed", "fomc", "powell", "rate decision",
    "ecb", "european central bank", "lagarde", "boe", "bank of england",
    "boj", "bank of japan", "pboc", "people's bank of china",
    "regulation", "regulator", "regulatory", "compliance", "enforcement",
    "investigation", "subpoena", "lawsuit", "settlement", "fine", "penalty",
    "rule", "rulemaking", "comment letter", "no-action letter",
    "antitrust", "monopoly", "antitrust lawsuit",
    "executive order", "sanctions", "tariff",
  ],
  economy: [
    "gdp", "gross domestic product", "inflation", "cpi", "consumer price index",
    "ppi", "producer price index", "pce", "core pce",
    "unemployment", "jobless claims", "nonfarm payrolls", "nfp",
    "labor market", "wage growth", "wage inflation",
    "recession", "soft landing", "hard landing", "stagflation",
    "yield curve", "treasury", "treasuries", "bond yield", "10-year yield",
    "2-year yield", "yield inversion", "monetary policy", "fiscal policy",
    "stimulus", "quantitative easing", "qe", "quantitative tightening", "qt",
    "balance sheet", "dollar index", "dxy",
  ],
  forex: [
    "forex", "fx", "currency", "currencies", "exchange rate",
    "dollar", "usd", "euro", "eur", "yen", "jpy", "pound", "gbp",
    "franc", "chf", "yuan", "cny", "won", "krw", "rupee", "inr",
    "real", "brl", "peso", "mxn", "lira", "try",
    "usd/jpy", "eur/usd", "gbp/usd", "dxy", "dollar index",
    "carry trade", "fx intervention", "fx market", "currency market",
    "currency war", "devaluation", "revaluation",
  ],
};
```

- [ ] **Step 2: Replace SOURCE_CATEGORY_HINTS**

In the same file, find the `SOURCE_CATEGORY_HINTS` block (lines 85–138 in the original). Replace it entirely with:

```ts
export const SOURCE_CATEGORY_HINTS: Record<string, string[]> = {
  "Reuters Business": ["markets"],
  "Bloomberg Markets": ["markets"],
  "Financial Times": ["markets"],
  "Wall Street Journal": ["markets"],
  "CNBC": ["markets"],
  "MarketWatch": ["markets"],
  "Yahoo Finance": ["markets"],
  "Seeking Alpha": ["stocks"],
  "Investing.com": ["stocks"],
  "CoinDesk": ["crypto"],
  "Cointelegraph": ["crypto"],
  "Finextra": ["fintech"],
  "American Banker": ["banking"],
  "Banking Dive": ["banking"],
  "Forbes": ["fintech"],
  "Fortune": ["fintech"],
  "Business Insider": ["economy"],
  "The Economist": ["economy"],
  "SEC Press Releases": ["regulation"],
  "Federal Reserve": ["regulation"],
  "ECB": ["regulation"],
  "FXStreet": ["forex"],
  "FXEmpire": ["forex"],
  "Benzinga": ["stocks"],
};
```

- [ ] **Step 3: Run tests to verify they PASS**

Run: `cd /Users/somu/Downloads/deepwire-finance && npx vitest run tests/ai/classify.test.ts`
Expected: ALL 9 tests pass. Output ends with "Test Files 1 passed (1) | Tests 9 passed (9)".

- [ ] **Step 4: Commit**

```bash
cd /Users/somu/Downloads/deepwire-finance
git add src/lib/ai/classify.ts
git -c user.name="kimchi" -c user.email="kimchi@local" commit -m "feat: rewrite classifier for finance categories"
```

---

## Task 4: Rewrite source list

**Files:**
- Modify: `src/lib/rss/sources.ts` (full file replacement)

- [ ] **Step 1: Replace the entire file**

Overwrite `/Users/somu/Downloads/deepwire-finance/src/lib/rss/sources.ts` with this exact content:

```ts
export interface RSSSource {
  name: string;
  feedUrl: string;
  url: string;
  category: string;
  authority: number;
}

export const defaultSources: RSSSource[] = [
  // Markets / general
  { name: "Reuters Business", feedUrl: "https://www.reutersagency.com/feed/?best-topics=business&post_type=best", url: "https://www.reuters.com/business/", category: "markets", authority: 10 },
  { name: "Bloomberg Markets", feedUrl: "https://feeds.bloomberg.com/markets/news.rss", url: "https://www.bloomberg.com/markets", category: "markets", authority: 10 },
  { name: "CNBC", feedUrl: "https://www.cnbc.com/id/100003114/device/rss/rss.html", url: "https://www.cnbc.com", category: "markets", authority: 8 },
  { name: "MarketWatch", feedUrl: "https://feeds.marketwatch.com/marketwatch/topstories/", url: "https://www.marketwatch.com", category: "markets", authority: 8 },
  { name: "Yahoo Finance", feedUrl: "https://finance.yahoo.com/news/rssindex", url: "https://finance.yahoo.com", category: "markets", authority: 7 },

  // Stocks / investing
  { name: "Financial Times", feedUrl: "https://www.ft.com/rss/home", url: "https://www.ft.com", category: "stocks", authority: 9 },
  { name: "Wall Street Journal", feedUrl: "https://feeds.a.dj.com/rss/RSSMarkets.xml", url: "https://www.wsj.com", category: "stocks", authority: 9 },
  { name: "Seeking Alpha", feedUrl: "https://seekingalpha.com/feed.xml", url: "https://seekingalpha.com", category: "stocks", authority: 7 },
  { name: "Investing.com", feedUrl: "https://www.investing.com/rss/news.rss", url: "https://www.investing.com", category: "stocks", authority: 6 },
  { name: "Benzinga", feedUrl: "https://www.benzinga.com/feed", url: "https://www.benzinga.com", category: "stocks", authority: 6 },

  // Crypto
  { name: "CoinDesk", feedUrl: "https://www.coindesk.com/arc/outboundfeeds/rss/", url: "https://www.coindesk.com", category: "crypto", authority: 9 },
  { name: "Cointelegraph", feedUrl: "https://cointelegraph.com/rss", url: "https://cointelegraph.com", category: "crypto", authority: 7 },

  // Banking
  { name: "American Banker", feedUrl: "https://www.americanbanker.com/feed", url: "https://www.americanbanker.com", category: "banking", authority: 8 },
  { name: "Banking Dive", feedUrl: "https://www.bankingdive.com/feed/", url: "https://www.bankingdive.com", category: "banking", authority: 6 },

  // Fintech
  { name: "Finextra", feedUrl: "https://www.finextra.com/rss/feed.aspx", url: "https://www.finextra.com", category: "fintech", authority: 7 },
  { name: "Forbes", feedUrl: "https://www.forbes.com/finance/feed/", url: "https://www.forbes.com/finance/", category: "fintech", authority: 8 },
  { name: "Fortune", feedUrl: "https://fortune.com/feed/", url: "https://fortune.com", category: "fintech", authority: 8 },

  // Regulation
  { name: "SEC Press Releases", feedUrl: "https://www.sec.gov/news/pressreleases.rss", url: "https://www.sec.gov/news/pressreleases", category: "regulation", authority: 10 },
  { name: "Federal Reserve", feedUrl: "https://www.federalreserve.gov/feeds/press_all.xml", url: "https://www.federalreserve.gov", category: "regulation", authority: 10 },
  { name: "ECB", feedUrl: "https://www.ecb.europa.eu/rss/press.html", url: "https://www.ecb.europa.eu", category: "regulation", authority: 10 },

  // Economy
  { name: "The Economist", feedUrl: "https://www.economist.com/finance-and-economics/rss.xml", url: "https://www.economist.com/finance-and-economics", category: "economy", authority: 9 },
  { name: "Business Insider", feedUrl: "https://www.businessinsider.com/sai/rss", url: "https://www.businessinsider.com", category: "economy", authority: 7 },

  // Forex
  { name: "FXStreet", feedUrl: "https://www.fxstreet.com/rss/news", url: "https://www.fxstreet.com", category: "forex", authority: 7 },
  { name: "FXEmpire", feedUrl: "https://www.fxempire.com/rss/news", url: "https://www.fxempire.com", category: "forex", authority: 6 },
];

export const categoryMapping: Record<string, string> = {
  markets: "markets",
  stocks: "stocks",
  crypto: "crypto",
  banking: "banking",
  fintech: "fintech",
  regulation: "regulation",
  economy: "economy",
  forex: "forex",
};
```

- [ ] **Step 2: Type-check**

Run: `cd /Users/somu/Downloads/deepwire-finance && npx astro check 2>&1 | tail -10`
Expected: ends with "Result: 0 errors" or similar. No new errors introduced by this file. (Existing errors from `src/lib/{clustering,trends,cache}.ts` are pre-existing and out of scope — ignore them.)

- [ ] **Step 3: Commit**

```bash
cd /Users/somu/Downloads/deepwire-finance
git add src/lib/rss/sources.ts
git -c user.name="kimchi" -c user.email="kimchi@local" commit -m "feat: replace source list with finance feeds"
```

---

## Task 5: Update site config

**Files:**
- Modify: `src/config.ts` (full file replacement)

- [ ] **Step 1: Replace the entire file**

Overwrite `/Users/somu/Downloads/deepwire-finance/src/config.ts` with:

```ts
export const siteConfig = {
  name: "FinWire",
  description: "Finance & Markets News Intelligence",
  url: process.env.SITE_URL || "https://finwire.app",
  author: "FinWire",
  twitter: "@finwire",
};

export const categories = [
  { id: "markets", label: "Markets", icon: "📈" },
  { id: "stocks", label: "Stocks", icon: "💹" },
  { id: "crypto", label: "Crypto", icon: "₿" },
  { id: "banking", label: "Banking", icon: "🏦" },
  { id: "fintech", label: "Fintech", icon: "💳" },
  { id: "regulation", label: "Regulation", icon: "⚖️" },
  { id: "economy", label: "Economy", icon: "🌐" },
  { id: "forex", label: "Forex", icon: "💱" },
];

export const navigation = [
  { title: "Trending", url: "/trending" },
  { title: "Markets", url: "/markets" },
  { title: "Stocks", url: "/stocks" },
  { title: "Crypto", url: "/crypto" },
  { title: "Banking", url: "/banking" },
  { title: "Fintech", url: "/fintech" },
  { title: "Economy", url: "/economy" },
  { title: "Forex", url: "/forex" },
];
```

- [ ] **Step 2: Type-check**

Run: `cd /Users/somu/Downloads/deepwire-finance && npx astro check 2>&1 | tail -10`
Expected: same error count as Task 4 step 2 (no new errors). The siteConfig is imported by both layouts, so any signature mismatch would surface here.

- [ ] **Step 3: Commit**

```bash
cd /Users/somu/Downloads/deepwire-finance
git add src/config.ts
git -c user.name="kimchi" -c user.email="kimchi@local" commit -m "feat: update site config to FinWire identity and finance nav"
```

---

## Task 6: Create the 8 new category pages

**Files:**
- Create: `src/pages/markets.astro`
- Create: `src/pages/stocks.astro`
- Create: `src/pages/crypto.astro`
- Create: `src/pages/banking.astro`
- Create: `src/pages/fintech.astro`
- Create: `src/pages/regulation.astro`
- Create: `src/pages/economy.astro`
- Create: `src/pages/forex.astro`

- [ ] **Step 1: Create `src/pages/markets.astro` with full code**

Create `/Users/somu/Downloads/deepwire-finance/src/pages/markets.astro` containing:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import NewsCard from "../components/news/NewsCard.astro";
import TrendingTopics from "../components/news/TrendingTopics.astro";
import { getArticlesByCategory, getTrendTopics } from "../lib/data";

const articles = getArticlesByCategory("markets", 50);
const trendTopics = getTrendTopics();
---

<BaseLayout title="Markets">
  <div class="mb-8">
    <h1 class="text-xs font-semibold tracking-wide uppercase text-[var(--text-tertiary)] mb-2">Markets</h1>
    <p class="text-[var(--text-secondary)] text-sm">Equities, indices, and broad market moves ({articles.length} articles)</p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
    <div class="space-y-3">
      {articles.map((article) => (
        <NewsCard {...article} publicationDate={new Date(article.publicationDate)} />
      ))}
    </div>
    <aside class="max-lg:hidden">
      <div class="sticky top-24">
        <TrendingTopics trends={trendTopics.slice(0, 10)} period="trending" />
      </div>
    </aside>
  </div>
</BaseLayout>
```

- [ ] **Step 2: Generate the other 7 category pages by copying + sed-replacing**

Run this single shell command:

```bash
cd /Users/somu/Downloads/deepwire-finance/src/pages
for cat in stocks crypto banking fintech regulation economy forex; do
  sed -e 's/getArticlesByCategory("markets"/getArticlesByCategory("'"$cat"'"/' \
      -e 's|title="Markets"|title="'"$cat"'"|' \
      -e 's|<h1[^>]*>Markets|<h1 class="text-xs font-semibold tracking-wide uppercase text-[var(--text-tertiary)] mb-2">'"$cat"'|' \
      -e 's|<p[^>]*>Equities, indices, and broad market moves|'"$cat"' coverage (' \
      markets.astro > "${cat}.astro"
done
ls -la stocks.astro crypto.astro banking.astro fintech.astro regulation.astro economy.astro forex.astro
```

Expected: 7 files created. The page heading text (between `<h1>` tags) and the deck text after the heading will both be replaced with the lowercase category id (e.g., `<h1>stocks</h1>`). This is acceptable — the `BaseLayout title="..."` attribute and the `<h1>` content will both say e.g. "stocks", which renders consistently.

- [ ] **Step 3: Verify all 8 files exist and contain valid Astro**

Run: `cd /Users/somu/Downloads/deepwire-finance && for f in markets stocks crypto banking fintech regulation economy forex; do echo "--- $f ---"; grep -E 'getArticlesByCategory\(.{1,30}\)|title=' src/pages/$f.astro | head -3; done`
Expected: each file shows its own category id in both the `getArticlesByCategory` call and the `<BaseLayout title>` attribute.

- [ ] **Step 4: Build to verify**

Run: `cd /Users/somu/Downloads/deepwire-finance && npm run build 2>&1 | tail -25`
Expected: build exits 0. Output mentions all 8 new category page URLs being generated (e.g., `/markets`, `/stocks`, etc.). The OLD category pages (`/ai`, `/research`, etc.) will still be generated too because we haven't deleted them yet — that's expected.

- [ ] **Step 5: Commit**

```bash
cd /Users/somu/Downloads/deepwire-finance
git add src/pages/markets.astro src/pages/stocks.astro src/pages/crypto.astro src/pages/banking.astro src/pages/fintech.astro src/pages/regulation.astro src/pages/economy.astro src/pages/forex.astro
git -c user.name="kimchi" -c user.email="kimchi@local" commit -m "feat: add 8 finance category pages"
```

---

## Task 7: Update homepage category references

**Files:**
- Modify: `src/pages/index.astro` (lines 5, 13–18, 75–88)

- [ ] **Step 1: Replace the frontmatter category-fetch block**

Open `src/pages/index.astro`. Find the import line `import { categories } from "../config";` (line 5) and the `const topStories = ...` line. Replace lines 5–18 (the `categories` import through the `const trendTopics = getTrendTopics();` line) with this exact block:

```ts
import { categories } from "../config";
import { getTopStories, getTrendingArticles, getArticlesByCategory, getTrendTopics } from "../lib/data";

const topStories = getTopStories(15);
const trending = getTrendingArticles(4);
const marketsArticles = getArticlesByCategory("markets", 6);
const stocksArticles = getArticlesByCategory("stocks", 4);
const cryptoArticles = getArticlesByCategory("crypto", 4);
const bankingArticles = getArticlesByCategory("banking", 4);
const fintechArticles = getArticlesByCategory("fintech", 4);
const regulationArticles = getArticlesByCategory("regulation", 4);
const economyArticles = getArticlesByCategory("economy", 4);
const forexArticles = getArticlesByCategory("forex", 4);
const trendTopics = getTrendTopics();
```

- [ ] **Step 2: Update the section-rendering JSX to reference new categories**

In the same file, find the block that contains `<h2 ...>AI</h2>` and the four `categories.filter(c => ["security", "space", "semiconductors", "robotics"].includes(c.id))` line near the bottom (lines ~75–88). Replace that entire tile-grid block (the `<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">...</div>` section) with:

```astro
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
    {categories.filter(c => ["banking", "forex", "economy", "regulation"].includes(c.id)).map((cat) => {
      const count = {
        banking: bankingArticles.length,
        forex: forexArticles.length,
        economy: economyArticles.length,
        regulation: regulationArticles.length,
      }[cat.id] || 0;
      return (
        <a href={`/${cat.id}`} class="news-card p-6 text-center block hover:border-[var(--accent)] transition-colors">
          <h3 class="font-semibold text-base">{cat.label}</h3>
          <p class="text-xs text-[var(--text-tertiary)] mt-1">{count} articles</p>
        </a>
      );
    })}
  </div>
```

- [ ] **Step 3: Replace the AI/Research/Startups sections with finance equivalents**

In the same file, find each of the three sections that look like `{aiArticles.length > 0 && (...)}`, `{researchArticles.length > 0 && (...)}`, and `{startupArticles.length > 0 && (...)}`. Replace them with five sections that use the new fetches. The exact diff:

- AI section → use `marketsArticles` and category link `/markets`
- Research section → use `stocksArticles` and link `/stocks`
- Startups section → use `cryptoArticles` and link `/crypto`

After your replacement, the section order in the file should be: HeroSection → Top Stories → Markets section → Stocks section → Crypto section → 4-up tile grid (banking/forex/economy/regulation).

- [ ] **Step 4: Build**

Run: `cd /Users/somu/Downloads/deepwire-finance && npm run build 2>&1 | tail -15`
Expected: build exits 0. No missing-reference errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/somu/Downloads/deepwire-finance
git add src/pages/index.astro
git -c user.name="kimchi" -c user.email="kimchi@local" commit -m "feat: update homepage for finance categories"
```

---

## Task 8: Delete the 7 old category pages

**Files:**
- Delete: `src/pages/ai.astro`
- Delete: `src/pages/research.astro`
- Delete: `src/pages/startups.astro`
- Delete: `src/pages/security.astro`
- Delete: `src/pages/space.astro`
- Delete: `src/pages/semiconductors.astro`
- Delete: `src/pages/robotics.astro`

- [ ] **Step 1: Delete the 7 old category pages**

Run: `cd /Users/somu/Downloads/deepwire-finance && rm -v src/pages/ai.astro src/pages/research.astro src/pages/startups.astro src/pages/security.astro src/pages/space.astro src/pages/semiconductors.astro src/pages/robotics.astro`
Expected: 7 lines of `removed 'src/pages/...'` output, one per file.

- [ ] **Step 2: Build to verify no broken references**

Run: `cd /Users/somu/Downloads/deepwire-finance && npm run build 2>&1 | tail -15`
Expected: build exits 0. The output should NOT mention `/ai`, `/research`, `/startups`, `/security`, `/space`, `/semiconductors`, or `/robotics` as generated pages.

- [ ] **Step 3: Commit**

```bash
cd /Users/somu/Downloads/deepwire-finance
git add -u src/pages/ai.astro src/pages/research.astro src/pages/startups.astro src/pages/security.astro src/pages/space.astro src/pages/semiconductors.astro src/pages/robotics.astro
git -c user.name="kimchi" -c user.email="kimchi@local" commit -m "refactor: remove old tech category pages"
```

(Note: `git add -u` here is the explicit-by-path form with `-u` (update tracked files only) — it stages deletions of the 7 named files. It does NOT sweep untracked files. This is the documented safe form for staged-deletes.)

---

## Task 9: Update astro.config.mjs site URL

**Files:**
- Modify: `astro.config.mjs` (line 7)

- [ ] **Step 1: Replace the site URL**

Open `/Users/somu/Downloads/deepwire-finance/astro.config.mjs`. Find line 7 (`site: "https://deepwire.ai",`). Replace with:

```js
  site: "https://finwire.app",
```

- [ ] **Step 2: Build**

Run: `cd /Users/somu/Downloads/deepwire-finance && npm run build 2>&1 | tail -10`
Expected: build exits 0.

- [ ] **Step 3: Commit**

```bash
cd /Users/somu/Downloads/deepwire-finance
git add astro.config.mjs
git -c user.name="kimchi" -c user.email="kimchi@local" commit -m "chore: update site URL to finwire.app"
```

---

## Task 10: Update workers

**Files:**
- Modify: `workers/article-processing.ts` (lines 11–17, SKIP_SOURCES Set)
- Modify: `workers/rss-ingestion.ts` (lines 76–78, inline skip check)
- Modify: `workers/backfill.ts` (full file replacement — repurpose for SEC EDGAR)

- [ ] **Step 1: Replace SKIP_SOURCES in `article-processing.ts`**

Open `workers/article-processing.ts`. Find the `SKIP_SOURCES` Set block (lines 11–17). Replace with:

```ts
const SKIP_SOURCES = new Set<string>([
  // Finance sources we deliberately skip crawling (low text or paywalled).
  // Twitter-style feeds already absent from finance source list.
  // SEC press releases are short by design; skip crawl to save time.
  "SEC Press Releases",
  "Federal Reserve",
  "ECB",
]);
```

- [ ] **Step 2: Replace the inline skip-check in `rss-ingestion.ts`**

Open `workers/rss-ingestion.ts`. Find the line that starts with `const skipCrawl = source.name.includes(...)` (around line 76). Replace that line with:

```ts
      const skipCrawl = source.name === "SEC Press Releases" || source.name === "Federal Reserve" || source.name === "ECB";
```

- [ ] **Step 3: Replace `workers/backfill.ts` with the SEC EDGAR version**

Overwrite `/Users/somu/Downloads/deepwire-finance/workers/backfill.ts` with this exact content:

```ts
import * as fs from "fs";
import * as path from "path";
import { getDb, closeDb } from "../src/lib/db/index";

const SEC_EDGAR_BASE = "https://www.sec.gov/cgi-bin/browse-edgar";
const DATA_DIR = path.join(process.cwd(), "data");
const ARTICLES_FILE = path.join(DATA_DIR, "articles.json");

interface StoredArticle {
  id: number; title: string; url: string; source: string;
  author: string; excerpt: string; content: string;
  category: string; tags: string[]; publicationDate: string;
  imageUrl: string | null; importanceScore: number;
  companies: string[]; technologies: string[]; processed: boolean;
}

function loadArticles(): StoredArticle[] {
  if (fs.existsSync(ARTICLES_FILE)) {
    return JSON.parse(fs.readFileSync(ARTICLES_FILE, "utf-8"));
  }
  return [];
}

function saveArticles(articles: StoredArticle[]) {
  fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2));
}

async function fetchEdgarRecent(cik: string, formType: string, count: number): Promise<Array<{ title: string; url: string; date: string }>> {
  // SEC EDGAR browse-edgar action returns JSON when output=atom
  const url = `${SEC_EDGAR_BASE}?action=getcompany&CIK=${cik}&type=${formType}&dateb=&owner=include&count=${count}&output=atom`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "FinWire research@example.com" } });
    const xml = await res.text();

    const entries: Array<{ title: string; url: string; date: string }> = [];
    const entryMatches = xml.split("<entry>").slice(1);
    for (const entry of entryMatches) {
      const titleMatch = entry.match(/<title>(.*?)<\/title>/);
      const linkMatch = entry.match(/<link[^>]*href="([^"]+)"/);
      const updatedMatch = entry.match(/<updated>(.*?)<\/updated>/);
      if (titleMatch && linkMatch) {
        entries.push({
          title: titleMatch[1].replace(/<[^>]+>/g, "").trim(),
          url: linkMatch[1],
          date: updatedMatch ? updatedMatch[1] : new Date().toISOString(),
        });
      }
    }
    return entries;
  } catch (err) {
    console.error(`  EDGAR fetch failed for CIK ${cik}:`, err);
    return [];
  }
}

async function backfillEdgar() {
  const existing = loadArticles();
  const existingUrls = new Set(existing.map((a) => a.url));
  let nextId = existing.length > 0 ? Math.max(...existing.map((a) => a.id)) + 1 : 1;
  let newCount = 0;

  const targets = [
    { cik: "0000320193", formType: "10-K", source: "SEC EDGAR (Apple)", category: "regulation" },
    { cik: "0000789019", formType: "10-K", source: "SEC EDGAR (Microsoft)", category: "regulation" },
    { cik: "0001018724", formType: "10-K", source: "SEC EDGAR (Amazon)", category: "regulation" },
    { cik: "0001045810", formType: "10-K", source: "SEC EDGAR (NVIDIA)", category: "regulation" },
  ];

  for (const t of targets) {
    console.log(`  Fetching ${t.source} recent ${t.formType} filings...`);
    const filings = await fetchEdgarRecent(t.cik, t.formType, 10);

    for (const f of filings) {
      if (existingUrls.has(f.url)) continue;

      const article: StoredArticle = {
        id: nextId++,
        title: f.title,
        url: f.url,
        source: t.source,
        author: "SEC EDGAR",
        excerpt: f.title,
        content: `${t.formType} filing — see filing index at ${f.url}`,
        category: t.category,
        tags: [t.category, "sec-filing"],
        publicationDate: f.date,
        imageUrl: null,
        importanceScore: 70,
        companies: [],
        technologies: [],
        processed: true,
      };

      existing.push(article);
      existingUrls.add(f.url);
      newCount++;
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  saveArticles(existing);
  console.log(`  → Added ${newCount} new SEC filings`);
  return newCount;
}

async function main() {
  console.log("Backfilling historical SEC filings...\n");

  const total = await backfillEdgar();

  // Mirror to SQLite
  const { importFromJson } = await import("../src/lib/db/index");
  importFromJson();
  closeDb();

  console.log(`\nDone! Added ${total} backdated filings.`);
}

main().catch(console.error);
```

- [ ] **Step 4: Type-check all 3 workers**

Run: `cd /Users/somu/Downloads/deepwire-finance && npx tsc --noEmit workers/article-processing.ts workers/rss-ingestion.ts workers/backfill.ts 2>&1 | tail -20`
Expected: no new errors. (TSC won't understand `.astro` files, but the three `.ts` files compile cleanly.)

- [ ] **Step 5: Commit**

```bash
cd /Users/somu/Downloads/deepwire-finance
git add workers/article-processing.ts workers/rss-ingestion.ts workers/backfill.ts
git -c user.name="kimchi" -c user.email="kimchi@local" commit -m "refactor: update workers for finance sources and EDGAR backfill"
```

---

## Task 11: Update package.json metadata

**Files:**
- Modify: `package.json` (lines 2, 3)

- [ ] **Step 1: Edit name and description**

Open `package.json`. Find line 2 (`"name": "deepwire",`) and replace with:

```json
  "name": "finwire",
```

Find line 3 (`"description": "AI & DeepTech News Intelligence Platform",`) and replace with:

```json
  "description": "Finance & Markets News Intelligence",
```

Do NOT modify any other field. The `vitest` scripts added in Task 1 must remain.

- [ ] **Step 2: Verify no broken install**

Run: `cd /Users/somu/Downloads/deepwire-finance && npm install --no-audit --no-fund 2>&1 | tail -5`
Expected: exit 0, no changes to `package-lock.json` (the only changes are metadata fields that don't affect dependency resolution).

- [ ] **Step 3: Commit**

```bash
cd /Users/somu/Downloads/deepwire-finance
git add package.json
git -c user.name="kimchi" -c user.email="kimchi@local" commit -m "chore: rename package to finwire"
```

---

## Task 12: Wipe stale data files

**Files:**
- Delete: `data/articles.json`
- Delete: `data/deepwire.db`
- Delete: `data/sources-state.json`

- [ ] **Step 1: Verify nothing else under data/ that we want to keep**

Run: `ls -la /Users/somu/Downloads/deepwire-finance/data/`
Expected output is exactly three files: `articles.json`, `deepwire.db`, `sources-state.json`. If anything else is listed, stop and investigate — do not delete blindly.

- [ ] **Step 2: Delete the 3 files**

Run: `cd /Users/somu/Downloads/deepwire-finance && rm -v data/articles.json data/deepwire.db data/sources-state.json`
Expected: 3 `removed` lines. The `data/` directory itself remains (so future ingests can write into it).

- [ ] **Step 3: Verify build still passes with no data**

Run: `cd /Users/somu/Downloads/deepwire-finance && npm run build 2>&1 | tail -10`
Expected: build exits 0. The pages render with empty article lists (because `data.ts` returns `[]` when `articles.json` is absent). This is correct pre-ingest behaviour.

- [ ] **Step 4: Commit**

```bash
cd /Users/somu/Downloads/deepwire-finance
git add -u data/articles.json data/deepwire.db data/sources-state.json
git -c user.name="kimchi" -c user.email="kimchi@local" commit -m "chore: wipe stale tech data files"
```

(Same `git add -u` with explicit paths — staged-deletes only for the named files, no sweeping.)

---

## Task 13: Rewrite README

**Files:**
- Modify: `README.md` (full file replacement)

- [ ] **Step 1: Replace README content**

Overwrite `/Users/somu/Downloads/deepwire-finance/README.md` with:

```markdown
# FinWire

A finance and markets news intelligence platform. Aggregates headlines from major wires, exchanges, regulators, and analyst outlets across 8 categories — markets, stocks, crypto, banking, fintech, regulation, economy, and forex.

**Live demo:** _(deploy after launch)_

## What FinWire is

FinWire is a static site that crawls ~25 RSS feeds from Reuters, Bloomberg, CNBC, MarketWatch, SEC, Federal Reserve, ECB, CoinDesk, Finextra, and others, then surfaces them through a category-indexed reading experience. Built on Astro, designed for fast page loads and zero-tracking browsing.

It is the finance-sector sibling of [DeepWire](https://github.com/Himan-D/deepwire), which covers AI and deep-tech instead.

## Features

- 8 category landing pages (Markets, Stocks, Crypto, Banking, Fintech, Regulation, Economy, Forex)
- Article detail pages with TL;DR, full text, importance score, related stories
- Trending sidebar with tag-driven growth tracking
- Full-text search across all ingested articles
- Dark theme, terracotta accent, Manrope typography — identical visual treatment to DeepWire
- Read-only admin dashboard at `/admin` showing counts, source list, and trends
- All static HTML output — no client-side database, no third-party trackers
- Article ingestion pipeline via RSS → keyword classifier → optional full-text crawl → JSON store

## Getting Started

### Clone and install

```sh
git clone https://github.com/Himan-D/finwire.git
cd finwire
npm install
npm run dev
```

Dev server runs at `http://localhost:4321/`.

### Ingest finance feeds

```sh
npm run ingest              # all sources
npm run ingest "CoinDesk"   # one source only
```

### Other worker commands

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Build to `./dist/` |
| `npm run preview` | Preview the production build |
| `npm run ingest` | Pull RSS from all 24 sources into `data/articles.json` |
| `npm run process` | Backfill full content for unprocessed articles |
| `npm run backfill` | Pull recent SEC EDGAR 10-K filings |
| `npm run db:init` | Mirror `data/articles.json` ↔ SQLite at `data/finwire.db` |
| `npm test` | Run classifier unit tests |

## Configuration

All site identity lives in `src/config.ts`:

```ts
export const siteConfig = {
  name: "FinWire",
  description: "Finance & Markets News Intelligence",
  url: "https://finwire.app",
  // ...
};

export const categories = [
  { id: "markets", label: "Markets", icon: "📈" },
  // ...7 more
];
```

The RSS source list is in `src/lib/rss/sources.ts`. The category classifier vocabulary is in `src/lib/ai/classify.ts`.

## Project Structure

```
finwire/
├── astro.config.mjs
├── package.json
├── vitest.config.ts
├── data/                       # runtime: articles.json, sources-state.json, finwire.db
├── public/
├── src/
│   ├── config.ts               # siteConfig + categories + nav
│   ├── styles/global.css       # design tokens (identical to deepwire)
│   ├── layouts/{Base,Admin}Layout.astro
│   ├── components/
│   │   ├── layout/             # Header, Footer
│   │   ├── news/               # NewsCard, HeroSection, TrendingTopics, ...
│   │   ├── search/SearchBar.astro
│   │   └── ui/                 # Badge, TimeAgo
│   ├── lib/
│   │   ├── data.ts             # JSON-backed read API
│   │   ├── utils.ts
│   │   ├── rss/{parser,sources}.ts
│   │   ├── ai/classify.ts      # keyword + source-hint classifier
│   │   ├── content-crawler.ts  # jsdom + Mozilla Readability
│   │   └── db/{index,schema}.ts
│   └── pages/
│       ├── index.astro
│       ├── trending.astro
│       ├── markets.astro, stocks.astro, crypto.astro,
│       ├── banking.astro, fintech.astro, regulation.astro,
│       ├── economy.astro, forex.astro
│       ├── search.astro
│       ├── story/[slug].astro
│       ├── company/[slug].astro
│       ├── technology/[slug].astro
│       └── admin/{index,feeds,jobs,trends}.astro
├── tests/
│   └── ai/classify.test.ts
└── workers/
    ├── db-migrate.ts
    ├── rss-ingestion.ts
    ├── article-processing.ts
    └── backfill.ts             # SEC EDGAR puller
```

## License

MIT.
```

- [ ] **Step 2: Verify build still passes**

Run: `cd /Users/somu/Downloads/deepwire-finance && npm run build 2>&1 | tail -5`
Expected: build exits 0.

- [ ] **Step 3: Commit**

```bash
cd /Users/somu/Downloads/deepwire-finance
git add README.md
git -c user.name="kimchi" -c user.email="kimchi@local" commit -m "docs: rewrite README for FinWire"
```

---

## Task 14: Final verification

**No code changes in this task.** Pure verification.

- [ ] **Step 1: Type-check + build**

Run: `cd /Users/somu/Downloads/deepwire-finance && npx astro check 2>&1 | tail -5 && npm run build 2>&1 | tail -5`
Expected: both exit 0. Pre-existing errors from `clustering.ts`, `trends.ts`, `cache.ts` are out of scope and may still appear — that's fine.

- [ ] **Step 2: Run classifier tests**

Run: `cd /Users/somu/Downloads/deepwire-finance && npx vitest run`
Expected: 9 tests pass, 0 fail.

- [ ] **Step 3: Boot dev server, smoke-test routes**

Run: `cd /Users/somu/Downloads/deepwire-finance && (nohup npm run dev -- --port 4322 > /tmp/finwire-verify.log 2>&1 &) && sleep 6 && for path in / /markets /stocks /crypto /banking /fintech /regulation /economy /forex /search /admin; do code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:4322$path); echo "  $code  $path"; done && pkill -f "astro dev --port 4322" || true`
Expected: every URL returns `200`. The dev server gets killed at the end.

- [ ] **Step 4: Verify original repo untouched**

Run: `cd /Users/somu/Downloads/deepwire && git status -s`
Expected: only the pre-existing `M package-lock.json` from the earlier `npm install` in this session. No new modifications from this work.

- [ ] **Step 5: Verify finance repo git log**

Run: `cd /Users/somu/Downloads/deepwire-finance && git log --oneline`
Expected: 14+ new commits since `0f1ce66` (Tasks 1–13), each with a clear `feat:` / `chore:` / `refactor:` / `docs:` / `test:` prefix.

- [ ] **Step 6: Report**

Tell the user:
- All 14 tasks complete
- Build green, tests pass, all 11 routes return 200
- Original repo untouched
- Next step: `npm run ingest` against one finance source as a smoke test (e.g. `npm run ingest "Reuters Business"`)

---

## Self-Review Notes (run after writing)

**Spec coverage:**
- §2 Identity — Tasks 9, 11, 13 (site URL, package name, README)
- §3 8-category taxonomy — Tasks 5, 6, 7
- §4 Source list — Task 4
- §5 Classifier rewrite — Tasks 2, 3 (TDD)
- §6 File-by-file changes — Tasks 4, 5, 6, 7, 8, 9, 10, 11, 12, 13
- §7 What stays untouched — implicit (no task touches components, layouts, scraper, original repo)
- §8 Broken/aspirational code untouched — implicit (no task edits clustering/trends/cache)
- §9 Data flow unchanged — implicit (only data files wiped, flow preserved)
- §10 Verification — Task 14
- §11 Risks — addressed in Task 14 step 3 (smoke test will reveal failing RSS) and Task 4 step 2 (type-check)

**Placeholder scan:** No "TBD", "TODO", "implement later", or "similar to Task N" markers. All code is shown in full where it's non-trivial.

**Type consistency:** Category IDs used: `markets`, `stocks`, `crypto`, `banking`, `fintech`, `regulation`, `economy`, `forex`. These appear identically in Tasks 3, 4, 5, 6, 7, 10, 13. The `getArticlesByCategory(catId, count)` signature is consistent with the existing implementation.

**One ambiguity flagged:** Task 7 step 3 says to replace 3 sections (AI/Research/Startups) with 3 sections (Markets/Stocks/Crypto). The exact diff is given but the engineer needs to mirror the existing section template (which includes the "View all →" link). This is acceptable because the template is identical except for the category ID and label — the engineer can find-and-replace in-place.
