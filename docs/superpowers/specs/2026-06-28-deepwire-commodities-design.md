# DeepWire Commodities — Commodity News Project Design

**Date:** 2026-06-28
**Target:** `/Users/somu/Downloads/deepwire-commodities/`
**Status:** Approved (user sign-off 2026-06-28 — 6 categories, repo `commwire`)
**Base clone:** `/Users/somu/Downloads/deepwire-finance/` (sibling project, deployed to Render)

## 1. Problem & Goal

Fourth sibling of the DeepWire family — after DeepWire (AI/deep-tech), FinWire (finance/markets), and DeepWire Celebs (celebrity news) — focused on **global commodities**. The codebase is cloned from FinWire; UI surfaces, scraping approach, data layer, worker structure, and visual treatment stay identical; only the domain content (sources, category taxonomy, classifier vocabulary, brand identity) changes.

Constraint from user: *"make sure all things like ui use astro just like the other two only the news articles should be scraped from the best sites."*

## 2. Identity

| Field | Value |
|---|---|
| App name | `DeepWire Commodities` |
| Site domain | placeholder `https://deepwire-commodities.app` |
| Tagline | "Commodity Markets News Intelligence" |
| Twitter | `@deepwire_comms` |
| Package name | `deepwire-commodities` |
| GitHub repo | `soumitraupadhyaytrinetra/commwire` (public) |
| Theme | Unchanged from FinWire: dark `#141413`, terracotta `#E85D2A` accent, Manrope font, Lipi layout |

## 3. Category Taxonomy (6)

User-approved split: gold and silver each get their own page; oil and gas are separate; mining & metals combines industrial metals and mining; agriculture covers crops and soft commodities.

| ID | Label | Icon | Covers |
|---|---|---|---|
| `gold` | Gold | 🥇 | Spot price, ETFs (GLD), central bank reserves, gold mining |
| `silver` | Silver | 🥈 | Spot price, ETFs (SLV), industrial vs investment demand, silver mining |
| `oil` | Oil | 🛢️ | Crude (WTI/Brent), OPEC, shale, refiners, oil supply/demand |
| `gas` | Gas | 🔥 | Natural gas, LNG, Henry Hub, TTF, gas geopolitics |
| `metals` | Mining & Metals | ⛏️ | Copper, iron ore, lithium, nickel, aluminum, mining companies |
| `agriculture` | Agriculture | 🌾 | Wheat, corn, soybeans, coffee, sugar, cocoa, soft commodities |

Finance category IDs (`markets`, `stocks`, `crypto`, `banking`, `fintech`, `regulation`, `economy`, `forex`) and celebs IDs (`hollywood`, `bollywood`, `kpop`, `music`, `general`) are dropped — these 6 IDs replace them.

## 4. Source List (~22 candidate feeds)

Curated feeds grouped by category. URLs are placeholders to be probed during scaffolding; any that 404/error will be pruned or replaced.

**Gold (4):** Kitco News, World Gold Council, Mining.com (gold tag), Sprott Money
**Silver (3):** Silver Institute, Sprott Silver, Kitco (silver tag)
**Oil (4):** OilPrice.com, World Oil, Rigzone, Reuters Energy
**Gas (3):** Natural Gas Intel, OilPrice.com (gas tag), Reuters Energy (gas section)
**Mining & Metals (4):** Mining.com, Mining Weekly, Reuters Metals, Investing.com Commodities (metals)
**Agriculture (4):** AgriPulse, World-Grain, Successful Farming, Farm Futures

Risk: several mining/agriculture outlets are corporate blogs with throttled or removed RSS feeds. Probe URLs at scaffold time; drop dead ones and replace with the next-best source for that category.

## 5. Classifier Rewrite

`src/lib/ai/classify.ts` rewritten with commodities vocabulary:

