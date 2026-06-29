# FinWire — Finance News Pivot Design

**Date:** 2026-06-24
**Target:** `/Users/somu/Downloads/deepwire-finance/`
**Status:** Draft for review

## 1. Problem & Goal

Pivot the `deepwire` codebase (a static Astro site that aggregates ~50 AI / deep-tech RSS feeds) into a parallel product, **FinWire**, that aggregates finance news instead. The original `/Users/somu/Downloads/deepwire/` is fully insulated from this work — all edits happen inside the `deepwire-finance/` sibling copy that was created in this session.

The user constraint: *"exactly same like tech app, only the news must be of finance."* Every UI surface, scraping approach, data layer, worker structure, and visual treatment stays identical; only the domain content (sources, category taxonomy, classifier vocabulary, brand identity) changes.

## 2. Identity

| Field | Value |
|---|---|
| App name | `FinWire` |
| Site domain | `https://finwire.app` |
| Tagline | "Finance & Markets News Intelligence" |
| Twitter | `@finwire` |
| Package name | `finwire` |
| Theme | Unchanged: dark `#141413`, terracotta `#E85D2A` accent, Manrope font |

## 3. Category Taxonomy (8)

Aligned 1:1 with navigation and category page files. Each gets a category page and a nav entry.

| ID | Label | Icon |
|---|---|---|
| `markets` | Markets | 📈 |
| `stocks` | Stocks | 💹 |
| `crypto` | Crypto | ₿ |
| `banking` | Banking | 🏦 |
| `fintech` | Fintech | 💳 |
| `regulation` | Regulation | ⚖️ |
| `economy` | Economy | 🌐 |
| `forex` | Forex | 💱 |

Categories from the original (`ai`, `agents`, `llms`, `robotics`, `startups`, `research`, `security`, `cloud`, `semiconductors`, `space`, `quantum`) are dropped — the eight new IDs replace them entirely.

## 4. Source List (~24 feeds)

Curated finance sources grouped by category, mirroring the structure of `defaultSources[]` in `src/lib/rss/sources.ts`. Each entry carries `name`, `feedUrl`, `url`, `category`, `authority: 6–10`.

**Markets / general (5)**: Reuters Business, Bloomberg Markets, CNBC, MarketWatch, Yahoo Finance
**Stocks / investing (4)**: Financial Times, Wall Street Journal, Seeking Alpha, Investing.com
**Crypto (2)**: CoinDesk, Cointelegraph
**Banking (2)**: Finextra, American Banker
**Fintech (2)**: Forbes, Fortune (both cover fintech heavily; Banking Dive alternative)
**Regulation (3)**: SEC Press Releases, Federal Reserve, ECB
**Economy (2)**: The Economist, Business Insider (business desk)
**Forex (2)**: FXStreet, FXEmpire
**Trading / momentum (2)**: Benzinga, Fortune (alt-pick)

**Out — by design**: zero Twitter / Nitter handles (most Nitter mirrors are dead, no finance-only reason to bring them back; can re-evaluate with X API key later).

**Risk to surface to user**: FT, WSJ, and Bloomberg are known RSS-restrictive. Plan: write the list verbatim, on first ingest report which URLs succeeded and which need a swap.

## 5. Classifier Rewrite

`src/lib/ai/classify.ts`:

- **`CATEGORY_KEYWORDS`**: full rewrite. Each of the 8 categories gets a list of finance-specific phrases (e.g., `markets` ← `["equities", "stock market", "wall street", "index", "s&p 500", "dow jones", "nasdaq", "rally", "selloff", "bull market", "bear market", ...]`). The `classifyArticle()` function signature and return shape are unchanged.
- **`SOURCE_CATEGORY_HINTS`**: full rewrite keyed by the new source names. The `getPrimaryCategory()` precedence rules (lines 153–186) stay identical — they consume the maps, don't change them.

## 6. File Changes (Finance Copy Only)

| Path | Action | Notes |
|---|---|---|
| `astro.config.mjs` | Edit `site:` | → `"https://finwire.app"` |
| `package.json` | Edit `name`, `description` | → `finwire`, finance tagline |
| `src/config.ts` | Rewrite | `siteConfig`, `categories[]`, `navigation[]` |
| `src/lib/rss/sources.ts` | Rewrite | `defaultSources[]` + `categoryMapping` |
| `src/lib/ai/classify.ts` | Rewrite maps | `CATEGORY_KEYWORDS`, `SOURCE_CATEGORY_HINTS`; functions unchanged |
| `src/pages/index.astro` | Edit lines 13–18, 75–88 | Update category fetches and 4-up tile filter |
| `src/pages/ai.astro` | Delete | |
| `src/pages/research.astro` | Delete | |
| `src/pages/startups.astro` | Delete | |
| `src/pages/security.astro` | Delete | |
| `src/pages/space.astro` | Delete | |
| `src/pages/semiconductors.astro` | Delete | |
| `src/pages/robotics.astro` | Delete | |
| `src/pages/markets.astro` | Create | Clone of `ai.astro`, category id `markets` |
| `src/pages/stocks.astro` | Create | id `stocks` |
| `src/pages/crypto.astro` | Create | id `crypto` |
| `src/pages/banking.astro` | Create | id `banking` |
| `src/pages/fintech.astro` | Create | id `fintech` |
| `src/pages/regulation.astro` | Create | id `regulation` |
| `src/pages/economy.astro` | Create | id `economy` |
| `src/pages/forex.astro` | Create | id `forex` |
| `workers/article-processing.ts` | Edit `SKIP_SOURCES` Set (lines 11–17) | Drop arXiv rows; keep Twitter-style exclusions (no-op since none exist) |
| `workers/rss-ingestion.ts` | Edit lines 76–78 | Drop arXiv, `@X`, `Hacker News` checks (none relevant) |
| `workers/backfill.ts` | Repurpose | Switch from arXiv API to SEC EDGAR filings (`https://www.sec.gov/cgi-bin/browse-edgar`) |
| `data/articles.json` | Delete | 14 MB of stale tech articles |
| `data/deepwire.db` | Delete | Stale SQLite mirror |
| `data/sources-state.json` | Delete | Stale per-feed timestamps |
| `README.md` | Full rewrite | FinWire branding, finance source list, updated commands |

