# WorldWire

A general news intelligence platform covering every beat — world affairs, US politics, business, tech, science & health, sports, and culture. Aggregates headlines from the world's leading wires and publishers into a single, fast, zero-tracking reading experience.

**Live demo:** [worldwire.app](https://worldwire.app)

## What WorldWire is

A static site that crawls RSS feeds from Reuters, BBC, The Guardian, Al Jazeera, NPR, Politico, AP News, Bloomberg, Financial Times, The Verge, TechCrunch, Ars Technica, Wired, Science Daily, NPR Health, Scientific American, STAT News, ESPN, BBC Sport, The Guardian, Variety, and others — then surfaces them through a category-indexed reading experience. Built on Astro with the Lipi design language, designed for fast page loads and zero-tracking browsing.

It is the broad-news sibling of [FinWire](https://github.com/soumitraupadhyaytrinetra/finwire) (finance), [DeepWire Celebs](https://github.com/soumitraupadhyaytrinetra/celebwire) (entertainment), [CommWire](https://github.com/soumitraupadhyaytrinetra/commwire) (commodities), and [DeepWire](https://github.com/Himan-D/deepwire) (AI/deep-tech).

## Features

- 7 category landing pages (World, US & Politics, Business, Tech, Science & Health, Sports, Culture)
- Article detail pages with TL;DR, full text, importance score, related stories
- Trending sidebar with tag-driven growth tracking
- Full-text search across all ingested articles
- Dark theme, terracotta accent, Manrope typography — identical visual treatment to FinWire/Celebs/CommWire
- Read-only admin dashboard at `/admin` showing counts, source list, and trends
- All static HTML output — no client-side database, no third-party trackers
- Article ingestion pipeline via RSS → keyword classifier → optional full-text crawl → JSON store

## Getting Started

### Clone and install

```sh
git clone https://github.com/soumitraupadhyaytrinetra/worldwire.git
cd worldwire
npm install
npm run dev
```

Dev server runs at `http://localhost:4321/`.

### Ingest news feeds

```sh
npm run ingest              # all sources
npm run ingest "BBC World"  # one source only
```

### Other worker commands

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Build to `./dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run ingest` | Pull RSS from all sources into `data/articles.json` |
| `npm run process` | Backfill full content for unprocessed articles |
| `npm test` | Run classifier unit tests |

## Configuration

All site identity lives in `src/config.ts`:

```ts
export const siteConfig = {
  name: "WorldWire",
  description: "World News for Every Beat",
  url: "https://worldwire.app",
  // ...
};

export const categories = [
  { id: "world", label: "World", icon: "🌍" },
  // ...6 more
];
```

The RSS source list is in `src/lib/rss/sources.ts`. The category classifier vocabulary is in `src/lib/ai/classify.ts`.

## Project Structure

```
worldwire/
├── astro.config.mjs
├── package.json
├── vitest.config.ts
├── render.yaml
├── data/                       # runtime: articles.json, sources-state.json
├── public/
├── src/
│   ├── config.ts               # siteConfig + categories + nav
│   ├── styles/global.css       # design tokens (identical to commwire)
│   ├── layouts/{Base,Admin}Layout.astro
│   ├── components/
│   │   ├── layout/             # Header, Footer
│   │   ├── news/               # NewsCard, HeroSection, TrendingTopics
│   │   ├── search/SearchBar.astro
│   │   └── ui/                 # Badge, TimeAgo
│   ├── lib/
│   │   ├── data.ts             # JSON-backed read API
│   │   ├── utils.ts
│   │   ├── rss/{parser,sources}.ts
│   │   └── ai/classify.ts      # keyword + source-hint classifier
│   └── pages/
│       ├── index.astro
│       ├── trending.astro
│       ├── world.astro, us.astro, business.astro,
│       ├── tech.astro, science.astro, sports.astro, culture.astro
│       ├── search.astro
│       ├── api/articles.json.ts   # slim article index for client-side search
│       ├── story/[slug].astro
│       └── admin/{index,feeds,jobs,trends}.astro
├── tests/
│   └── ai/classify.test.ts
└── workers/
    ├── db-migrate.ts
    ├── rss-ingestion.ts
    └── article-processing.ts
```

## License

MIT.