- `CATEGORY_KEYWORDS`: each of the 6 categories gets ~30–60 distinctive keywords. Examples:
  - `gold`: "gold price", "spot gold", "xau", "gold etf", "gld", "central bank gold", "gold reserves", "gold mining", "bullion", "goldman sachs commodity", etc.
  - `silver`: "silver price", "spot silver", "xag", "silver etf", "slv", "industrial silver", "silver mining", "photovoltaic silver", "silver deficit", etc.
  - `oil`: "crude oil", "wti", "brent", "opec", "opec+", "shale", "refinery", "barrel", "petroleum", etc.
  - `gas`: "natural gas", "henry hub", "ttf", "lng", "液化天然气", "天然气", "gas pipeline", "gasprom", etc.
  - `metals`: "copper", "iron ore", "lithium", "nickel", "aluminum", "zinc", "bhp", "rio tinto", "vale", "glencore", etc.
  - `agriculture`: "wheat", "corn", "soybean", "coffee", "sugar", "cocoa", "usda", "harvest", "crop", "grain", "期货", etc.
- `SOURCE_CATEGORY_HINTS`: one entry per source — primary category for that feed. Used as fallback when `classifyArticle` finds no keyword hits.
- `categoryMapping`: identity map for the 6 new IDs.

## 6. File-Level Changes vs FinWire

| File | Action |
|---|---|
| `src/config.ts` | Edit — brand, 6 categories, nav |
| `src/lib/rss/sources.ts` | Edit — all finance sources → ~22 commodities candidates |
| `src/lib/ai/classify.ts` | Edit — keywords + hints rewritten |
| `src/pages/gold.astro` | New |
| `src/pages/silver.astro` | New |
| `src/pages/oil.astro` | New |
| `src/pages/gas.astro` | New |
| `src/pages/metals.astro` | New |
| `src/pages/agriculture.astro` | New |
| `src/pages/{markets,stocks,crypto,banking,fintech,regulation,economy,forex}.astro` | Delete (finance leftovers) |
| `package.json` | Edit — name, description, site URL |
| `astro.config.mjs` | Edit — site URL |
| `README.md` | Rewrite |
| `data/` | Cleared (regenerated by ingest) |
| Everything else (layouts, components, styles, workers, workflows) | Copied as-is |

## 7. v1 Scope (this session)

1. Copy `/Users/somu/Downloads/deepwire-finance/` → `/Users/somu/Downloads/deepwire-commodities/` (excluding `node_modules`, `.astro`, `dist`, `data`, `.git`, `.kimchi`)
2. Apply all file changes per §6
3. `npm install`
4. Probe each of the ~22 candidate feed URLs → keep working ones (target ≥ 12 alive across all 6 categories)
5. Update `sources.ts` with surviving URLs
6. Run `npm run ingest` once → verify all 6 categories populated (≥ 1 article each)
7. `npm run build` → confirm clean build
8. Init fresh git repo in `deepwire-commodities/`, commit everything

**Out of scope for v1:** GitHub push, Render deploy, GitHub Actions cron. Those happen after the user verifies the build locally — same flow as DeepWire Celebs.

## 8. Success Criteria

- `npm run build` exits 0 with no warnings
- `data/articles.json` contains ≥ 1 article per category (ideally ≥ 5 per) after ingest
- All 6 category pages render in dev server with non-empty article lists
- News cards link to working `/story/<id>` pages
- Search works at `/search?q=<term>` (client-side filter via `/api/articles.json` — already wired in base FinWire clone)
- Tests pass: `npm test` exits 0

## 9. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Mining/agriculture feeds 404 or RSS removed | Probe all URLs at scaffold; replace dead feeds with the next-best source. Worst case: collapse `gas` into `oil` to keep 5 cats. |
| OilPrice.com rate-limits aggressive crawlers | Crawler already throttles 1500ms between articles; bump to 3000ms if 429s appear. |
| Reuters Energy RSS split into multiple narrower feeds | Subscribe to multiple sub-feeds (oil + gas tags) instead of one. |
| Commodities news overlaps with macro/finance | Classifier keyword strategy + source hints override to the specific commodity category. |
| Build error from finance leftovers | Delete all 8 finance category pages explicitly before build. |

## 10. Decisions Locked

- Brand name: **"DeepWire Commodities"** (matches directory)
- 6 categories: gold, silver, oil, gas, mining & metals, agriculture
- ~22 source list as above; final list determined after URL probing
- Repo name: **`commwire`** (matches `celebwire` brand pattern)
- v1 ships locally only; GitHub + Render come after user verification