## 7. What Stays Untouched (Do Not Edit)

- **All UI components**: `NewsCard`, `HeroSection`, `TrendingTopics`, `StoryCluster`, `CompanyCard`, `Header`, `Footer`, `Badge`, `TimeAgo`, `SearchBar`
- **Layouts**: `BaseLayout`, `AdminLayout`
- **Data layer**: `src/lib/data.ts`, `src/lib/utils.ts`, `src/lib/rss/parser.ts`, `src/lib/content-crawler.ts`
- **DB layer**: `src/lib/db/{index,schema}.ts`, `drizzle.config.ts`
- **Generic pages**: `trending.astro`, `search.astro`, `story/[slug].astro`, `company/[slug].astro`, `technology/[slug].astro`
- **Admin pages**: `admin/index.astro`, `admin/feeds.astro`, `admin/jobs.astro`, `admin/trends.astro` (they read from the new sources/topics automatically)
- **Scraper**: `jsdom` + `@mozilla/readability` — confirmed with user (Option 1, no crawl4ai swap)
- **Original repo**: `/Users/somu/Downloads/deepwire/` — fully insulated, never modified

## 8. Broken / Aspirational Code — Leave As-Is

Match original behaviour exactly; do not clean up:

- `cluster` and `trends` scripts in `package.json` referencing non-existent `workers/clustering.ts` / `workers/trend-analysis.ts`
- `src/lib/clustering.ts` (imports missing `clusters` table)
- `src/lib/trends.ts` (imports missing `trends` table)
- `src/lib/cache.ts` (imports `@upstash/redis` not in deps)
- `src/lib/ai/enrich.ts` (OpenAI enrichment — currently never invoked)
- `Math.random()` growthRate placeholder in `src/lib/data.ts:80`

None of these affect runtime rendering; all are dormant. Cleaning them up is out of scope.

## 9. Data Flow (Unchanged)

```
RSS sources (defaultSources)
   ↓
workers/rss-ingestion.ts → src/lib/rss/parser.ts
   ↓
src/lib/ai/classify.ts (keyword + source-hint classifier)
   ↓
src/lib/content-crawler.ts (jsdom + Readability) [skipped for low-text sources]
   ↓
data/articles.json (primary) + data/sources-state.json
   ↓
[optional: workers/article-processing.ts re-crawl, workers/backfill.ts EDGAR pull]
   ↓
[optional: workers/db-migrate.ts mirrors JSON ↔ SQLite]
   ↓
src/lib/data.ts → Astro static pages
```

## 10. Verification Plan

After implementation, before declaring done:

1. **Build green:** `npm run build` exits 0 in the finance copy.
2. **Dev server green:** `npm run dev -- --port 4322` starts; `/`, `/markets`, `/stocks`, `/crypto`, `/banking`, `/fintech`, `/regulation`, `/economy`, `/forex`, `/search`, `/story/1`, `/admin` all return HTTP 200.
3. **No category 404s in nav:** every link in `navigation[]` resolves.
4. **RSS smoke ingest:** `npm run ingest "Reuters Business"` (or whichever first source verifies cleanly) writes at least one article to `data/articles.json`.
5. **Original repo untouched:** `git status` in `/Users/somu/Downloads/deepwire/` shows no new modifications attributable to this work.
6. **Type-check:** `npx astro check` exits 0 (the canonical Astro type-check; plain `tsc --noEmit` won't parse `.astro` files).

## 11. Risks

| Risk | Mitigation |
|---|---|
| Several finance RSS endpoints 404 on first try (FT, WSJ, Bloomberg) | Verify URLs out-of-band. Concrete swap-ins if a primary fails: `Banking Dive` for `Finextra`, `PYMNTS` for `American Banker`, `The Block` for `CoinDesk`, `Decrypt` for `Cointelegraph` |
| Paywalled sources (FT, WSJ) return truncated RSS | `crawlArticle()` falls back to short RSS snippets — story detail page still renders |
| Category page count vs nav mismatch | Strict 1:1 mapping enforced in §3 and §6 |
| `package.json` has dead `cluster`/`trends` scripts — user might run them | Out of scope; documented in §8 |
| Original `/Users/somu/Downloads/deepwire/` accidentally touched | All paths in §6 are explicitly under `deepwire-finance/`; verification step 5 catches leaks |

## 12. Out of Scope (Explicit Non-Goals)

- Wiring `enrichArticle()` (OpenAI) into the ingest pipeline
- Fixing `cluster`/`trends` workers or `cache.ts` / `@upstash/redis`
- Replacing `Math.random()` growthRate
- Adding commodities / real-estate / bonds-etf categories
- Twitter / X firehose integration
- Auth-protected admin
- Production deployment / hosting config

## 13. Open Items

1. **RSS verification pass** — §4 lists intended sources; first ingest will reveal which actually resolve. Swap-ins listed in §11.
2. **Backfill scope** — SEC EDGAR pulls are slow and rate-limited; whether to actually run `npm run backfill` after launch, or leave the script present but unrun, is the user's call.
3. **First-article content sanity** — after the first ingest, manually spot-check 5 article pages for source-image rendering, snippet length, and importance score plausibility.
