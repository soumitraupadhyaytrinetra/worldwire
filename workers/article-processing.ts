import * as fs from "fs";
import * as path from "path";
import { crawlArticle } from "../src/lib/content-crawler";

const DATA_DIR = path.join(process.cwd(), "data");
const ARTICLES_FILE = path.join(DATA_DIR, "articles.json");

interface StoredArticle {
  id: number; title: string; url: string; source: string;
  author: string; excerpt: string; content: string;
  category: string; tags: string[]; publicationDate: string;
  imageUrl: string | null; importanceScore: number;
  companies: string[]; technologies: string[]; processed: boolean;
}

const SKIP_SOURCES = new Set<string>([
  // No sources require crawl-skipping for the commodities pipeline.
  // Crawl delay (500ms) is the only throttle.
]);

function loadArticles(): StoredArticle[] {
  if (fs.existsSync(ARTICLES_FILE)) {
    return JSON.parse(fs.readFileSync(ARTICLES_FILE, "utf-8"));
  }
  return [];
}

function saveArticles(articles: StoredArticle[]) {
  fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2));
}

async function main() {
  const articles = loadArticles();
  console.log(`Loaded ${articles.length} articles\n`);

  const toCrawl = articles.filter(
    (a) => !a.processed && !SKIP_SOURCES.has(a.source) && a.url.startsWith("http")
  );
  console.log(`Articles to crawl: ${toCrawl.length}\n`);

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < toCrawl.length; i++) {
    const article = toCrawl[i];
    process.stdout.write(`[${i + 1}/${toCrawl.length}] ${article.source}: "${article.title.slice(0, 45)}..." `);

    const result = await crawlArticle(article.url, 10000);
    if (result && result.content.length > 100) {
      if (result.content.length > article.content.length) article.content = result.content;
      if (result.excerpt.length > article.excerpt.length) article.excerpt = result.excerpt.slice(0, 300);
      if (result.imageUrl && !article.imageUrl) article.imageUrl = result.imageUrl;
      ok++;
      console.log(`✓ ${result.content.length}c`);
    } else {
      fail++;
      console.log(`✗`);
    }

    article.processed = true;

    if (i % 25 === 0 || i === toCrawl.length - 1) {
      saveArticles(articles);
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  saveArticles(articles);
  console.log(`\nDone! OK: ${ok}, Failed: ${fail}`);
}

main().catch(console.error);
