import * as fs from "fs";
import * as path from "path";

export interface Article {
  id: number;
  title: string;
  url: string;
  source: string;
  author: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  publicationDate: string;
  imageUrl: string | null;
  importanceScore: number;
  companies: string[];
  technologies: string[];
  processed: boolean;
}

let cachedArticles: Article[] | null = null;
let allArticles: Article[] | null = null;

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");

export function getAllArticles(): Article[] {
  if (allArticles) return allArticles;
  
  try {
    const filePath = path.join(DATA_DIR, "articles.json");
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, "utf-8");
    allArticles = JSON.parse(data);
    return allArticles!;
  } catch {
    return [];
  }
}

export function getArticles(options?: {
  category?: string;
  limit?: number;
  offset?: number;
  minImportance?: number;
  source?: string;
}): Article[] {
  const articles = getAllArticles();
  
  let filtered = articles.filter((a) => {
    if (options?.category && a.category !== options.category) return false;
    if (options?.minImportance && (a.importanceScore || 0) < options.minImportance) return false;
    if (options?.source && a.source !== options.source) return false;
    return true;
  });

  filtered.sort(
    (a, b) =>
      new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime()
  );

  if (options?.offset) filtered = filtered.slice(options.offset);
  if (options?.limit) filtered = filtered.slice(0, options.limit);

  return filtered;
}

export function getArticleById(id: number): Article | undefined {
  return getAllArticles().find((a) => a.id === id);
}

export function getArticleBySlug(slug: number): Article | undefined {
  return getArticleById(slug);
}

export function getTrendingArticles(limit: number = 4): Article[] {
  const articles = getAllArticles();
  const now = new Date();

  // Score blends importance with recency and cross-source signal so the
  // top-N actually rotates as new articles come in. Without the recency
  // factor the hero boxes on the homepage stay frozen on whatever had the
  // highest importanceScore on the day they were ingested.
  const scored = articles.map((a) => {
    const ageHours =
      (now.getTime() - new Date(a.publicationDate).getTime()) / (1000 * 60 * 60);
    const recencyFactor = Math.max(0, 1 - ageHours / 720); // linear decay over 30d
    const crossSource =
      (a.companies?.length || 0) + (a.technologies?.length || 0);
    const finalScore =
      (a.importanceScore || 0) * 0.3 + recencyFactor * 40 + crossSource * 3;
    return { article: a, score: finalScore };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.article);
}

export function getTopStories(limit: number = 15): Article[] {
  const articles = getAllArticles();
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  
  return articles
    .filter((a) => new Date(a.publicationDate) > threeDaysAgo)
    .sort(
      (a, b) =>
        (b.importanceScore || 0) - (a.importanceScore || 0) ||
        new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime()
    )
    .slice(0, limit);
}

export function getArticlesByCategory(category: string, limit: number = 20): Article[] {
  return getArticles({ category, limit });
}

export function getCategoryCount(category: string): number {
  return getAllArticles().filter((a) => a.category === category).length;
}

export function getTrendTopics(): Array<{
  topic: string;
  mentionCount: number;
  growthRate: number;
  category: string;
}> {
  const articles = getAllArticles();
  const now = new Date();
  const tagCounts: Record<string, { count: number; category: string }> = {};

  for (const article of articles) {
    for (const tag of article.tags) {
      if (!tagCounts[tag]) tagCounts[tag] = { count: 0, category: article.category };
      tagCounts[tag].count++;
    }
  }

  return Object.entries(tagCounts)
    .map(([topic, data]) => ({
      topic,
      mentionCount: data.count,
      growthRate: Math.min(100, Math.round(Math.random() * 80 + 10)),
      category: data.category,
    }))
    .sort((a, b) => b.mentionCount - a.mentionCount)
    .slice(0, 15);
}

export function searchArticles(query: string): Article[] {
  const q = query.toLowerCase();
  const articles = getAllArticles();
  
  return articles
    .filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.source.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q)
    )
    .sort(
      (a, b) =>
        (b.importanceScore || 0) - (a.importanceScore || 0) ||
        new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime()
    )
    .slice(0, 50);
}

export function getSources(): Array<{ name: string; articleCount: number }> {
  const articles = getAllArticles();
  const sourceMap: Record<string, number> = {};
  
  for (const article of articles) {
    sourceMap[article.source] = (sourceMap[article.source] || 0) + 1;
  }
  
  return Object.entries(sourceMap)
    .map(([name, articleCount]) => ({ name, articleCount }))
    .sort((a, b) => b.articleCount - a.articleCount);
}

export function getRelatedArticles(id: number, limit: number = 5): Article[] {
  const article = getArticleById(id);
  if (!article) return [];

  const articles = getAllArticles();
  return articles
    .filter((a) => a.id !== id)
    .map((a) => {
      const tagOverlap = a.tags.filter((t) => article.tags.includes(t)).length;
      const sameSource = a.source === article.source ? 1 : 0;
      const sameCategory = a.category === article.category ? 2 : 0;
      return { article, score: tagOverlap + sameSource + sameCategory };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.article);
}
